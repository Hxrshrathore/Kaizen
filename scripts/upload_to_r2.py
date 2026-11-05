import os
import sys
import mimetypes
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed
import boto3
from botocore.config import Config

R2_ENDPOINT = "https://3288bf4dc7bac5817897bcbd7cbe19d8.r2.cloudflarestorage.com"
R2_ACCESS_KEY = "1d8c7202b9b5738a1915532b5fff6f1c"
R2_SECRET_KEY = "191e3a6f3d5d72dd34a36033a1e80990c252a642a4640a2d176cc76c5f97358b"
BUCKET_NAME = "kaizen"
PUBLIC_BASE_URL = "https://pub-60fc676d8ba24a13a46925ab4941ddb5.r2.dev"

BASE_DIR = Path(__file__).parent.parent
DATASET_DIR = BASE_DIR / "public" / "dataset" / "raw"
PYQS_RAW_DIR = BASE_DIR / "data" / "pyqs" / "raw"

# Initialize S3 client for R2
s3 = boto3.client(
    "s3",
    endpoint_url=R2_ENDPOINT,
    aws_access_key_id=R2_ACCESS_KEY,
    aws_secret_access_key=R2_SECRET_KEY,
    config=Config(
        signature_version="s3v4",
        max_pool_connections=25,
        retries={"max_attempts": 3, "mode": "standard"}
    ),
    region_name="auto"
)

def upload_single_file(file_info):
    local_path, s3_key, content_type = file_info
    try:
        with open(local_path, "rb") as f:
            s3.put_object(
                Bucket=BUCKET_NAME,
                Key=s3_key,
                Body=f,
                ContentType=content_type,
                CacheControl="public, max-age=31536000, immutable"
            )
        return True, s3_key, local_path.stat().st_size
    except Exception as e:
        return False, s3_key, str(e)

def main():
    print("=" * 60)
    print("CLOUDFLARE R2 UPLOAD PIPELINE FOR KAIZEN INGESTION MEDIA")
    print("=" * 60)
    print(f"Bucket: {BUCKET_NAME}")
    print(f"Endpoint: {R2_ENDPOINT}")
    print(f"Public URL Base: {PUBLIC_BASE_URL}")

    # 1. Collect all files to upload
    upload_queue = []

    # Question crops in public/dataset/raw
    if DATASET_DIR.exists():
        for f in DATASET_DIR.iterdir():
            if f.is_file():
                s3_key = f"dataset/raw/{f.name}"
                mime = "image/png" if f.suffix.lower() == ".png" else "image/jpeg"
                upload_queue.append((f, s3_key, mime))

    # Raw PDFs in data/pyqs/raw
    if PYQS_RAW_DIR.exists():
        for f in PYQS_RAW_DIR.iterdir():
            if f.is_file() and f.suffix.lower() == ".pdf":
                s3_key = f"pyqs/raw/{f.name}"
                upload_queue.append((f, s3_key, "application/pdf"))

    total_files = len(upload_queue)
    total_bytes = sum(f[0].stat().st_size for f in upload_queue)
    print(f"\nFound {total_files} files to upload ({total_bytes / (1024*1024):.2f} MB)")
    print("Starting high-speed multi-threaded upload (16 workers)...")

    uploaded = 0
    failed = 0
    bytes_uploaded = 0

    with ThreadPoolExecutor(max_workers=16) as executor:
        futures = {executor.submit(upload_single_file, item): item for item in upload_queue}
        for future in as_completed(futures):
            ok, key, info = future.result()
            if ok:
                uploaded += 1
                bytes_uploaded += info
                if uploaded % 100 == 0 or uploaded == total_files:
                    pct = (uploaded / total_files) * 100
                    mb = bytes_uploaded / (1024 * 1024)
                    print(f"  [Progress] {uploaded}/{total_files} files ({pct:.1f}%) - {mb:.2f} MB uploaded")
            else:
                failed += 1
                print(f"  [FAIL] {key}: {info}")

    print("\n" + "=" * 60)
    print(f"UPLOAD COMPLETE: {uploaded} files uploaded, {failed} failed.")
    print(f"Total uploaded: {bytes_uploaded / (1024*1024):.2f} MB")
    print("Sample public URLs:")
    print(f"  - {PUBLIC_BASE_URL}/dataset/raw/{upload_queue[0][0].name}")
    if PYQS_RAW_DIR.exists():
        first_pdf = next(PYQS_RAW_DIR.glob("*.pdf"), None)
        if first_pdf:
            print(f"  - {PUBLIC_BASE_URL}/pyqs/raw/{first_pdf.name}")
    print("=" * 60)

if __name__ == "__main__":
    main()

