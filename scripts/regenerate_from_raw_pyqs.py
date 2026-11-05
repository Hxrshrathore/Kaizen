"""
KAIZEN MULTI-FORMAT REGENERATION & HIGH-PRECISION OCR INGESTION
==============================================================
Regenerates the complete dataset from raw examination PDFs:
1. PyMuPDF 200 DPI high-resolution rendering
2. Local Pillow enhancement (adaptive contrast, edge sharpening, scanner haze removal)
3. Direct upload to Cloudflare R2 bucket (cdn url: https://pub-60fc676d8ba24a13a46925ab4941ddb5.r2.dev)
4. Gemini 2.5 Flash / 2.0 Flash Vision OCR with rate-limit pacing and automatic retries
   - Classifies content type (PYQ, NOTES, ASSIGNMENT, QUESTION_BANK, SYLLABUS)
   - Discards university headers, instructions, roll numbers
   - Isolates individual questions, subparts, marks, and LaTeX formulas
   - Calculates precise bounding boxes [x0, y0, x1, y1]
5. Stages clean questions into Upstash Redis (kaizen:staging:item:* and kaizen:staging:queue)
   - Formatted for direct human review in Data Ingestion Studio
   - Pre-formatted fine-tuning instruction-response pairs for LLM training
"""

import os
import sys
import io
import time
import json
import re
from pathlib import Path
from typing import List, Dict, Any, Optional

import requests
from PIL import Image, ImageEnhance
import boto3
from botocore.config import Config
import fitz  # PyMuPDF
import google.generativeai as genai

# ── DIRECTORY CONFIGURATION ──────────────────────────────────────────────────
BASE_DIR = Path(__file__).resolve().parent.parent
RAW_DIR = BASE_DIR / "data" / "pyqs" / "raw"
ENV_FILE = BASE_DIR / ".env"

def load_env() -> Dict[str, str]:
    env = {}
    if ENV_FILE.exists():
        for line in ENV_FILE.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                env[k.strip()] = v.strip().strip('"').strip("'")
    return env

CONFIG = load_env()

# Cloudflare R2 Credentials
R2_ACCOUNT_ID = CONFIG.get("CLOUDFLARE_R2_ACCOUNT_ID") or os.environ.get("CLOUDFLARE_R2_ACCOUNT_ID", "")
R2_ACCESS_KEY = CONFIG.get("CLOUDFLARE_R2_ACCESS_KEY_ID") or os.environ.get("CLOUDFLARE_R2_ACCESS_KEY_ID", "")
R2_SECRET_KEY = CONFIG.get("CLOUDFLARE_R2_SECRET_ACCESS_KEY") or os.environ.get("CLOUDFLARE_R2_SECRET_ACCESS_KEY", "")
R2_BUCKET = CONFIG.get("CLOUDFLARE_R2_BUCKET") or os.environ.get("CLOUDFLARE_R2_BUCKET", "kaizen")
R2_PUBLIC_URL = (CONFIG.get("NEXT_PUBLIC_R2_URL") or os.environ.get("NEXT_PUBLIC_R2_URL", "https://pub-60fc676d8ba24a13a46925ab4941ddb5.r2.dev")).rstrip("/")

# Upstash Redis Credentials
UPSTASH_REDIS_URL = (CONFIG.get("UPSTASH_REDIS_REST_URL") or os.environ.get("UPSTASH_REDIS_REST_URL", "")).rstrip("/")
UPSTASH_REDIS_TOKEN = CONFIG.get("UPSTASH_REDIS_REST_TOKEN") or os.environ.get("UPSTASH_REDIS_REST_TOKEN", "")

# Gemini Vision API Key
GEMINI_KEY = CONFIG.get("GEMINI_API_KEY") or os.environ.get("GEMINI_API_KEY", "")
if GEMINI_KEY:
    genai.configure(api_key=GEMINI_KEY)

# Initialize R2 S3 Client
s3_r2 = boto3.client(
    "s3",
    endpoint_url=f"https://{R2_ACCOUNT_ID}.r2.cloudflarestorage.com",
    aws_access_key_id=R2_ACCESS_KEY,
    aws_secret_access_key=R2_SECRET_KEY,
    config=Config(signature_version="s3v4", max_pool_connections=20),
    region_name="auto",
)

