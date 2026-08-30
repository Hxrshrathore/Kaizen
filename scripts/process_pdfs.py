import os
import sys
import json
import time
import requests
from pathlib import Path
import fitz  # PyMuPDF

# Paths
BASE_DIR = Path(__file__).parent.parent
RAW_DIR = BASE_DIR / "data" / "pyqs" / "raw"
DATASET_DIR = BASE_DIR / "public" / "dataset" / "raw"
API_URL = "http://127.0.0.1:3000/api/ingestion/insert"

# Ensure output dir exists
DATASET_DIR.mkdir(parents=True, exist_ok=True)

def process_pdfs():
    pdfs = list(RAW_DIR.glob("*.pdf")) + list(RAW_DIR.glob("*.PDF"))
    if not pdfs:
        print(f"No PDFs found in {RAW_DIR}")
        return

    print(f"Processing {len(pdfs)} PDFs to generate OCR Dataset crops...\n")

    for pdf_path in pdfs:
        print(f"File: {pdf_path.name}")
        
        # Meta parse from name e.g. "ComputerNetworks_2022_EndSem.pdf"
        parts = pdf_path.stem.replace("-", "_").split("_")
        subject = parts[0] if parts else "Unknown"
        year = next((p for p in parts if p.isdigit() and len(p)==4), "2023")
        exam_type = next((p for p in parts if "sem" in p.lower()), "Unknown")

        try:
            doc = fitz.open(str(pdf_path))
        except Exception as e:
            print(f"  Failed to open PDF: {e}")
            continue

        crops_created = 0

        for page_num in range(len(doc)):
            page = doc[page_num]
            blocks = page.get_text("blocks")
            
            # Simple heuristic: Combine nearby blocks or create visual chunks
            # A block = (x0, y0, x1, y1, "text", block_no, block_type)
            
            for b in blocks:
                x0, y0, x1, y1, text, block_no, block_type = b
                
                # Only process text blocks (block_type 0)
                if block_type != 0:
                    continue
                
                text = text.strip()
                # Skip tiny/empty blocks (like page numbers or single chars)
                if len(text) < 15:
                    continue
                
                # Crop logic
                rect = fitz.Rect(x0, y0, x1, y1)
                
                # Expand rectangle slightly to give padding
                rect.x0 = max(0, rect.x0 - 5)
                rect.y0 = max(0, rect.y0 - 5)
                rect.x1 = min(page.rect.x1, rect.x1 + 5)
                rect.y1 = min(page.rect.y1, rect.y1 + 5)

                try:
                    # Render crop to image
                    pix = page.get_pixmap(clip=rect, dpi=200)
                    
                    crop_id = f"{pdf_path.stem}_p{page_num}_{block_no}"
                    img_filename = f"{crop_id}.png"
                    img_path = DATASET_DIR / img_filename
                    
                    pix.save(str(img_path))
                    
                    # Store in Database via Next.js API
                    payload = {
                        "imagePath": f"/dataset/raw/{img_filename}",
                        "subject": subject,
                        "year": year,
                        "examType": exam_type,
                        "sourcePdf": pdf_path.name,
                        "pageNumber": page_num + 1,
                        "rawOcrText": text  # Extracted text from PyMuPDF as a starting baseline
                    }
                    
                    resp = requests.post(API_URL, json=payload, timeout=5)
                    if resp.status_code == 201:
                        crops_created += 1
                    else:
                        print(f"  [API Error] {resp.text}")
                        
                except Exception as e:
                    print(f"  [Error cropping block {block_no}]: {e}")

        doc.close()
        print(f"  -> Generated {crops_created} question image crops.")

if __name__ == "__main__":
    process_pdfs()
