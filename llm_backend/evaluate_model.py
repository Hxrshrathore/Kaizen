"""
NEXUS Model Evaluation Script
Tests the local Llama 3.2 inference server for question generation quality
"""
import requests
import time
import json
import sys
import os

BACKEND_URL = "http://localhost:8000"

SYSTEM_PROMPT = """You are a KIIT University Professor creating examination question papers. 
Generate questions that follow KIIT's marking scheme and examination pattern."""

TEST_CASES = [
    {"subject": "Data Structures", "marks": 10, "topic": "AVL Trees", "exam": "end_sem"},
    {"subject": "Computer Networks", "marks": 15, "topic": "OSI Model", "exam": "end_sem"},
    {"subject": "Operating Systems", "marks": 5, "topic": "Deadlocks", "exam": "mid_sem"},
    {"subject": "Digital Electronics", "marks": 2, "topic": "Boolean Algebra", "exam": "mid_sem"},
    {"subject": "Software Engineering", "marks": 10, "topic": "SDLC", "exam": "end_sem"},
    {"subject": "Microprocessors", "marks": 10, "topic": "8086 Architecture", "exam": "end_sem"},
]

FULL_PAPER_TEST = {
    "subject": "Computer Networks",
    "exam_type": "end_sem",
}


def check_health():
    """Check if the LLM server is running."""
    try:
        res = requests.get(f"{BACKEND_URL}/health", timeout=5)
        data = res.json()
        if data.get("model_loaded"):
            print("[OK] Server is running, model loaded")
            return True
        else:
            print("[FAIL] Server running but model NOT loaded")
            return False
    except requests.ConnectionError:
        print("[FAIL] Cannot connect to server at", BACKEND_URL)
        print("       Start with: cd llm_backend && python main.py")
        return False


def test_single_question(case, idx):
    """Test generating a single question."""
    prompt = (
        f"<|begin_of_text|><|start_header_id|>system<|end_header_id|>\n\n"
        f"{SYSTEM_PROMPT}<|eot_id|>"
        f"<|start_header_id|>user<|end_header_id|>\n\n"
        f"Generate a {case['marks']}-mark question for the subject '{case['subject']}' "
        f"on the topic '{case['topic']}' following KIIT University examination pattern.<|eot_id|>"
        f"<|start_header_id|>assistant<|end_header_id|>\n\n"
    )

    try:
        start = time.time()
        res = requests.post(f"{BACKEND_URL}/generate", json={
            "prompt": prompt,
            "max_tokens": 256,
            "temperature": 0.7,
            "top_p": 0.9,
        }, timeout=120)
        elapsed = time.time() - start

        if res.status_code != 200:
            return {"status": "FAIL", "error": f"HTTP {res.status_code}", "time": elapsed}

        data = res.json()
        response_text = data.get("response", "").strip()
        tokens_per_sec = data.get("tokens_per_sec", 0)

        # Quality checks
        checks = {
            "non_empty": len(response_text) > 20,
            "contains_question": "?" in response_text or response_text.lower().startswith(("explain", "what", "describe", "discuss", "define", "design", "compare", "write")),
            "reasonable_length": 20 < len(response_text) < 2000,
            "no_repetition": len(set(response_text.split())) / max(len(response_text.split()), 1) > 0.3,
        }

        passed = sum(checks.values())
        total = len(checks)

        return {
            "status": "PASS" if passed >= 3 else "PARTIAL" if passed >= 2 else "FAIL",
            "response": response_text[:150] + ("..." if len(response_text) > 150 else ""),
            "checks": checks,
            "score": f"{passed}/{total}",
            "time": elapsed,
            "tokens_per_sec": tokens_per_sec,
        }

    except requests.Timeout:
        return {"status": "TIMEOUT", "error": "Request timed out (>120s)", "time": 120}
    except Exception as e:
        return {"status": "ERROR", "error": str(e), "time": 0}