# ── SUBJECT CODE CANONICAL RULES ──────────────────────────────────────────────
SUBJECT_RULES = [
    {"code": "CS20001", "name": "Computer Networks", "regex": r"\b(computer[\s_-]*networks?|cn)\b"},
    {"code": "CS20006", "name": "Database Management Systems", "regex": r"\b(database[\s_-]*management[\s_-]*systems?|dbms)\b"},
    {"code": "CS20002", "name": "Operating Systems", "regex": r"\b(operating[\s_-]*systems?|os)\b"},
    {"code": "CS20003", "name": "Design & Analysis of Algorithms", "regex": r"\b(design\s*(&|and)?\s*analysis\s*of\s*algorithms?|daa|algorithms?)\b"},
    {"code": "CS20004", "name": "Software Engineering", "regex": r"\b(software[\s_-]*engineering|se)\b"},
    {"code": "CS21001", "name": "Data Structures", "regex": r"\b(data[\s_-]*structures?|ds)\b"},
    {"code": "MA21002", "name": "Discrete Structures", "regex": r"\b(discrete[\s_-]*(structures?|mathematics?)|dm)\b"},
    {"code": "MA21001", "name": "Probability and Statistics", "regex": r"\b(probability[\s_-]*(and|&)?[\s_-]*statistics?|prob[\s_-]*stat)\b"},
    {"code": "HS20001", "name": "Engineering Economics & Costing", "regex": r"\b(engineering[\s_-]*economics?(\s*(&|and)\s*costing)?|economics?)\b"},
    {"code": "EX20003", "name": "Scientific and Technical Writing", "regex": r"\b(scientific[\s_-]*(and|&)?[\s_-]*technical[\s_-]*writing|stw)\b"},
    {"code": "HU10001", "name": "Universal Human Values", "regex": r"\b(universal[\s_-]*human[\s_-]*values?|uhv)\b"},
    {"code": "EC20007", "name": "Microprocessors", "regex": r"\b(microprocessors?|mp)\b"},
    {"code": "EC20004", "name": "Digital Electronics", "regex": r"\b(digital[\s_-]*electronics?|de)\b"},
]

def resolve_pdf_metadata(filename: str):
    lower_fn = filename.lower()
    
    # Exam type
    exam_type = "Endsem"
    if "midsem" in lower_fn or "makeup" in lower_fn:
        exam_type = "Midsem"
    elif "endsem" in lower_fn:
        exam_type = "Endsem"

    # Year
    ym = re.search(r"\b(20\d{2})\b", filename)
    year = ym.group(1) if ym else "2024"

    # Subject & Subject Code
    subj_name = "General Engineering"
    subj_code = "ENG2001"
    
    clean_stem = filename.replace(".pdf", "").replace(".PDF", "")
    for rule in SUBJECT_RULES:
        if re.search(rule["regex"], clean_stem, re.IGNORECASE):
            subj_name = rule["name"]
            subj_code = rule["code"]
            break

    return {
        "subject": subj_name,
        "subjectCode": subj_code,
        "year": year,
        "examType": exam_type
    }

# ── UPSTASH REDIS REST HELPER ─────────────────────────────────────────────────
def redis_command(cmd: List[Any]) -> Any:
    headers = {
        "Authorization": f"Bearer {UPSTASH_REDIS_TOKEN}",
        "Content-Type": "application/json",
    }
    resp = requests.post(UPSTASH_REDIS_URL, headers=headers, json=cmd, timeout=12)
    resp.raise_for_status()
    data = resp.json()
    if "error" in data:
        raise RuntimeError(f"Upstash Redis Error: {data['error']}")
    return data.get("result")

# ── LOCAL IMAGE ENHANCEMENT ENGINE ────────────────────────────────────────────
def enhance_examination_image(pil_img: Image.Image) -> Image.Image:
    if pil_img.mode != "RGB":
        pil_img = pil_img.convert("RGB")
    # 1. Boost contrast for pencil, ballpoint & faded ink legibility
    enhanced = ImageEnhance.Contrast(pil_img).enhance(1.35)
    # 2. Boost sharpness for math subscripts & superscript fractions
    enhanced = ImageEnhance.Sharpness(enhanced).enhance(1.5)
    # 3. Clean background scanner haze
    enhanced = ImageEnhance.Brightness(enhanced).enhance(1.05)
    return enhanced

# ── R2 UPLOAD HELPER ──────────────────────────────────────────────────────────
def upload_bytes_to_r2(img_bytes: bytes, r2_key: str, content_type: str = "image/png") -> str:
    s3_r2.put_object(
        Bucket=R2_BUCKET,
        Key=r2_key,
        Body=img_bytes,
        ContentType=content_type,
        CacheControl="public, max-age=31536000, immutable",
    )
    return f"{R2_PUBLIC_URL}/{r2_key}"

