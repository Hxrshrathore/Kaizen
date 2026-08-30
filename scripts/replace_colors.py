import os
import re

# Directory to search
target_dirs = ['app', 'components']

# Define replacement mappings
replacements = {
    r'bg-\[\#030305\]': 'bg-background',
    r'bg-\[\#0e0e11\]': 'bg-card',
    r'bg-\[\#0a0a0c\]': 'bg-muted',
    r'bg-\[\#111\]': 'bg-accent',
    r'bg-\[\#1a1a1a\]': 'bg-accent',
    r'bg-\[\#222\]': 'bg-muted',
    
    r'border-\[\#111\]': 'border-border',
    r'border-\[\#222\]': 'border-border',
    r'border-\[\#222222\]': 'border-border',
    r'border-\[\#333\]': 'border-input',
    r'border-\[\#444\]': 'border-input',
    
    r'text-\[\#ededed\]': 'text-foreground',
    r'text-\[\#888\]': 'text-muted-foreground',
    r'text-\[\#888888\]': 'text-muted-foreground',
    r'text-\[\#666\]': 'text-muted-foreground',
    r'text-\[\#555\]': 'text-muted-foreground',
    r'text-\[\#444\]': 'text-muted-foreground',
    r'text-\[\#333\]': 'text-accent-foreground',
    
    r'text-\[\#ccff00\]': 'text-primary',
    r'bg-\[\#ccff00\]': 'bg-primary',
    r'border-\[\#ccff00\]': 'border-primary',
    r'shadow-\[0_0_10px_\#ccff00\]': 'shadow-primary/50',
    r'shadow-\[0_0_10px_rgba\(204,255,0,0\.2\)\]': 'shadow-primary/20',
    
    r'text-\[\#ff0055\]': 'text-destructive',
    r'bg-\[\#ff0055\]': 'bg-destructive',
    r'border-\[\#ff0055\]': 'border-destructive',
    
    # Specific color words
    r'\bbg-black\b': 'bg-background',
    r'\btext-white\b': 'text-foreground',
}

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original_content = content
    for pattern, replacement in replacements.items():
        content = re.sub(pattern, replacement, content)
        
    if content != original_content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated: {filepath}")

for d in target_dirs:
    for root, dirs, files in os.walk(d):
        for file in files:
            if file.endswith('.tsx'):
                process_file(os.path.join(root, file))

print("Replacement complete.")
