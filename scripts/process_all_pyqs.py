import os
import sys
import re
import json
import time
import requests
from pathlib import Path
import fitz  # PyMuPDF

BASE_DIR = Path(__file__).parent.parent
RAW_DIR = BASE_DIR / "data" / "pyqs" / "raw"
DATASET_DIR = BASE_DIR / "public" / "dataset" / "raw"
API_URL = "http://127.0.0.1:3000/api/ingestion/insert"
CSV_PATH = BASE_DIR / "data" / "pyqs" / "sample_dataset.csv"

DATASET_DIR.mkdir(parents=True, exist_ok=True)

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

def process_all():
    pdfs = sorted(list(RAW_DIR.glob("*.pdf")) + list(RAW_DIR.glob("*.PDF")))
    print("=" * 60)
    print(f"NEXUS PYQ INGESTION & DATASET PIPELINE")
    print(f"Found {len(pdfs)} raw examination PDFs in {RAW_DIR}")
    print("=" * 60)

    total_crops = 0
    total_inserted = 0
    skipped_existing = 0

    for idx, pdf_path in enumerate(pdfs, 1):
        subject, year, exam_type = parse_filename(pdf_path.stem)
        print(f"\n[{idx}/{len(pdfs)}] {pdf_path.name}")
        print(f"   -> Subject: '{subject}' | Year: {year} | Exam: {exam_type}")

        try:
            doc = fitz.open(str(pdf_path))
        except Exception as e:
            print(f"   [Error] Could not open PDF: {e}")
            continue

        pdf_crops = 0

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

                # Filter out header/footer noise
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
                    except Exception as e:
                        print(f"   [Crop error]: {e}")
                        continue

                payload = {
                    "imagePath": f"/dataset/raw/{img_filename}",
                    "subject": subject,
                    "year": str(year),
                    "examType": exam_type,
                    "sourcePdf": pdf_path.name,
                    "pageNumber": page_num + 1,
                    "rawOcrText": text
                }

                try:
                    resp = requests.post(API_URL, json=payload, timeout=5)
                    if resp.status_code == 201:
                        total_inserted += 1
                        pdf_crops += 1
                    else:
                        pass
                except Exception as e:
                    pass

                total_crops += 1

        doc.close()
        print(f"   -> Created & Ingested {pdf_crops} question crops")

    print("\n" + "=" * 60)
    print(f"PIPELINE INGESTION COMPLETED")
    print(f"Total question crops processed: {total_crops}")
    print(f"Total inserted into database:   {total_inserted}")
    print(f"Frontend UI Ready at:           http://localhost:3000/dashboard/data-ingestion")
    print("=" * 60)

if __name__ == "__main__":
    process_all()