# ── GEMINI OCR WITH BACKOFF & RETRY ───────────────────────────────────────────
def call_gemini_vision(prompt: str, pil_img: Image.Image, max_retries: int = 3) -> str:
    buf = io.BytesIO()
    pil_img.save(buf, format="PNG")
    img_bytes = buf.getvalue()

    models_to_try = ["gemini-3.8-flash", "gemini-flash-latest", "gemini-2.5-flash", "gemini-3.5-flash"]

    # 1. Primary: modern google.genai
    try:
        from google import genai
        from google.genai import types
        client = genai.Client(api_key=GEMINI_KEY)
        part = types.Part.from_bytes(data=img_bytes, mime_type="image/png")
        for attempt in range(max_retries):
            for m in models_to_try:
                try:
                    resp = client.models.generate_content(
                        model=m,
                        contents=[part, prompt]
                    )
                    if resp and resp.text:
                        return resp.text.strip()
                except Exception as e:
                    err_str = str(e).lower()
                    if "429" in err_str or "quota" in err_str or "resource_exhausted" in err_str:
                        wait_sec = (attempt + 1) * 6
                        print(f"    [Rate limit 429 on {m}] Sleeping {wait_sec}s before retry...")
                        time.sleep(wait_sec)
                    else:
                        continue
            time.sleep(2)
    except Exception as g_err:
        print(f"    [google.genai error: {g_err}] Trying legacy fallback...")

    # 2. Fallback: legacy google.generativeai
    try:
        img_data = {"mime_type": "image/png", "data": img_bytes}
        for attempt in range(max_retries):
            for m in models_to_try:
                try:
                    model = genai.GenerativeModel(m)
                    resp = model.generate_content([prompt, img_data])
                    if resp and resp.text:
                        return resp.text.strip()
                except Exception:
                    continue
            time.sleep(2)
    except Exception:
        pass

    raise RuntimeError("Gemini Vision API quota exceeded or models unavailable across retries.")

# ── PARSE EXAM PAGE & ISOLATE REAL QUESTIONS ──────────────────────────────────
def parse_page_with_ocr(
    page: fitz.Page,
    page_num: int,
    file_name: str,
    meta: Dict[str, str],
    enhanced_img: Image.Image
) -> Dict[str, Any]:
    pw = float(page.rect.width)
    ph = float(page.rect.height)

    # 1. Check if PyMuPDF has digital vector text
    page_text = page.get_text("text").strip()
    has_digital_text = len(page_text) > 80

    prompt = f"""
You are the Kaizen high-precision academic OCR engine for KIIT University exam papers and study materials.
Analyze this examination page (Page {page_num} of '{file_name}').
Subject: {meta['subject']} ({meta['subjectCode']}), Year: {meta['year']}, Exam: {meta['examType']}

RULES:
1. CLASSIFY content_type: "PYQ" | "NOTES" | "ASSIGNMENT" | "QUESTION_BANK" | "SYLLABUS".
2. EXTRACT INDIVIDUAL QUESTIONS:
   - Completely DISCARD university banners ("KALINGA INSTITUTE...", "Time: 3 Hours", "Full Marks: 100", "Answer any 5...").
   - Extract each question separately with question_number (e.g. "1", "1(a)", "2", "3(b)").
   - Format all mathematical equations in clean LaTeX notation ($E = mc^2$, $\\int_0^1 x dx$, $\\alpha, \\beta$).
   - If question has subparts (a, b, c), list them in sub_parts.
   - If multiple choice, list options in options array.
   - Estimate the bounding box [x0, y0, x1, y1] for each question in page coordinates: width = {pw:.1f}, height = {ph:.1f}.
   - Output ONLY valid JSON:
{{
  "content_type": "PYQ",
  "subject_code": "{meta['subjectCode']}",
  "subject_name": "{meta['subject']}",
  "year": "{meta['year']}",
  "exam_type": "{meta['examType']}",
  "questions": [
    {{
      "question_number": "1",
      "text": "Full question stem with math in $LaTeX$...",
      "marks": "5",
      "sub_parts": ["(a)"],
      "options": [],
      "bbox": [35, 80, {pw - 35:.1f}, 260]
    }}
  ]
}}
"""
    try:
        raw_res = call_gemini_vision(prompt, enhanced_img)
        clean_json = raw_res.strip()
        if clean_json.startswith("```"):
            clean_json = re.sub(r"^```(?:json)?\s*", "", clean_json)
            clean_json = re.sub(r"\s*```$", "", clean_json)

        try:
            return json.loads(clean_json)
        except Exception:
            m = re.search(r"\{.*\}", clean_json, re.DOTALL)
            if m:
                return json.loads(m.group(0))
    except Exception as e:
        print(f"    [Gemini OCR error]: {e}")

    # Fallback: Extract via PyMuPDF vector blocks if Gemini hits limits
    blocks = page.get_text("blocks")
    extracted_qs = []
    for b in blocks:
        x0, y0, x1, y1, text, block_no, btype = b
        text = text.strip()
        if btype != 0 or len(text) < 30:
            continue
        # Filter headers
        low = text.lower()
        if any(h in low for h in ["kalinga institute", "full marks", "time: 3", "page 1 of", "b.tech", "all questions are compulsory"]):
            if len(text) < 70:
                continue

        extracted_qs.append({
            "question_number": f"{len(extracted_qs) + 1}",
            "text": text,
            "marks": "10",
            "sub_parts": [],
            "options": [],
            "bbox": [max(25, x0 - 5), max(40, y0 - 5), min(pw - 25, x1 + 5), min(ph - 40, y1 + 5)]
        })

    return {
        "content_type": "PYQ",
        "subject_code": meta["subjectCode"],
        "subject_name": meta["subject"],
        "year": meta["year"],
        "exam_type": meta["examType"],
        "questions": extracted_qs if extracted_qs else [
            {
                "question_number": "1",
                "text": page_text[:500] if page_text else f"Examination Paper: {meta['subject']} ({meta['year']} {meta['examType']})",
                "marks": "10",
                "sub_parts": [],
                "options": [],
                "bbox": [35, 80, pw - 35, ph * 0.45]
            }
        ]
    }

