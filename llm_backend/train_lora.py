"""
NEXUS LoRA Fine-Tuning Script for KIIT PYQ Question Generation
Uses standard HuggingFace Transformers + PEFT (no ipex-llm dependency)
Optimized for 16GB RAM CPU-only training
"""
import os
import json
import time
import torch
import pandas as pd
from transformers import (
    AutoModelForCausalLM,
    AutoTokenizer,
    TrainingArguments,
    Trainer,
    DataCollatorForLanguageModeling,
)
from peft import LoraConfig, get_peft_model, prepare_model_for_kbit_training

# ============ CONFIGURATION ============
BASE_MODEL = "meta-llama/Llama-3.2-3B-Instruct"
DATASET_FILE = os.path.join(os.path.dirname(__file__), "..", "data", "pyqs", "sample_dataset.csv")
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "lora_adapter")
MAX_LENGTH = 512
TRAIN_STEPS = 50       # Increase for better results (100+ recommended)
BATCH_SIZE = 1
GRAD_ACCUM = 4          # Effective batch size = 4
LEARNING_RATE = 2e-4

# Llama 3.2 Instruct chat template
SYSTEM_PROMPT = """You are a KIIT University Professor creating examination question papers. 
Generate questions that follow KIIT's marking scheme and examination pattern. 
Questions should be academically rigorous and appropriate for B.Tech ECS students."""


def format_prompt(row):
    """Format a PYQ row into Llama 3.2 Instruct chat format."""
    user_msg = (
        f"Generate a {row['Marks']}-mark question for the subject '{row['Subject']}' "
        f"on the topic '{row['Topic']}' following KIIT University examination pattern."
    )
    assistant_msg = row['Question']

    # Llama 3.2 Instruct format
    full_text = (
        f"<|begin_of_text|><|start_header_id|>system<|end_header_id|>\n\n"
        f"{SYSTEM_PROMPT}<|eot_id|>"
        f"<|start_header_id|>user<|end_header_id|>\n\n"
        f"{user_msg}<|eot_id|>"
        f"<|start_header_id|>assistant<|end_header_id|>\n\n"
        f"{assistant_msg}<|eot_id|>"
    )
    return full_text


def load_dataset(tokenizer):
    """Load and tokenize the PYQ dataset."""
    print(f"Loading dataset from {DATASET_FILE}...")
    df = pd.read_csv(DATASET_FILE)
    print(f"  Found {len(df)} questions across {df['Subject'].nunique()} subjects")
    print(f"  Subjects: {', '.join(df['Subject'].unique())}")
    print(f"  Year range: {df['Year'].min()}-{df['Year'].max()}")
    print(f"  Marks distribution: {dict(df['Marks'].value_counts().sort_index())}")

    tokenized_data = []
    for _, row in df.iterrows():
        full_text = format_prompt(row)
        tokenized = tokenizer(
            full_text,
            truncation=True,
            max_length=MAX_LENGTH,
            padding="max_length",
        )
        tokenized["labels"] = tokenized["input_ids"].copy()
        tokenized_data.append(tokenized)

    print(f"  Tokenized {len(tokenized_data)} examples (max_length={MAX_LENGTH})")
    return tokenized_data


def train():
    """Main training function."""
    start_time = time.time()
    print("=" * 60)
    print("NEXUS LoRA Fine-Tuning Pipeline")
    print("=" * 60)
    print(f"Base Model: {BASE_MODEL}")
    print(f"Device: CPU (16GB RAM optimized)")
    print(f"Training Steps: {TRAIN_STEPS}")
    print(f"Effective Batch Size: {BATCH_SIZE * GRAD_ACCUM}")
    print()

    # ---- Load Model ----
    print("Loading base model (this may take a few minutes on CPU)...")
    model = AutoModelForCausalLM.from_pretrained(
        BASE_MODEL,
        torch_dtype=torch.float32,  # CPU requires float32
        device_map="cpu",
        trust_remote_code=True,
        low_cpu_mem_usage=True,
    )
    print(f"  Model loaded: {sum(p.numel() for p in model.parameters()) / 1e6:.1f}M parameters")

    # ---- Load Tokenizer ----
    tokenizer = AutoTokenizer.from_pretrained(BASE_MODEL, trust_remote_code=True)
    tokenizer.pad_token = tokenizer.eos_token
    tokenizer.padding_side = "right"

    # ---- Prepare for LoRA ----
    print("\nConfiguring LoRA adapter...")
    lora_config = LoraConfig(
        r=8,
        lora_alpha=32,
        target_modules=["q_proj", "v_proj", "k_proj", "o_proj"],
        lora_dropout=0.05,
        bias="none",
        task_type="CAUSAL_LM",
    )

    model = get_peft_model(model, lora_config)
    model.print_trainable_parameters()

    # ---- Load Dataset ----
    print()
    tokenized_data = load_dataset(tokenizer)

    # ---- Training Arguments ----
    print(f"\nStarting training ({TRAIN_STEPS} steps)...")
    training_args = TrainingArguments(
        output_dir=OUTPUT_DIR,
        per_device_train_batch_size=BATCH_SIZE,
        gradient_accumulation_steps=GRAD_ACCUM,
        max_steps=TRAIN_STEPS,
        learning_rate=LEARNING_RATE,
        lr_scheduler_type="cosine",
        warmup_steps=5,
        save_steps=25,
        logging_steps=5,
        save_total_limit=2,
        remove_unused_columns=False,
        push_to_hub=False,
        report_to="none",
        fp16=False,  # CPU doesn't support fp16 training
        dataloader_pin_memory=False,
    )

    trainer = Trainer(
        model=model,
        args=training_args,
        train_dataset=tokenized_data,
        data_collator=DataCollatorForLanguageModeling(tokenizer, mlm=False),
    )

    # ---- Train ----
    train_result = trainer.train()

    # ---- Save ----
    print(f"\nSaving LoRA adapter to {OUTPUT_DIR}...")
    model.save_pretrained(OUTPUT_DIR)
    tokenizer.save_pretrained(OUTPUT_DIR)

    # ---- Report ----
    elapsed = time.time() - start_time
    print()
    print("=" * 60)
    print("Training Complete!")
    print("=" * 60)
    print(f"  Total time: {elapsed / 60:.1f} minutes")
    print(f"  Final loss: {train_result.training_loss:.4f}")
    print(f"  Steps: {train_result.global_step}")
    print(f"  Adapter saved to: {OUTPUT_DIR}")
    print()

    # Save training metadata
    metadata = {
        "base_model": BASE_MODEL,
        "training_steps": train_result.global_step,
        "final_loss": train_result.training_loss,
        "training_time_minutes": elapsed / 60,
        "dataset_size": len(tokenized_data),
        "lora_r": 8,
        "lora_alpha": 32,
        "target_modules": ["q_proj", "v_proj", "k_proj", "o_proj"],
        "max_length": MAX_LENGTH,
        "learning_rate": LEARNING_RATE,
    }
    meta_path = os.path.join(OUTPUT_DIR, "training_metadata.json")
    with open(meta_path, "w") as f:
        json.dump(metadata, f, indent=2)
    print(f"  Metadata saved to: {meta_path}")


if __name__ == "__main__":
    train()
