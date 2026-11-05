from huggingface_hub import hf_hub_download
import os

# Using bartowski's GGUF repo (un-gated and high quality)
REPO_ID = "bartowski/Llama-3.2-3B-Instruct-GGUF"
FILENAME = "Llama-3.2-3B-Instruct-Q4_K_M.gguf"

# Destination directory
MODELS_DIR = "models"
if not os.path.exists(MODELS_DIR):
    os.makedirs(MODELS_DIR)

print(f"Downloading {FILENAME} from {REPO_ID}...")
try:
    path = hf_hub_download(
        repo_id=REPO_ID,
        filename=FILENAME,
        local_dir=MODELS_DIR,
        local_dir_use_symlinks=False
    )
    print(f"Model downloaded successfully to: {path}")
except Exception as e:
    print(f"Error downloading model: {e}")
