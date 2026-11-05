import boto3
from botocore.config import Config

R2_ENDPOINT = "https://3288bf4dc7bac5817897bcbd7cbe19d8.r2.cloudflarestorage.com"
R2_ACCESS_KEY = "1d8c7202b9b5738a1915532b5fff6f1c"
R2_SECRET_KEY = "191e3a6f3d5d72dd34a36033a1e80990c252a642a4640a2d176cc76c5f97358b"
BUCKET_NAME = "kaizen"

s3 = boto3.client(
    "s3",
    endpoint_url=R2_ENDPOINT,
    aws_access_key_id=R2_ACCESS_KEY,
    aws_secret_access_key=R2_SECRET_KEY,
    config=Config(signature_version="s3v4"),
    region_name="auto"
)

try:
    print("Testing connection to Cloudflare R2 bucket:", BUCKET_NAME)
    resp = s3.list_objects_v2(Bucket=BUCKET_NAME, MaxKeys=5)
    print("[OK] Successfully connected to R2!")
    print("Current objects in bucket:", resp.get("KeyCount", 0))
    if "Contents" in resp:
        for obj in resp["Contents"]:
            print("  -", obj["Key"], f"({obj['Size']} bytes)")
except Exception as e:
    print("ERROR connecting to R2:", e)
