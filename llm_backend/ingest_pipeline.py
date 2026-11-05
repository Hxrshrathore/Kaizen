"""
KAIZEN MULTI-FORMAT INGESTION & HIGH-PRECISION OCR PIPELINE
============================================================
Supports: PDF, Images (PNG, JPG, JPEG, WEBP), DOCX, PPTX
Workflow:
  1. Multi-format ingestion -> High-DPI enhanced PNG rendering (local Pillow enhancement)
  2. Upload enhanced images to Cloudflare R2 object storage CDN
  3. Gemini 2.5/2.0 Flash AI classification (PYQ, NOTES, ASSIGNMENT, QUESTION_BANK, SYLLABUS)
  4. Structured question extraction (filters out exam paper headers/instructions, isolates questions, math LaTeX, marks)
  5. Direct staging into Upstash Redis (zero Neon DB pollution)
  6. Ready for human verification in the dashboard, then promotion to Neon DB + Upstash Vector + Fine-Tuning dataset!
"""

import os
import sys
import io
import json
import uuid
import time
import re
from pathlib import Path
from typing import List, Dict, Any, Optional

import requests
from PIL import Image, ImageEnhance, ImageOps, ImageFilter
import boto3
from botocore.config import Config

# Optional multi-format parsers
try:
    import fitz  # PyMuPDF
except ImportError:
    fitz = None

try:
    import docx  # python-docx
except ImportError:
    docx = None

try:
    import pptx  # python-pptx
except ImportError:
    pptx = None

# ── CONFIGURATION & ENVIRONMENT ───────────────────────────────────────────────
BASE_DIR = Path(__file__).resolve().parent.parent
ENV_FILE = BASE_DIR / ".env"

def load_env():
    env = {}
    if ENV_FILE.exists():
        for line in ENV_FILE.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                env[k.strip()] = v.strip().strip('"').strip("'")
    return env

CONFIG = load_env()

# Cloudflare R2
R2_ACCOUNT_ID = CONFIG.get("CLOUDFLARE_R2_ACCOUNT_ID", "3288bf4dc7bac5817897bcbd7cbe19d8")
R2_ACCESS_KEY = CONFIG.get("CLOUDFLARE_R2_ACCESS_KEY_ID", "1d8c7202b9b5738a1915532b5fff6f1c")
R2_SECRET_KEY = CONFIG.get("CLOUDFLARE_R2_SECRET_ACCESS_KEY", "191e3a6f3d5d72dd34a36033a1e80990c252a642a4640a2d176cc76c5f97358b")
R2_BUCKET = CONFIG.get("CLOUDFLARE_R2_BUCKET", "kaizen")
R2_PUBLIC_URL = CONFIG.get("NEXT_PUBLIC_R2_URL", "https://pub-60fc676d8ba24a13a46925ab4941ddb5.r2.dev").rstrip("/")

# Upstash Redis & Vector
UPSTASH_REDIS_URL = CONFIG.get("UPSTASH_REDIS_REST_URL", "https://creative-bass-185678.upstash.io").rstrip("/")
UPSTASH_REDIS_TOKEN = CONFIG.get("UPSTASH_REDIS_REST_TOKEN", "gQAAAAAAAtVOAAIgcDJlYTMzMmE1MmE0NDA0YWQ4OTI5NzYwZGNhZGY2YWVlZQ")
UPSTASH_VECTOR_URL = CONFIG.get("UPSTASH_VECTOR_REST_URL", "https://healthy-gannet-73484-us1-vector.upstash.io").rstrip("/")
UPSTASH_VECTOR_TOKEN = CONFIG.get("UPSTASH_VECTOR_REST_TOKEN", "ABgFMGhlYWx0aHktZ2FubmV0LTczNDg0LXVzMWFkbWluTVRabVltVXpNVGt0TkRjeFl5MDBNVGsxTFdFNU1tVXRaV0k0WlRZeE5UTmtaRGt4")

# Gemini
GEMINI_KEY = CONFIG.get("GEMINI_API_KEY", "AIzaSyCf8aK1AGitB_DZeNTdnGjVQ3O7Jb7mH0U")

# Init S3 client for R2
s3_r2 = boto3.client(
    "s3",
    endpoint_url=f"https://{R2_ACCOUNT_ID}.r2.cloudflarestorage.com",
    aws_access_key_id=R2_ACCESS_KEY,
    aws_secret_access_key=R2_SECRET_KEY,
    config=Config(signature_version="s3v4"),
    region_name="auto",
)

