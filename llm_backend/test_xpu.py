import torch
from ipex_llm.transformers import AutoModelForCausalLM

print("Checking for Intel GPU (XPU) support...")
try:
    # A tiny model or just checking the setting
    import intel_extension_for_pytorch as ipex
    print(f"IPEX version: {ipex.__version__}")
    print(f"XPU available: {torch.xpu.is_available()}")
    if torch.xpu.is_available():
        print(f"Device name: {torch.xpu.get_device_name(0)}")
except Exception as e:
    print(f"XPU Error: {e}")

print("\nChecking torch version...")
print(f"Torch: {torch.__version__}")
