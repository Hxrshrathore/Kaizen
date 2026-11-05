import { spawn } from "child_process";
import path from "path";

let isStarting = false;

/**
 * Ensures the Python LLM & PDF backend (FastAPI) is awake and responding on http://127.0.0.1:8000.
 * If asleep, automatically spawns the process and waits until ready.
 */
export async function ensureBackendRunning(timeoutMs = 15000): Promise<boolean> {
  // 1. Quick probe to see if already running
  try {
    const res = await fetch("http://127.0.0.1:8000/health", {
      signal: AbortSignal.timeout(600),
    });
    if (res.ok) return true;
  } catch {
    // Backend is asleep or starting up
  }

  // 2. Prevent race conditions with multiple parallel requests
  if (isStarting) {
    const startWait = Date.now();
    while (Date.now() - startWait < timeoutMs) {
      await new Promise((r) => setTimeout(r, 400));
      try {
        const res = await fetch("http://127.0.0.1:8000/health", {
          signal: AbortSignal.timeout(600),
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
    const pythonPath = isWindows
      ? path.join(projectRoot, "llm_backend", "venv", "Scripts", "python.exe")
      : path.join(projectRoot, "llm_backend", "venv", "bin", "python");

    const scriptPath = path.join(projectRoot, "llm_backend", "main.py");

    const child = spawn(pythonPath, ["-u", scriptPath], {
      cwd: projectRoot,
      detached: true,
      stdio: "ignore",
      windowsHide: true,
    });
    child.unref();

    // 3. Poll /health until server responds
    const startTime = Date.now();
    while (Date.now() - startTime < timeoutMs) {
      await new Promise((r) => setTimeout(r, 400));
      try {
        const res = await fetch("http://127.0.0.1:8000/health", {
          signal: AbortSignal.timeout(600),
        });
        if (res.ok) {
          console.log("[NEXUS OPTIMIZER] Python backend is awake and ready! (Auto-sleeps after 5m of inactivity)");
          isStarting = false;
          return true;
        }
      } catch {}
    }
  } catch (err) {
    console.error("[NEXUS OPTIMIZER] Failed to auto-launch Python backend:", err);
  } finally {
    isStarting = false;
  }

  return false;
}

