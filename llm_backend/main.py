import sys
from pathlib import Path

# Ensure venv site-packages is in sys.path regardless of how python was invoked
_venv_site = Path(__file__).resolve().parent / "venv" / "Lib" / "site-packages"
if _venv_site.exists() and str(_venv_site) not in sys.path:
    sys.path.insert(0, str(_venv_site))

# Ensure sys.stdout and sys.stderr exist (prevent crash when spawned via pythonw / windowless)
if sys.stdout is None:
    _log_path = Path(__file__).resolve().parent / "backend.log"
    sys.stdout = open(_log_path, "a", encoding="utf-8", buffering=1)
if sys.stderr is None:
    sys.stderr = sys.stdout

import os
import time
import csv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from pathlib import Path
import fitz
from fastapi.responses import Response
import boto3
from botocore.config import Config

BASE_DIR = Path(__file__).resolve().parent.parent
RAW_DIR = BASE_DIR / "data" / "pyqs" / "raw"
DATASET_DIR = BASE_DIR / "public" / "dataset" / "raw"

# Load credentials from .env and production.env if present
for _env_candidate in [BASE_DIR / ".env", BASE_DIR / "production.env"]:
    if _env_candidate.exists():
        try:
            for _line in _env_candidate.read_text(encoding="utf-8").splitlines():
                if "=" in _line and not _line.strip().startswith("#"):
                    _k, _v = _line.split("=", 1)
                    os.environ.setdefault(_k.strip(), _v.strip().strip('"').strip("'"))
        except Exception:
            pass

# Cloudflare R2 Object Storage (Configured via Environment Variables)
_r2_account_id = os.environ.get("CLOUDFLARE_R2_ACCOUNT_ID", "3288bf4dc7bac5817897bcbd7cbe19d8")
R2_ENDPOINT = os.environ.get("CLOUDFLARE_R2_ENDPOINT", f"https://{_r2_account_id}.r2.cloudflarestorage.com")
R2_ACCESS_KEY = os.environ.get("CLOUDFLARE_R2_ACCESS_KEY_ID", "1d8c7202b9b5738a1915532b5fff6f1c")
R2_SECRET_KEY = os.environ.get("CLOUDFLARE_R2_SECRET_ACCESS_KEY", "191e3a6f3d5d72dd34a36033a1e80990c252a642a4640a2d176cc76c5f97358b")
R2_BUCKET = os.environ.get("CLOUDFLARE_R2_BUCKET", "kaizen")
R2_PUBLIC_BASE = os.environ.get("NEXT_PUBLIC_R2_URL", "https://pub-60fc676d8ba24a13a46925ab4941ddb5.r2.dev")

s3_r2 = boto3.client(
    "s3",
    endpoint_url=R2_ENDPOINT,
    aws_access_key_id=R2_ACCESS_KEY,
    aws_secret_access_key=R2_SECRET_KEY,
    config=Config(signature_version="s3v4"),
    region_name="auto"
)
MODEL_PATH = os.path.join(os.path.dirname(__file__), "models", "Llama-3.2-3B-Instruct-Q4_K_M.gguf")
CSV_PATH = BASE_DIR / "data" / "pyqs" / "sample_dataset.csv"

# Try to load llama_cpp, graceful fallback for quick testing
try:
    from llama_cpp import Llama
except ImportError:
    print("Warning: llama_cpp not installed. Inference will fail.")
    Llama = None