def test_full_paper():
    """Test generating a complete question paper."""
    subject = FULL_PAPER_TEST["subject"]
    prompt = (
        f"<|begin_of_text|><|start_header_id|>system<|end_header_id|>\n\n"
        f"{SYSTEM_PROMPT}<|eot_id|>"
        f"<|start_header_id|>user<|end_header_id|>\n\n"
        f"Generate a complete End Semester Examination question paper for '{subject}' at KIIT University.\n"
        f"Full Marks: 60 | Time: 3 Hours\n"
        f"SECTION A: 5 questions x 2 marks = 10 marks\n"
        f"SECTION B: 5 questions x 10 marks = 50 marks (answer any 3)\n"
        f"Generate realistic, diverse questions covering different topics.<|eot_id|>"
        f"<|start_header_id|>assistant<|end_header_id|>\n\n"
    )

    print(f"\n{'='*60}")
    print(f"FULL PAPER TEST: {subject} (End Semester)")
    print(f"{'='*60}")

    try:
        start = time.time()
        res = requests.post(f"{BACKEND_URL}/generate", json={
            "prompt": prompt,
            "max_tokens": 1024,
            "temperature": 0.7,
            "top_p": 0.9,
        }, timeout=300)
        elapsed = time.time() - start

        if res.status_code != 200:
            print(f"[FAIL] HTTP {res.status_code}")
            return False

        data = res.json()
        paper = data.get("response", "").strip()
        tps = data.get("tokens_per_sec", 0)

        print(f"\n--- Generated Paper Preview ---")
        print(paper[:500])
        if len(paper) > 500:
            print(f"\n... ({len(paper)} total characters)")
        print(f"\nGeneration time: {elapsed:.1f}s | Speed: {tps:.1f} tok/s")
        print(f"Paper length: {len(paper)} chars, {len(paper.split())} words")

        # Paper quality checks
        has_sections = "section" in paper.lower() or "SECTION" in paper
        has_questions = paper.count("?") >= 3 or paper.count(".") >= 5
        has_marks = "mark" in paper.lower() or "marks" in paper.lower()
        reasonable_length = len(paper.split()) > 50

        score = sum([has_sections, has_questions, has_marks, reasonable_length])
        print(f"\nPaper Quality: {score}/4")
        print(f"  Has sections: {has_sections}")
        print(f"  Has questions: {has_questions}")
        print(f"  Mentions marks: {has_marks}")
        print(f"  Reasonable length: {reasonable_length}")

        return score >= 3

    except Exception as e:
        print(f"[ERROR] {e}")
        return False


def main():
    print("=" * 60)
    print("NEXUS Model Evaluation")
    print("=" * 60)
    print()

    # 1. Health check
    print("1. Server Health Check")
    if not check_health():
        sys.exit(1)
    print()

    # 2. Individual question tests
    print("2. Single Question Generation Tests")
    print("-" * 50)

    results = []
    total_time = 0
    total_tps = 0
    tps_count = 0

    for i, case in enumerate(TEST_CASES):
        label = f"[{i+1}/{len(TEST_CASES)}] {case['subject']} - {case['topic']} ({case['marks']}m)"
        print(f"\n{label}")

        result = test_single_question(case, i)
        results.append(result)

        status_icon = {"PASS": "✓", "PARTIAL": "~", "FAIL": "✗", "TIMEOUT": "⏱", "ERROR": "!"}.get(result["status"], "?")
        print(f"  {status_icon} {result['status']} ({result['time']:.1f}s)")
        if "response" in result:
            print(f"  → {result['response'][:100]}")
        if "error" in result:
            print(f"  Error: {result['error']}")

        total_time += result.get("time", 0)
        if result.get("tokens_per_sec", 0) > 0:
            total_tps += result["tokens_per_sec"]
            tps_count += 1

    # 3. Summary
    print(f"\n{'='*60}")
    print("3. Results Summary")
    print(f"{'='*60}")

    passed = sum(1 for r in results if r["status"] in ("PASS", "PARTIAL"))
    total = len(results)
    avg_tps = total_tps / tps_count if tps_count > 0 else 0

    print(f"  Tests passed: {passed}/{total} ({100*passed/total:.0f}%)")
    print(f"  Total time: {total_time:.1f}s")
    print(f"  Avg speed: {avg_tps:.1f} tokens/sec")
    print()

    # 4. Full paper test
    print("4. Full Paper Generation Test")
    paper_ok = test_full_paper()

    # 5. Final verdict
    print(f"\n{'='*60}")
    print("FINAL VERDICT")
    print(f"{'='*60}")
    overall = passed >= len(TEST_CASES) * 0.7 and paper_ok
    print(f"  Single questions: {passed}/{total}")
    print(f"  Full paper: {'PASS' if paper_ok else 'FAIL'}")
    print(f"  Avg inference speed: {avg_tps:.1f} tok/s")
    print(f"  Overall: {'✓ PASS' if overall else '✗ NEEDS IMPROVEMENT'}")

    # Save results
    output_path = os.path.join(os.path.dirname(__file__), "evaluation_results.json")
    eval_data = {
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
        "single_question_pass_rate": f"{passed}/{total}",
        "full_paper_pass": paper_ok,
        "avg_tokens_per_sec": round(avg_tps, 1),
        "total_eval_time_sec": round(total_time, 1),
        "overall": "PASS" if overall else "NEEDS IMPROVEMENT",
        "individual_results": [
            {
                "subject": TEST_CASES[i]["subject"],
                "topic": TEST_CASES[i]["topic"],
                "marks": TEST_CASES[i]["marks"],
                "status": results[i]["status"],
                "time_sec": round(results[i].get("time", 0), 1),
            }
            for i in range(len(TEST_CASES))
        ],
    }
    with open(output_path, "w") as f:
        json.dump(eval_data, f, indent=2)
    print(f"\nResults saved to: {output_path}")


if __name__ == "__main__":
    main()
