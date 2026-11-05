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

BASE_DIR = Path(__file__).parent.parent
RAW_DIR = BASE_DIR / "data" / "pyqs" / "raw"
DATASET_DIR = BASE_DIR / "public" / "dataset" / "raw"

# Cloudflare R2 Object Storage
R2_ENDPOINT = "https://3288bf4dc7bac5817897bcbd7cbe19d8.r2.cloudflarestorage.com"
R2_ACCESS_KEY = "1d8c7202b9b5738a1915532b5fff6f1c"
R2_SECRET_KEY = "191e3a6f3d5d72dd34a36033a1e80990c252a642a4640a2d176cc76c5f97358b"
R2_BUCKET = "kaizen"
R2_PUBLIC_BASE = "https://pub-60fc676d8ba24a13a46925ab4941ddb5.r2.dev"

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

IDLE_TIMEOUT_SECONDS = int(os.environ.get("IDLE_TIMEOUT_SECONDS", "300"))
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

print(f"Loading model from {MODEL_PATH}...")
if not os.path.exists(MODEL_PATH) or Llama is None:
    print("ERROR: Model file not found or llama_cpp missing!")
    llm = None
else:
    try:
        # Load with optimal CPU settings for 16GB RAM
        llm = Llama(
            model_path=MODEL_PATH,
            n_ctx=4096,
            n_threads=10,
            n_gpu_layers=0,  
            verbose=False
        )
        print("Model loaded successfully on CPU!")
    except Exception as e:
        print(f"Error loading model: {e}")
        llm = None


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
    if llm is None:
        raise HTTPException(status_code=503, detail="Model not loaded. Check server logs.")
    
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
        
        output = llm(
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

@app.get("/api/pdf/page")
async def get_pdf_page(pdf: str, page: int = 1, dpi: int = 150):
    pdf_path = RAW_DIR / pdf
    if not pdf_path.exists():
        raise HTTPException(status_code=404, detail=f"PDF {pdf} not found")
    try:
        doc = fitz.open(str(pdf_path))
        page_idx = max(0, min(page - 1, len(doc) - 1))
        p = doc[page_idx]
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
    dpi: int = 200
):
    pdf_path = RAW_DIR / pdf
    if not pdf_path.exists():
        raise HTTPException(status_code=404, detail=f"PDF {pdf} not found")
    try:
        doc = fitz.open(str(pdf_path))
        page_idx = max(0, min(page - 1, len(doc) - 1))
        p = doc[page_idx]
        
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
        
        final_x0 = max(0.0, float(req.x0))
        final_y0 = max(0.0, float(req.y0))
        final_x1 = min(float(p.rect.width), float(req.x1))
        final_y1 = min(float(p.rect.height), float(req.y1))
        
        rect = fitz.Rect(final_x0, final_y0, final_x1, final_y1)
        pix = p.get_pixmap(clip=rect, dpi=req.dpi)
        
        extracted_text = p.get_text("text", clip=rect).strip()
        method_used = "pymupdf_vector"

        # If vector text is sparse/empty (scanned PDF) or forceGemini is requested
        if req.forceGemini or len(extracted_text) < 15:
            gemini_key = os.environ.get("GEMINI_API_KEY")
            if not gemini_key and (BASE_DIR / ".env").exists():
                for line in (BASE_DIR / ".env").read_text(encoding="utf-8").split("\n"):
                    if line.startswith("GEMINI_API_KEY="):
                        gemini_key = line.split("=", 1)[1].strip().strip('"').strip("'")
                        break
            if gemini_key:
                try:
                    import google.generativeai as genai
                    genai.configure(api_key=gemini_key)
                    g_model = genai.GenerativeModel("gemini-1.5-flash")
                    img_data = {
                        "mime_type": "image/png",
                        "data": pix.tobytes("png")
                    }
                    prompt = (
                        "Extract the exact examination question and text from this snippet. "
                        "Preserve question numbers, full question sentences, code blocks with proper line breaks, "
                        "and multiple-choice options (a, b, c, d). Output only the raw question text without introductory or markdown conversational commentary."
                    )
                    resp = g_model.generate_content([prompt, img_data])
                    if resp and resp.text and len(resp.text.strip()) > len(extracted_text):
                        extracted_text = resp.text.strip()
                        method_used = "gemini_vision_ocr"
                except Exception as g_err:
                    print(f"Warning: Gemini OCR fallback error: {g_err}")
        
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

if __name__ == "__main__":
    import uvicorn
    print("\nStarting NEXUS LLM Server on http://0.0.0.0:8000")
    print("Using In-Memory RAG / Few-Shot mapping from sample_dataset.csv")
    uvicorn.run(app, host="0.0.0.0", port=8000)