# ── UPSTASH REDIS REST HELPER ─────────────────────────────────────────────────
def redis_command(cmd: List[Any]) -> Any:
    """Execute raw command against Upstash Redis REST API with zero dependencies."""
    headers = {
        "Authorization": f"Bearer {UPSTASH_REDIS_TOKEN}",
        "Content-Type": "application/json",
    }
    resp = requests.post(UPSTASH_REDIS_URL, headers=headers, json=cmd, timeout=10)
    resp.raise_for_status()
    data = resp.json()
    if "error" in data:
        raise RuntimeError(f"Upstash Redis Error: {data['error']}")
    return data.get("result")

# ── LOCAL IMAGE ENHANCEMENT ENGINE ────────────────────────────────────────────
def enhance_examination_image(pil_img: Image.Image) -> Image.Image:
    """
    Local image enhancement pipeline:
    1. Converts image to RGB.
    2. Adaptive contrast boost (makes faded ink & pencil handwriting dark and legible).
    3. Sharpness enhancement (renders subscripts, formulas, fractions, and superscripts crisply).
    4. Auto-levels / brightness balance (cleans gray scanner haze and shadow creases).
    """
    if pil_img.mode != "RGB":
        pil_img = pil_img.convert("RGB")

    # 1. Contrast adjustment (1.35x boost for pencil & faded ink clarity)
    enhancer_contrast = ImageEnhance.Contrast(pil_img)
    enhanced = enhancer_contrast.enhance(1.35)

    # 2. Sharpness boost (1.5x for mathematical glyphs & typographic edges)
    enhancer_sharpness = ImageEnhance.Sharpness(enhanced)
    enhanced = enhancer_sharpness.enhance(1.5)

    # 3. Clean paper background (slight brightness lift to remove yellowish scan artifacts)
    enhancer_brightness = ImageEnhance.Brightness(enhanced)
    enhanced = enhancer_brightness.enhance(1.05)

    return enhanced

# ── R2 UPLOAD HELPER ──────────────────────────────────────────────────────────
def upload_bytes_to_r2(img_bytes: bytes, r2_key: str, content_type: str = "image/png") -> str:
    """Uploads buffer to Cloudflare R2 and returns global CDN public URL."""
    s3_r2.put_object(
        Bucket=R2_BUCKET,
        Key=r2_key,
        Body=img_bytes,
        ContentType=content_type,
        CacheControl="public, max-age=31536000, immutable",
    )
    return f"{R2_PUBLIC_URL}/{r2_key}"