app = FastAPI(title="NEXUS LLM & PDF Server", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============ AUTO-SLEEP WATCHDOG (OPTIMIZATION) ============
# Shuts down automatically when idle for 5 minutes to release ~2.5GB RAM
import threading

# Auto-sleep watchdog: default 1800s (30 minutes)
IDLE_TIMEOUT_SECONDS = int(os.environ.get("IDLE_TIMEOUT_SECONDS", "1800"))
last_activity_time = time.time()

def touch_activity():
    global last_activity_time
    last_activity_time = time.time()

@app.middleware("http")
async def track_activity(request, call_next):
    touch_activity()
    response = await call_next(request)
    return response

def idle_watchdog():
    while True:
        time.sleep(15)
        idle_duration = time.time() - last_activity_time
        if idle_duration >= IDLE_TIMEOUT_SECONDS:
            print(f"\n[NEXUS OPTIMIZER] System idle for {int(idle_duration)}s (limit: {IDLE_TIMEOUT_SECONDS}s).")
            print("[NEXUS OPTIMIZER] Entering sleep mode to release ~2.5GB CPU memory. Next.js will auto-wake when requested.")
            os._exit(0)

watchdog = threading.Thread(target=idle_watchdog, daemon=True)
watchdog.start()

llm = None
_llm_lock = threading.Lock()

def get_llm():
    global llm
    if llm is None and os.path.exists(MODEL_PATH) and Llama is not None:
        with _llm_lock:
            if llm is None:
                print(f"[NEXUS] Lazy-loading model from {MODEL_PATH}...")
                try:
                    llm = Llama(
                        model_path=MODEL_PATH,
                        n_ctx=4096,
                        n_threads=10,
                        n_gpu_layers=0,
                        verbose=False
                    )
                    print("[NEXUS] Model loaded successfully on CPU!")
                except Exception as e:
                    print(f"[NEXUS] Error loading model: {e}")
                    llm = None
    return llm


def get_few_shot_examples(subject: str, max_examples: int = 5) -> str:
    """Reads the dataset and returns KIIT formatting examples for the given subject."""
    if not CSV_PATH.exists():
        return ""
        
    examples = []
    try:
        with open(CSV_PATH, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                if subject.lower() in row.get("Subject", "").lower():
                    marks = row.get("Marks", "10")
                    q_text = row.get("Question", "")
                    examples.append(f"- ({marks} marks) {q_text}")
                    if len(examples) >= max_examples:
                        break
    except Exception as e:
        print(f"Warning: Failed to read CSV for few-shot: {e}")
        
    if not examples:
        return ""
        
    ex_str = "\n".join(examples)
    return f"\n\nHere are some examples of past KIIT University questions for '{subject}' to match the difficulty and style:\n{ex_str}\n"


class GenerateRequest(BaseModel):
    prompt: str
    max_tokens: int = 1024
    temperature: float = 0.7
    top_p: float = 0.9

@app.post("/generate")
async def generate(request: GenerateRequest):
    model = get_llm()
    if model is None:
        raise HTTPException(status_code=503, detail="Local LLM model not loaded or model file not found.")
    
    try:
        start_time = time.time()
        
        # Super simple extraction of subject from the React prompt to fetch examples
        # We look for the Subject line which React inserts: "- Subject: {subject}"
        subject_str = ""
        for line in request.prompt.split('\n'):
            if "- Subject:" in line:
                subject_str = line.split(":", 1)[1].strip()
                break
                
        # Inject few-shot examples right before the assistant token
        final_prompt = request.prompt
        if subject_str:
            examples_text = get_few_shot_examples(subject_str)
            if examples_text:
                final_prompt = final_prompt.replace("<|eot_id|><|start_header_id|>assistant<|end_header_id|>", 
                                                    f"{examples_text}<|eot_id|><|start_header_id|>assistant<|end_header_id|>")
        
        output = model(
            final_prompt,
            max_tokens=request.max_tokens,
            temperature=request.temperature,
            top_p=request.top_p,
            stop=["<|eot_id|>", "<|end_of_text|>"],
            echo=False
        )
        
        end_time = time.time()
        elapsed = end_time - start_time
        completion_tokens = output["usage"]["completion_tokens"]
        
        return {
            "response": output["choices"][0]["text"],
            "usage": output["usage"],
            "time_taken": elapsed,
            "tokens_per_sec": completion_tokens / elapsed if completion_tokens > 0 and elapsed > 0 else 0
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health():
    return {
        "status": "ok",
        "model_loaded": llm is not None,
        "model": "Llama-3.2-3B-Instruct-Q4_K_M" if llm else None,
    }

class RecropRequest(BaseModel):
    sourcePdf: str
    pageNumber: int
    x0: float
    y0: float
    x1: float
    y1: float
    saveFilename: str | None = None
    dpi: int = 200
    forceGemini: bool = False
    rotation: int = 0

@app.get("/api/pdf/page")
async def get_pdf_page(pdf: str, page: int = 1, dpi: int = 150, rotation: int = 0):
    pdf_path = RAW_DIR / pdf
    if not pdf_path.exists():
        raise HTTPException(status_code=404, detail=f"PDF {pdf} not found")
    try:
        doc = fitz.open(str(pdf_path))
        page_idx = max(0, min(page - 1, len(doc) - 1))
        p = doc[page_idx]
        if rotation:
            p.set_rotation((p.rotation + rotation) % 360)
        pix = p.get_pixmap(dpi=dpi)
        img_bytes = pix.tobytes("png")
        doc.close()
        return Response(content=img_bytes, media_type="image/png")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/pdf/crop")
async def get_pdf_crop(
    pdf: str,
    page: int = 1,
    x0: float = 0,
    y0: float = 0,
    x1: float = 595,
    y1: float = 842,
    padTop: float = 0,
    padBottom: float = 0,
    padLeft: float = 0,
    padRight: float = 0,
    dpi: int = 200,
    rotation: int = 0
):
    pdf_path = RAW_DIR / pdf
    if not pdf_path.exists():
        raise HTTPException(status_code=404, detail=f"PDF {pdf} not found")
    try:
        doc = fitz.open(str(pdf_path))
        page_idx = max(0, min(page - 1, len(doc) - 1))
        p = doc[page_idx]
        if rotation:
            p.set_rotation((p.rotation + rotation) % 360)
        
        final_x0 = max(0.0, float(x0) - float(padLeft))
        final_y0 = max(0.0, float(y0) - float(padTop))
        final_x1 = min(float(p.rect.width), float(x1) + float(padRight))
        final_y1 = min(float(p.rect.height), float(y1) + float(padBottom))
        
        rect = fitz.Rect(final_x0, final_y0, final_x1, final_y1)
        pix = p.get_pixmap(clip=rect, dpi=dpi)
        img_bytes = pix.tobytes("png")
        doc.close()
        return Response(content=img_bytes, media_type="image/png")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/pdf/recrop")
async def recrop_pdf(req: RecropRequest):
    pdf_path = RAW_DIR / req.sourcePdf
    if not pdf_path.exists():
        raise HTTPException(status_code=404, detail=f"PDF {req.sourcePdf} not found")
    try:
        doc = fitz.open(str(pdf_path))
        page_idx = max(0, min(req.pageNumber - 1, len(doc) - 1))
        p = doc[page_idx]
        if req.rotation:
            p.set_rotation((p.rotation + req.rotation) % 360)
        
        final_x0 = max(0.0, float(req.x0))
        final_y0 = max(0.0, float(req.y0))
        final_x1 = min(float(p.rect.width), float(req.x1))
        final_y1 = min(float(p.rect.height), float(req.y1))
        
        rect = fitz.Rect(final_x0, final_y0, final_x1, final_y1)
        pix = p.get_pixmap(clip=rect, dpi=req.dpi)
        
        extracted_text = p.get_text("text", clip=rect).strip()
        method_used = "pymupdf_vector"

        # If vector text is sparse/empty (scanned PDF) or forceGemini is requested
        dbg_log = []
        dbg_log.append(f"forceGemini={req.forceGemini}, extracted_text_len={len(extracted_text)}")
        if req.forceGemini or len(extracted_text) < 25:
            # Always prefer reading the fresh key directly from .env file
            gemini_key = None
            for env_candidate in [BASE_DIR / ".env", BASE_DIR / "production.env"]:
                if env_candidate.exists():
                    for line in env_candidate.read_text(encoding="utf-8").splitlines():
                        line = line.strip()
                        if line.startswith("GEMINI_API_KEY="):
                            gemini_key = line.split("=", 1)[1].strip().strip('"').strip("'")
                            break
                if gemini_key:
                    break
            if not gemini_key:
                gemini_key = os.environ.get("GEMINI_API_KEY")

            dbg_log.append(f"gemini_key_prefix={gemini_key[:12] if gemini_key else 'None'}")
            if gemini_key:
                prompt = (
                    "You are an expert examination digitizer, LaTeX formatter, and technical diagram transcriber.\n"
                    "1. Transcribe the complete question text, question numbers (e.g. Q1, 5(a)), sub-parts (a, b, c, i, ii), options (A, B, C, D), and marks allocation from this cropped exam snippet.\n"
                    "2. Format all mathematical equations, formulas, variables, and matrices using standard LaTeX (e.g. $E=mc^2$, $\\int_0^\\infty f(x)dx$, $(5, 0, 8)$).\n"
                    "3. Tables: Convert any tables into clean Markdown tables.\n"
                    "4. Diagrams, Graphs & Figures: If the question contains a diagram, circuit, network graph, flowchart, state machine, or illustration:\n"
                    "   - If it can be modeled as a network topology, graph, or flowchart, provide an interactive ```mermaid or clear ASCII diagram representing the nodes, connections, labels, and weights.\n"
                    "   - Include a concise semantic description block: `> **[Diagram Context]** <clear description of the visual figure, components, directions, and labels>` so text-only AI models and students have full context even without the image.\n"
                    "5. Preserve exact code snippets in markdown code blocks.\n"
                    "Output ONLY the cleaned transcription and diagram representations, with zero conversational filler or metadata preamble."
                )

                # 1. Primary: Modern official Google GenAI SDK (google.genai)
                try:
                    from google import genai
                    from google.genai import types
                    dbg_log.append("google.genai imported successfully")
                    client = genai.Client(api_key=gemini_key)
                    part = types.Part.from_bytes(data=pix.tobytes("png"), mime_type="image/png")
                    for model_name in [
                        "gemini-flash-lite-latest",
                        "gemini-3.5-flash-lite",
                        "gemini-3.8-flash",
                        "gemini-flash-latest",
                        "gemini-2.5-flash",
                    ]:
                        try:
                            resp = client.models.generate_content(
                                model=model_name,
                                contents=[part, prompt]
                            )
                            dbg_log.append(f"model={model_name}, resp_text_len={len(resp.text) if resp and resp.text else 0}")
                            if resp and resp.text and len(resp.text.strip()) > 3:
                                extracted_text = resp.text.strip()
                                method_used = f"{model_name}_genai_vision"
                                dbg_log.append(f"SUCCESS with {method_used}")
                                break
                        except Exception as m_err:
                            dbg_log.append(f"model={model_name} failed: {m_err}")
                except Exception as g_err:
                    dbg_log.append(f"google.genai import/client failed: {g_err}")

                # 2. Legacy fallback
                if not extracted_text or extracted_text == "":
                    try:
                        import google.generativeai as leg_genai
                        leg_genai.configure(api_key=gemini_key)
                        img_data = {"mime_type": "image/png", "data": pix.tobytes("png")}
                        for model_name in ["gemini-3.8-flash", "gemini-flash-latest", "gemini-2.5-flash"]:
                            try:
                                g_model = leg_genai.GenerativeModel(model_name)
                                resp = g_model.generate_content([prompt, img_data])
                                if resp and resp.text and len(resp.text.strip()) > 3:
                                    extracted_text = resp.text.strip()
                                    method_used = f"{model_name}_legacy_vision"
                                    dbg_log.append(f"SUCCESS with {method_used}")
                                    break
                            except Exception:
                                pass
                    except Exception as leg_err:
                        dbg_log.append(f"legacy gemini failed: {leg_err}")

        try:
            (Path(__file__).resolve().parent / "recrop_debug.log").write_text("\n".join(dbg_log), encoding="utf-8")
        except:
            pass
        
        saved_path = None
        if req.saveFilename:
            filename = Path(req.saveFilename).name
            target = DATASET_DIR / filename
            pix.save(str(target))
            saved_path = f"/dataset/raw/{filename}"
            # Also sync to Cloudflare R2
            try:
                s3_r2.put_object(
                    Bucket=R2_BUCKET,
                    Key=f"dataset/raw/{filename}",
                    Body=pix.tobytes("png"),
                    ContentType="image/png",
                    CacheControl="public, max-age=31536000, immutable"
                )
            except Exception as r2_err:
                print(f"Warning: R2 upload error on recrop: {r2_err}")
            
        pw = float(p.rect.width)
        ph = float(p.rect.height)
        doc.close()
        return {
            "success": True,
            "imagePath": saved_path,
            "text": extracted_text,
            "method": method_used,
            "bbox": [final_x0, final_y0, final_x1, final_y1],
            "pageWidth": pw,
            "pageHeight": ph
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class PipelineRequest(BaseModel):
    filename: str

@app.post("/api/ingest/pipeline")
async def ingest_pipeline_endpoint(req: PipelineRequest):
    import sys
    sys.path.insert(0, str(Path(__file__).resolve().parent))
    from ingest_pipeline import ingest_document
    file_path = RAW_DIR / req.filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail=f"File {req.filename} not found in RAW_DIR")
    try:
        result = ingest_document(file_path)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    print("\nStarting NEXUS LLM Server on http://0.0.0.0:8000")
    print("Using In-Memory RAG / Few-Shot mapping from sample_dataset.csv")
    uvicorn.run(app, host="0.0.0.0", port=8000)
