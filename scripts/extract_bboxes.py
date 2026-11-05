import os
import re
import json
from pathlib import Path
import fitz

BASE_DIR = Path(__file__).parent.parent
RAW_DIR = BASE_DIR / "data" / "pyqs" / "raw"
DATASET_DIR = BASE_DIR / "public" / "dataset" / "raw"
OUTPUT_JSON = BASE_DIR / "data" / "bboxes.json"

def main():
    print("=== EXTRACTING PDF BOUNDING BOXES FOR ALL CROPPED QUESTIONS ===")
    
    # Map from sanitized stem to actual PDF file
    pdf_files = {}
    for p in RAW_DIR.glob("*.pdf"):
        clean_stem = re.sub(r'[^a-zA-Z0-9]', '_', p.stem)
        pdf_files[clean_stem] = p
        pdf_files[p.stem] = p
        pdf_files[p.name] = p

    bbox_map = {}
    
    # Iterate over all images in public/dataset/raw
    img_files = list(DATASET_DIR.glob("*.png")) + list(DATASET_DIR.glob("*.jpg"))
    print(f"Total image files found in dataset: {len(img_files)}")
    
    # Cache open PDF documents to avoid reopening
    doc_cache = {}

    for img in img_files:
        stem = img.stem
        # Format: {pdf_stem}_p{page_num}_{block_no}
        # Or: {pdf_stem}_p{page_num}_full
        m = re.search(r'^(.*)_p(\d+)_(.+)$', stem)
        if not m:
            continue
            
        pdf_key, page_str, block_str = m.group(1), m.group(2), m.group(3)
        page_idx = int(page_str)
        
        pdf_path = pdf_files.get(pdf_key)
        if not pdf_path:
            continue

        try:
            if pdf_path not in doc_cache:
                doc_cache[pdf_path] = fitz.open(str(pdf_path))
            doc = doc_cache[pdf_path]
            
            if page_idx >= len(doc):
                continue
                
            page = doc[page_idx]
            pw = float(page.rect.width)
            ph = float(page.rect.height)
            
            if block_str == "full":
                bbox_map[f"/dataset/raw/{img.name}"] = {
                    "x0": 0.0,
                    "y0": 0.0,
                    "x1": pw,
                    "y1": ph,
                    "width": pw,
                    "height": ph,
                    "sourcePdf": pdf_path.name,
                    "pageNumber": page_idx + 1
                }
            else:
                block_no = int(block_str)
                blocks = page.get_text("blocks")
                matched_b = None
                for b in blocks:
                    if b[5] == block_no:
                        matched_b = b
                        break
                        
                if matched_b:
                    x0, y0, x1, y1 = matched_b[0], matched_b[1], matched_b[2], matched_b[3]
                    # Original crop had 5pt padding
                    bbox_map[f"/dataset/raw/{img.name}"] = {
                        "x0": round(float(x0), 2),
                        "y0": round(float(y0), 2),
                        "x1": round(float(x1), 2),
                        "y1": round(float(y1), 2),
                        "width": round(pw, 2),
                        "height": round(ph, 2),
                        "sourcePdf": pdf_path.name,
                        "pageNumber": page_idx + 1
                    }
        except Exception as e:
            pass

    for doc in doc_cache.values():
        doc.close()

    print(f"Extracted bounding boxes for {len(bbox_map)} images!")
    OUTPUT_JSON.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_JSON, "w", encoding="utf-8") as f:
        json.dump(bbox_map, f, indent=2)
    print(f"Saved to {OUTPUT_JSON}")

if __name__ == "__main__":
    main()