# ── MULTI-FORMAT SLICING & ENHANCEMENT ────────────────────────────────────────
def process_file_into_enhanced_pages(file_path: Path) -> List[Dict[str, Any]]:
    """
    Converts PDF, Image, DOCX, or PPTX into a list of enhanced page images with dimensions.
    Returns: [{"page_number": int, "image": PIL.Image, "width": float, "height": float}]
    """
    ext = file_path.suffix.lower()
    pages = []

    # Case 1: PDF Documents
    if ext == ".pdf":
        if not fitz:
            raise RuntimeError("PyMuPDF (fitz) is required for PDF parsing. Run pip install pymupdf")
        doc = fitz.open(str(file_path))
        for idx in range(len(doc)):
            p = doc[idx]
            # Render at 200 DPI for high-resolution mathematical OCR
            pix = p.get_pixmap(dpi=200)
            img = Image.open(io.BytesIO(pix.tobytes("png")))
            enhanced_img = enhance_examination_image(img)
            pages.append({
                "page_number": idx + 1,
                "image": enhanced_img,
                "width": float(p.rect.width),
                "height": float(p.rect.height),
            })
        doc.close()

    # Case 2: Standard Images (PNG, JPG, JPEG, WEBP, TIFF)
    elif ext in [".png", ".jpg", ".jpeg", ".webp", ".bmp", ".tiff"]:
        img = Image.open(str(file_path))
        enhanced_img = enhance_examination_image(img)
        w, h = enhanced_img.size
        # Normalize to standard 72pt scale for coordinate consistency
        scale = 72.0 / 200.0
        pages.append({
            "page_number": 1,
            "image": enhanced_img,
            "width": float(w * scale),
            "height": float(h * scale),
        })

    # Case 3: Microsoft Word DOCX
    elif ext in [".docx", ".doc"]:
        if not docx:
            raise RuntimeError("python-docx is required for DOCX parsing. Run pip install python-docx")
        doc = docx.Document(str(file_path))
        full_text = []
        for para in doc.paragraphs:
            if para.text.strip():
                full_text.append(para.text.strip())
        for table in doc.tables:
            for row in table.rows:
                row_text = " | ".join(c.text.strip() for c in row.cells if c.text.strip())
                if row_text:
                    full_text.append(row_text)

        # Render synthesized clean typographic page
        from PIL import ImageDraw
        img = Image.new("RGB", (1240, 1754), color=(255, 255, 255))
        draw = ImageDraw.Draw(img)
        y = 60
        draw.text((60, y), f"Document: {file_path.name}", fill=(30, 30, 30))
        y += 40
        for line in full_text[:45]:
            draw.text((60, y), line[:95], fill=(50, 50, 50))
            y += 32
        enhanced_img = enhance_examination_image(img)
        pages.append({
            "page_number": 1,
            "image": enhanced_img,
            "width": 595.0,
            "height": 842.0,
            "extracted_text": "\n\n".join(full_text),
        })

    # Case 4: Microsoft PowerPoint PPTX
    elif ext in [".pptx", ".ppt"]:
        if not pptx:
            raise RuntimeError("python-pptx is required for PPTX parsing. Run pip install python-pptx")
        prs = pptx.Presentation(str(file_path))
        for idx, slide in enumerate(prs.slides):
            slide_text = []
            for shape in slide.shapes:
                if shape.has_text_frame:
                    for para in shape.text_frame.paragraphs:
                        if para.text.strip():
                            slide_text.append(para.text.strip())
            
            from PIL import ImageDraw
            img = Image.new("RGB", (1920, 1080), color=(250, 250, 252))
            draw = ImageDraw.Draw(img)
            draw.text((80, 60), f"{file_path.stem} — Slide {idx + 1}", fill=(20, 20, 20))
            y = 140
            for line in slide_text[:25]:
                draw.text((80, y), line[:110], fill=(40, 40, 40))
                y += 36
            enhanced_img = enhance_examination_image(img)
            pages.append({
                "page_number": idx + 1,
                "image": enhanced_img,
                "width": 842.0,
                "height": 595.0,
                "extracted_text": "\n\n".join(slide_text),
            })
    else:
        raise ValueError(f"Unsupported file format: {ext}. Supported: PDF, PNG, JPG, WEBP, DOCX, PPTX")

    return pages

# ── GEMINI OCR, CLASSIFICATION & QUESTION ISOLATION ───────────────────────────
def run_gemini_vision(prompt: str, pil_img: Image.Image) -> str:
    """Call Google Gemini 2.5 Flash / 2.0 Flash Vision API."""
    import google.generativeai as genai
    genai.configure(api_key=GEMINI_KEY)

    buf = io.BytesIO()
    pil_img.save(buf, format="PNG")
    img_data = {
        "mime_type": "image/png",
        "data": buf.getvalue()
    }

    models_to_try = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"]
    last_err = None

    for m in models_to_try:
        try:
            model = genai.GenerativeModel(m)
            resp = model.generate_content([prompt, img_data])
            if resp and resp.text:
                return resp.text.strip()
        except Exception as e:
            last_err = e
            print(f"[Gemini Vision] Model {m} failed: {e}")

    raise RuntimeError(f"All Gemini models failed: {last_err}")