# ── STAGE QUESTIONS INTO UPSTASH REDIS ─────────────────────────────────────────
def stage_to_redis(
    doc_id: str,
    file_name: str,
    page_num: int,
    r2_url: str,
    parsed_data: Dict[str, Any],
    pw: float,
    ph: float
) -> int:
    qs = parsed_data.get("questions", [])
    staged_count = 0

    for idx, q in enumerate(qs):
        q_id = f"stg_{doc_id}_p{page_num}_q{idx + 1}_{int(time.time())}"
        raw_text = q.get("text", "").strip()
        if not raw_text:
            continue

        bbox = q.get("bbox", [35, 80, pw - 35, 280])

        fine_tune_pair = {
            "instruction": f"Answer the following {parsed_data.get('subject_name')} ({parsed_data.get('subject_code')}) {parsed_data.get('exam_type')} {parsed_data.get('year')} question with complete step-by-step reasoning and formulas.",
            "input": raw_text,
            "output": q.get("solution", "")
        }

        staged_obj = {
            "id": q_id,
            "docId": doc_id,
            "sourceDoc": file_name,
            "pageNumber": page_num,
            "contentType": parsed_data.get("content_type", "PYQ"),
            "subject": parsed_data.get("subject_name", "General Engineering"),
            "subjectCode": parsed_data.get("subject_code", "ENG2001"),
            "year": str(parsed_data.get("year", "2024")),
            "examType": parsed_data.get("exam_type", "Endsem"),
            "questionNumber": q.get("question_number", f"{idx + 1}"),
            "rawOcrText": raw_text,
            "cleanText": raw_text,
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
            "pageWidth": pw,
            "pageHeight": ph,
            "imageUrl": r2_url,
            "status": "PENDING_REVIEW",
            "createdAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "fineTuningData": fine_tune_pair
        }

        # Save to Redis
        redis_command(["SET", f"kaizen:staging:item:{q_id}", json.dumps(staged_obj)])
        redis_command(["SADD", "kaizen:staging:queue", q_id])
        redis_command(["SADD", f"kaizen:staging:doc:{doc_id}", q_id])
        staged_count += 1

    return staged_count

