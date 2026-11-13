import { spawn } from "child_process";
import path from "path";
import fs from "fs";

let isStarting = false;

/**
 * Ensures the Python LLM & PDF backend (FastAPI) is awake and responding on http://127.0.0.1:8000.
 * If asleep, automatically spawns the process and waits until ready.
 */
export async function ensureBackendRunning(timeoutMs = 25000): Promise<boolean> {
  // 1. Quick probe to see if already running
  try {
    const res = await fetch("http://127.0.0.1:8000/health", {
      signal: AbortSignal.timeout(800),
    });
    if (res.ok) return true;
  } catch {
    // Backend is asleep or starting up
  }

  // 2. Prevent race conditions with multiple parallel requests
  if (isStarting) {
    const startWait = Date.now();
    while (Date.now() - startWait < timeoutMs) {
      await new Promise((r) => setTimeout(r, 300));
      try {
        const res = await fetch("http://127.0.0.1:8000/health", {
          signal: AbortSignal.timeout(800),
        });
        if (res.ok) return true;
      } catch {}
    }
    return false;
  }

  isStarting = true;
  console.log("[NEXUS OPTIMIZER] Python backend is sleeping. Auto-waking up on demand...");

  try {
    const projectRoot = process.cwd();
    const isWindows = process.platform === "win32";

    // Use python.exe from venv; fallback to system python if not found
    const venvPython = isWindows
      ? path.join(projectRoot, "llm_backend", "venv", "Scripts", "python.exe")
      : path.join(projectRoot, "llm_backend", "venv", "bin", "python");
    
    const pythonPath = fs.existsSync(venvPython) ? venvPython : "python";
    const scriptPath = path.join(projectRoot, "llm_backend", "main.py");
    const logPath = path.join(projectRoot, "llm_backend", "backend.log");

    // Open log file in append mode to capture all startup & crash logs
    const logFd = fs.openSync(logPath, "a");

    const child = spawn(pythonPath, [scriptPath], {
      cwd: projectRoot,
      shell: false,
      detached: true,
      stdio: ["ignore", logFd, logFd],
      windowsHide: true,
      env: {
        ...process.env,
        PYTHONPATH: path.join(projectRoot, "llm_backend"),
      },
    });

    child.on("error", (err) => {
      console.error("[NEXUS OPTIMIZER] Python spawn error:", err);
      try {
        fs.appendFileSync(logPath, `\n[SPAWN ERROR] ${new Date().toISOString()} ${err.message}\n`);
      } catch {}
    });

    child.unref();

    // 3. Poll /health with exponential backoff until server responds
    const startTime = Date.now();
    let pollDelay = 200;
    while (Date.now() - startTime < timeoutMs) {
      await new Promise((r) => setTimeout(r, pollDelay));
      try {
        const res = await fetch("http://127.0.0.1:8000/health", {
          signal: AbortSignal.timeout(800),
        });
        if (res.ok) {
          console.log("[NEXUS OPTIMIZER] Python backend is awake and ready! (Auto-sleeps after 30m of inactivity)");
          isStarting = false;
          return true;
        }
      } catch {}
      // Gradual backoff up to 500ms
      pollDelay = Math.min(500, pollDelay + 50);
    }
  } catch (err) {
    console.error("[NEXUS OPTIMIZER] Failed to auto-launch Python backend:", err);
  } finally {
    isStarting = false;
  }

  return false;
}
