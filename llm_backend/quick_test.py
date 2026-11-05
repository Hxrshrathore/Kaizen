"""Quick test for the LLM generate endpoint"""
import requests, json, time

r = requests.post('http://localhost:8000/generate', json={
    'prompt': (
        '<|begin_of_text|><|start_header_id|>system<|end_header_id|>\n\n'
        'You are a KIIT University Professor creating exam papers.<|eot_id|>'
        '<|start_header_id|>user<|end_header_id|>\n\n'
        'Generate a 10-mark question on Computer Networks about the OSI Model '
        'following KIIT examination pattern.<|eot_id|>'
        '<|start_header_id|>assistant<|end_header_id|>\n\n'
    ),
    'max_tokens': 256,
    'temperature': 0.7,
}, timeout=120)

d = r.json()
print(f"Status: {r.status_code}")
print(f"Time: {d['time_taken']:.1f}s")
print(f"Speed: {d['tokens_per_sec']:.1f} tok/s")
print(f"Tokens: {d['usage']}")
print(f"\n--- Generated Question ---")
print(d['response'])
