import os
import json
import time
import requests
from PIL import Image
from pathlib import Path

# Paths
BASE_DIR = Path(__file__).parent.parent
DB_API = "http://127.0.0.1:3000/api/ingestion"

print("=========================================")
print("NEXUS LOCAL OCR ENGINE (TrOCR - CPU Mode)")
print("=========================================")

try:
    from transformers import TrOCRProcessor, VisionEncoderDecoderModel
except ImportError:
    print("\n[!] Error: 'transformers' or 'torch' not installed.")
    print("Run: pip install transformers torch torchvision")
    exit(1)

model_id = "microsoft/trocr-small-printed"

# Ensure API is accessible
try:
    resp = requests.get(f"{DB_API}?status=PENDING", timeout=5)
    pending_items = resp.json()
except Exception as e:
    print(f"\n[!] Failed to connect to Next.js Database API: {e}")
    print("Ensure 'npm run dev' is running on localhost:3000")
    exit(1)

if not pending_items:
    print("\n[+] No PENDING images found in the database. You're all caught up!")
    exit(0)

print(f"\n[*] Found {len(pending_items)} pending images for OCR.")
print(f"[*] Loading OCR Vision Model: {model_id} (This may take a minute on first run)")

try:
    # Load processor and model
    processor = TrOCRProcessor.from_pretrained(model_id)
    model = VisionEncoderDecoderModel.from_pretrained(model_id)
except Exception as e:
    print(f"\n[!] Failed to load model from huggingface: {e}")
    exit(1)

print("[+] Model loaded successfully. Starting batch OCR over images...\n")

success_count = 0

for item in pending_items:
    record_id = item["id"]
    relative_path = item["imagePath"]  # e.g. "/dataset/raw/filename.png"
    
    # Resolve absolute path -> BASE_DIR / "public" / "dataset" / "raw" / "filename.png"
    clean_path = relative_path.lstrip("/")
    abs_img_path = BASE_DIR / "public" / clean_path

    if not abs_img_path.exists():
        print(f"  [!] Missing Image: {abs_img_path.name} — Skipping.")
        continue

    print(f"  -> Scanning {abs_img_path.name} ... ", end="", flush=True)
    
    start_time = time.time()
    try:
        # Perform OCR
        image = Image.open(abs_img_path).convert("RGB")
        pixel_values = processor(images=image, return_tensors="pt").pixel_values
        
        generated_ids = model.generate(pixel_values)
        generated_text = processor.batch_decode(generated_ids, skip_special_tokens=True)[0]
        
        # We don't mark as APPROVED yet! The user must still review it in the Next.js UI.
        # We just update `rawOcrText` to TrOCR's output so it pre-fills the UI better than PyMuPDF.
        
        payload = {
            "id": record_id,
            "correctedText": generated_text,  # Prefill text editor
            "status": "PENDING"
        }
        
        resp = requests.put(DB_API, json=payload, headers={"Content-Type": "application/json"})
        
        elapsed = time.time() - start_time
        print(f"DONE ({elapsed:.1f}s)")
        print(f"     Text: {generated_text[:60]}...")
        
        success_count += 1
        
    except Exception as e:
        print(f"FAILED: {e}")

print(f"\n[=] OCR Run Complete. Updated {success_count} records.")
print("[=] Open http://localhost:3000/dashboard/data-ingestion to approve them!")