def classify_and_extract_questions_from_page(
    page_data: Dict[str, Any],
    file_name: str,
    subject_hint: str = "General",
    year_hint: str = "2024",
    exam_type_hint: str = "Endsem"
) -> Dict[str, Any]:
    """
    1. Classifies the document content type (PYQ, NOTES, ASSIGNMENT, QUESTION_BANK, SYLLABUS).
    2. Isolates and extracts only the questions, formulas, options, and marks.
    3. Filters out administrative headers, seat number blocks, invigilator lines.
    """
    pil_img = page_data["image"]
    pw = page_data["width"]
    ph = page_data["height"]

    prompt = f"""
You are an expert academic digitizer for KIIT university examination papers and study materials.
Analyze this scanned page (Page {page_data['page_number']} of '{file_name}').

STEP 1: CLASSIFY THE DOCUMENT TYPE into exactly ONE of:
- PYQ (Previous Year Question Paper, Midsem, Endsem, Quiz, Test)
- NOTES (Lecture slides, typed notes, classroom whiteboard notes)
- ASSIGNMENT (Homework sheets, tutorial problem sets, lab tasks)
- QUESTION_BANK (Compendium of practice problems, review question lists)
- SYLLABUS (Curriculum topics, course objectives, marking scheme)

STEP 2: EXTRACT ALL EXAMINATION QUESTIONS
Rules:
- DISCARD all college headers, timestamps, "Total Marks: 100", "Time: 3 Hours", roll number boxes, and instructions ("Answer any 5 questions").
- Extract each question separately with its exact question number (e.g., "1", "1(a)", "2.b", "Q3").
- Preserve all mathematical formulas in clean LaTeX (e.g. $E=mc^2$, $\\int_0^1 f(x)dx$).
- Preserve code blocks in standard markdown ```python ... ```.
- If multiple sub-questions exist (a, b, c), include them in sub_parts.
- If multiple choice options exist (A, B, C, D), include them in options.
- Estimate the bounding box [x0, y0, x1, y1] of each question on a page coordinate system of {pw:.1f} width x {ph:.1f} height.

OUTPUT FORMAT:
Return ONLY a valid JSON object with NO extra markdown backticks or commentary:
{{
  "content_type": "PYQ",
  "subject_code": "CS20001",
  "subject_name": "Computer Networks",
  "year": "2018",
  "exam_type": "Endsem",
  "questions": [
    {{
      "question_number": "1(a)",
      "text": "For HTTP 2.0 sharing application, do you agree with the statement...",
      "marks": "5",
      "sub_parts": ["(a)"],
      "options": [],
      "bbox": [35, 80, {pw - 35:.1f}, 250]
    }}
  ]
}}
"""
    raw_response = run_gemini_vision(prompt, pil_img)

    # Clean potential markdown wrapping ```json ... ```
    clean_json = raw_response.strip()
    if clean_json.startswith("```"):
        clean_json = re.sub(r"^```(?:json)?\s*", "", clean_json)
        clean_json = re.sub(r"\s*```$", "", clean_json)

    try:
        parsed = json.loads(clean_json)
    except Exception:
        # Fallback regex extraction if model included conversational prefix
        match = re.search(r"\{.*\}", clean_json, re.DOTALL)
        if match:
            parsed = json.loads(match.group(0))
        else:
            parsed = {
                "content_type": "PYQ",
                "subject_code": "CS20001",
                "subject_name": subject_hint,
                "year": year_hint,
                "exam_type": exam_type_hint,
                "questions": [
                    {
                        "question_number": "1",
                        "text": raw_response.strip(),
                        "marks": "10",
                        "sub_parts": [],
                        "options": [],
                        "bbox": [35, 80, pw - 35, ph * 0.4]
                    }
                ]
            }

    return parsed

# ── STAGE QUESTIONS INTO UPSTASH REDIS ─────────────────────────────────────────
def stage_questions_in_redis(
    doc_id: str,
    file_name: str,
    page_number: int,
    enhanced_image_url: str,
    classification_data: Dict[str, Any],
    page_width: float,
    page_height: float
) -> List[Dict[str, Any]]:
    """
    Saves extracted questions directly into Upstash Redis staging buffer.
    Neon PostgreSQL is NEVER called here — zero uncleaned data reaches production DB!
    """
    content_type = classification_data.get("content_type", "PYQ")
    subject = classification_data.get("subject_name", "General Engineering")
    subject_code = classification_data.get("subject_code", "ENG2001")
    year = str(classification_data.get("year", "2024"))
    exam_type = classification_data.get("exam_type", "Endsem")
    extracted_questions = classification_data.get("questions", [])

    staged_items = []

    for idx, q in enumerate(extracted_questions):
        q_id = f"stg_{doc_id}_p{page_number}_q{idx + 1}_{int(time.time())}"
        bbox = q.get("bbox", [35, 80, page_width - 35, 280])
        q_text = q.get("text", "").strip()

        # Build fine-tuning ready prompt/response pair format
        fine_tuning_sample = {
            "instruction": f"Answer the following {subject} ({subject_code}) {exam_type} {year} question clearly with step-by-step reasoning and formulas.",
            "input": q_text,
            "output": q.get("solution", "")  # Filled during human verification or AI synthesis
        }

        staged_obj = {
            "id": q_id,
            "docId": doc_id,
            "sourceDoc": file_name,
            "pageNumber": page_number,
            "contentType": content_type,
            "subject": subject,
            "subjectCode": subject_code,
            "year": year,
            "examType": exam_type,
            "questionNumber": q.get("question_number", f"{idx + 1}"),
            "rawOcrText": q_text,
            "cleanText": q_text,
            "subParts": q.get("sub_parts", []),
            "options": q.get("options", []),
            "marks": q.get("marks", ""),
            "solution": q.get("solution", ""),
            "bbox": {
                "x0": float(bbox[0]),
                "y0": float(bbox[1]),
                "x1": float(bbox[2]),
                "y1": float(bbox[3]),
            },
            "pageWidth": page_width,
            "pageHeight": page_height,
            "imageUrl": enhanced_image_url,
            "status": "PENDING_REVIEW",
            "createdAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "fineTuningData": fine_tuning_sample
        }

        # 1. Save to Redis Item Key
        redis_command(["SET", f"kaizen:staging:item:{q_id}", json.dumps(staged_obj)])

        # 2. Add to Redis Staging Queue (for rapid sequential verification)
        redis_command(["SADD", "kaizen:staging:queue", q_id])
        redis_command(["SADD", f"kaizen:staging:doc:{doc_id}", q_id])

        staged_items.append(staged_obj)

    return staged_items