# ── PROCESS SINGLE PDF ────────────────────────────────────────────────────────
def process_pdf(pdf_path: Path) -> int:
    meta = resolve_pdf_metadata(pdf_path.name)
    clean_stem = re.sub(r"[^a-zA-Z0-9_]", "_", pdf_path.stem)
    doc_id = clean_stem

    try:
        doc = fitz.open(str(pdf_path))
    except Exception as e:
        print(f"  [ERROR] Cannot open {pdf_path.name}: {e}")
        return 0

    total_pages = len(doc)
    doc_staged_total = 0

    print(f"\n─────────────────────────────────────────────────────────")
    print(f"Processing: {pdf_path.name}")
    print(f"Subject: {meta['subject']} ({meta['subjectCode']}) | Year: {meta['year']} | Exam: {meta['examType']}")
    print(f"Pages: {total_pages}")
    print(f"─────────────────────────────────────────────────────────")

    for p_idx in range(total_pages):
        page = doc[p_idx]
        p_num = p_idx + 1
        pw = float(page.rect.width)
        ph = float(page.rect.height)

        # 1. High-DPI 200 DPI vector render
        pix = page.get_pixmap(dpi=200)
        img = Image.open(io.BytesIO(pix.tobytes("png")))

        # 2. Local Pillow enhancement
        enhanced = enhance_examination_image(img)

        # 3. Direct R2 upload
        buf = io.BytesIO()
        enhanced.save(buf, format="PNG", optimize=True)
        img_bytes = buf.getvalue()

        r2_key = f"dataset/raw/{doc_id}_p{p_num}.png"
        r2_url = upload_bytes_to_r2(img_bytes, r2_key)
        print(f"  [p.{p_num}] Enhanced & uploaded to R2 -> {r2_url}")

        # 4. OCR & Question Isolation
        parsed = parse_page_with_ocr(page, p_num, pdf_path.name, meta, enhanced)
        q_count = len(parsed.get("questions", []))
        print(f"  [p.{p_num}] Extracted {q_count} questions (Type: {parsed.get('content_type')})")

        # 5. Stage to Upstash Redis
        staged_n = stage_to_redis(doc_id, pdf_path.name, p_num, r2_url, parsed, pw, ph)
        doc_staged_total += staged_n

        # Rate-limiting pause between pages (4 seconds = max 15 RPM)
        time.sleep(3.5)

    doc.close()

    # Save document summary to Redis
    doc_summary = {
        "docId": doc_id,
        "filename": pdf_path.name,
        "totalPages": total_pages,
        "totalQuestionsStaged": doc_staged_total,
        "r2BasePath": f"{R2_PUBLIC_URL}/dataset/raw/{doc_id}",
        "ingestedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    }
    redis_command(["SET", f"kaizen:doc:{doc_id}", json.dumps(doc_summary)])

    print(f"✓ Completed {pdf_path.name}: {doc_staged_total} questions staged into Redis.")
    return doc_staged_total

# ── MAIN BATCH RUNNER ─────────────────────────────────────────────────────────
def main():
    if not RAW_DIR.exists():
        print(f"Raw directory not found: {RAW_DIR}")
        sys.exit(1)

    all_pdfs = sorted(list(RAW_DIR.glob("*.pdf")) + list(RAW_DIR.glob("*.PDF")))
    # Deduplicate on Windows case-insensitive filesystem
    seen = set()
    unique_pdfs = []
    for p in all_pdfs:
        normalized = p.name.lower()
        if normalized not in seen:
            seen.add(normalized)
            unique_pdfs.append(p)

    print("=========================================================")
    print("KAIZEN RAW PDF REGENERATION & OCR INGESTION ENGINE")
    print("=========================================================")
    print(f"Found {len(unique_pdfs)} unique raw examination PDFs in {RAW_DIR}")
    print(f"Destination: Cloudflare R2 ({R2_BUCKET}) + Upstash Redis Staging")
    print(f"Gemini Vision: 2.5/2.0 Flash with adaptive rate limiting")
    print("=========================================================\n")

    # If limit argument is passed (e.g. python regenerate_from_raw_pyqs.py --limit 10)
    limit = None
    if "--limit" in sys.argv:
        idx = sys.argv.index("--limit")
        if idx + 1 < len(sys.argv):
            limit = int(sys.argv[idx + 1])

    pdfs_to_process = unique_pdfs[:limit] if limit else unique_pdfs
    print(f"Processing {len(pdfs_to_process)} PDFs in this run...\n")

    total_questions_all = 0
    start_time = time.time()

    for idx, pdf in enumerate(pdfs_to_process, 1):
        print(f"\n>>> [{idx}/{len(pdfs_to_process)}] Starting {pdf.name}")
        try:
            cnt = process_pdf(pdf)
            total_questions_all += cnt
        except Exception as e:
            print(f"  [ERROR processing {pdf.name}]: {e}")

    elapsed = time.time() - start_time
    print("\n=========================================================")
    print("REGENERATION PIPELINE RUN COMPLETE")
    print(f"Total PDFs Processed: {len(pdfs_to_process)}")
    print(f"Total Questions Staged into Redis: {total_questions_all}")
    print(f"Time Taken: {elapsed / 60:.2f} minutes")
    print("=========================================================")

if __name__ == "__main__":
    main()
