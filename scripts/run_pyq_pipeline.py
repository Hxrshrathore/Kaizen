import os
import sys
import re
import json
import time
import base64
import requests
from pathlib import Path
import fitz  # PyMuPDF
import urllib.request

BASE_DIR = Path(__file__).parent.parent
RAW_DIR = BASE_DIR / "data" / "pyqs" / "raw"
DATASET_DIR = BASE_DIR / "public" / "dataset" / "raw"
API_URL = "http://127.0.0.1:3000/api/ingestion/insert"
CSV_PATH = BASE_DIR / "data" / "pyqs" / "sample_dataset.csv"
GEMINI_KEY = os.environ.get("GEMINI_API_KEY", "")

DATASET_DIR.mkdir(parents=True, exist_ok=True)

if not GEMINI_KEY:
    env_file = BASE_DIR / ".env"
    if env_file.exists():
        for line in env_file.read_text(encoding="utf-8").split("\n"):
            if line.startswith("GEMINI_API_KEY="):
                GEMINI_KEY = line.split("=", 1)[1].strip().strip('"').strip("'")
                break

def parse_filename(stem: str):
    year_match = re.search(r'\b(20\d{2})\b', stem)
    year = year_match.group(1) if year_match else "2023"
    
    exam_match = re.search(r'\b(Endsem|Midsem|Makeup[_-]?midsem)\b', stem, re.IGNORECASE)
    exam_type = exam_match.group(1).capitalize() if exam_match else "Endsem"
    
    subj = stem
    if year_match:
        subj = subj.replace(year_match.group(0), '')
    if exam_match:
        subj = re.sub(re.escape(exam_match.group(0)), '', subj, flags=re.IGNORECASE)
    subj = re.sub(r'[\(\)\d_-]', ' ', subj).strip()
    subj = re.sub(r'\s+', ' ', subj)
    if not subj:
        subj = "Engineering"
        
    return subj, year, exam_type

def process_digital_pdf(pdf_path: Path, subject: str, year: str, exam_type: str):
    crops = []
    try:
        doc = fitz.open(str(pdf_path))
        for page_num in range(len(doc)):
            page = doc[page_num]
            blocks = page.get_text("blocks")
            for b in blocks:
                x0, y0, x1, y1, text, block_no, block_type = b
                if block_type != 0:
                    continue
                text = text.strip()
                if len(text) < 25:
                    continue
                lower_text = text.lower()
                if any(noise in lower_text for noise in ["page 1 of", "page 2 of", "full marks", "time: 2 hrs", "time: 3 hrs", "b.tech"]):
                    if len(text) < 70:
                        continue

                clean_stem = re.sub(r'[^a-zA-Z0-9]', '_', pdf_path.stem)
                crop_id = f"{clean_stem}_p{page_num}_{block_no}"
                img_filename = f"{crop_id}.png"
                img_path = DATASET_DIR / img_filename

                if not img_path.exists():
                    rect = fitz.Rect(x0, y0, x1, y1)
                    rect.x0 = max(0, rect.x0 - 5)
                    rect.y0 = max(0, rect.y0 - 5)
                    rect.x1 = min(page.rect.x1, rect.x1 + 5)
                    rect.y1 = min(page.rect.y1, rect.y1 + 5)
                    try:
                        pix = page.get_pixmap(clip=rect, dpi=200)
                        pix.save(str(img_path))
                    except Exception:
                        continue

                crops.append({
                    "imagePath": f"/dataset/raw/{img_filename}",
                    "subject": subject,
                    "year": str(year),
                    "examType": exam_type,
                    "sourcePdf": pdf_path.name,
                    "pageNumber": page_num + 1,
                    "rawOcrText": text
                })
        doc.close()
    except Exception as e:
        print(f"    [Error] {e}")
    return crops

def process_scanned_pdf(pdf_path: Path, subject: str, year: str, exam_type: str, max_pages: int = 2):
    crops = []
    try:
        doc = fitz.open(str(pdf_path))
        num_pages = min(len(doc), max_pages)
        for page_num in range(num_pages):
            page = doc[page_num]
            clean_stem = re.sub(r'[^a-zA-Z0-9]', '_', pdf_path.stem)
            crop_id = f"{clean_stem}_p{page_num}_scan"
            img_filename = f"{crop_id}.png"
            img_path = DATASET_DIR / img_filename

            if not img_path.exists():
                pix = page.get_pixmap(dpi=150)
                pix.save(str(img_path))

            crops.append({
                "imagePath": f"/dataset/raw/{img_filename}",
                "subject": subject,
                "year": str(year),
                "examType": exam_type,
                "sourcePdf": pdf_path.name,
                "pageNumber": page_num + 1,
                "rawOcrText": f"Scanned examination paper: {subject} ({year} {exam_type}) Page {page_num + 1}"
            })
        doc.close()
    except Exception as e:
        print(f"    [Error] {e}")
    return crops

def main():
    print("=" * 60)
    print("NEXUS PYQ INGESTION & TRAINING WARMUP")
    print(f"Scanning raw directory: {RAW_DIR}")
    print("=" * 60)

    pdfs = sorted(list(RAW_DIR.glob("*.pdf")) + list(RAW_DIR.glob("*.PDF")))
    print(f"Total PDFs found: {len(pdfs)}")

    all_crops = []
    
    for idx, pdf in enumerate(pdfs, 1):
        subject, year, exam_type = parse_filename(pdf.stem)
        try:
            doc = fitz.open(str(pdf))
            has_text = sum(len(p.get_text()) for p in doc) > 100
            doc.close()
        except Exception:
            continue

        if has_text:
            crops = process_digital_pdf(pdf, subject, year, exam_type)
            print(f"[{idx}/{len(pdfs)}] Digital: {pdf.name} -> {len(crops)} crops")
        else:
            crops = process_scanned_pdf(pdf, subject, year, exam_type, max_pages=2)
            print(f"[{idx}/{len(pdfs)}] Scanned: {pdf.name} -> {len(crops)} page crops")

        all_crops.extend(crops)

    print(f"\nTotal crops ready for Database / UI: {len(all_crops)}")

    # Send to Next.js API in batches
    inserted = 0
    print("\nIngesting into Neon Database via Next.js API...")
    for c in all_crops:
        try:
            r = requests.post(API_URL, json=c, timeout=3)
            if r.status_code == 201:
                inserted += 1
        except Exception:
            pass

    print(f"\nPipeline Finished!")
    print(f"Inserted into Database: {inserted} records")
    print(f"Review UI:              http://localhost:3000/dashboard/data-ingestion")
    print(f"LLM Server Health:      http://localhost:8000/health")
    print("=" * 60)

if __name__ == "__main__":
    main()