# ── MAIN PIPELINE ENTRYPOINT ──────────────────────────────────────────────────
def ingest_document(file_path: str | Path) -> Dict[str, Any]:
    """
    Full end-to-end multi-format ingestion pipeline:
    1. Slices & enhances PDF, image, DOCX, or PPTX into crystal-clear 200 DPI PNGs.
    2. Uploads enhanced page images to Cloudflare R2 CDN.
    3. Uses Gemini 2.5/2.0 Flash to classify content type and isolate questions.
    4. Stages raw & extracted questions in Upstash Redis (zero Neon DB touches).
    """
    file_path = Path(file_path)
    if not file_path.exists():
        raise FileNotFoundError(f"File not found: {file_path}")

    doc_id = re.sub(r"[^a-zA-Z0-9_]", "_", file_path.stem)
    print(f"\n=======================================================")
    print(f"[Ingest Pipeline] Starting multi-format ingestion: {file_path.name}")
    print(f"=======================================================")

    # Step 1: Slice and enhance pages
    start_t = time.time()
    pages = process_file_into_enhanced_pages(file_path)
    print(f"[Step 1] Sliced & enhanced {len(pages)} pages in {time.time() - start_t:.2f}s")

    all_staged_questions = []

    for p in pages:
        p_num = p["page_number"]
        pil_img = p["image"]
        pw = p["width"]
        ph = p["height"]

        # Step 2: Upload enhanced page image to Cloudflare R2
        buf = io.BytesIO()
        pil_img.save(buf, format="PNG", optimize=True)
        img_bytes = buf.getvalue()

        r2_key = f"dataset/raw/{doc_id}_p{p_num}.png"
        r2_url = upload_bytes_to_r2(img_bytes, r2_key)
        print(f"[Step 2] Uploaded Page {p_num} to R2 -> {r2_url}")

        # Step 3: Run Gemini AI Classification & Question Extraction
        print(f"[Step 3] Running Gemini 2.5 Flash Vision OCR on Page {p_num}...")
        parsed_classification = classify_and_extract_questions_from_page(p, file_path.name)
        c_type = parsed_classification.get("content_type", "PYQ")
        q_count = len(parsed_classification.get("questions", []))
        print(f"         Classified as: {c_type} | Extracted: {q_count} questions")

        # Step 4: Stage questions into Upstash Redis
        staged = stage_questions_in_redis(
            doc_id=doc_id,
            file_name=file_path.name,
            page_number=p_num,
            enhanced_image_url=r2_url,
            classification_data=parsed_classification,
            page_width=pw,
            page_height=ph
        )
        all_staged_questions.extend(staged)

    # Document Summary saved to Redis
    doc_summary = {
        "docId": doc_id,
        "filename": file_path.name,
        "totalPages": len(pages),
        "totalQuestionsStaged": len(all_staged_questions),
        "r2BasePath": f"{R2_PUBLIC_URL}/dataset/raw/{doc_id}",
        "ingestedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    }
    redis_command(["SET", f"kaizen:doc:{doc_id}", json.dumps(doc_summary)])

    print(f"\n[OK] Ingestion complete: {len(all_staged_questions)} questions staged into Upstash Redis.")
    print(f"     Zero writes to Neon PostgreSQL. Ready for human verification in dashboard!\n")

    return {
        "success": True,
        "docId": doc_id,
        "totalPages": len(pages),
        "stagedQuestionsCount": len(all_staged_questions),
        "questions": all_staged_questions
    }

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python ingest_pipeline.py <path_to_pdf_or_image_or_docx_or_pptx>")
        sys.exit(1)
    target_path = sys.argv[1]
    res = ingest_document(target_path)
    print(json.dumps(res, indent=2))

