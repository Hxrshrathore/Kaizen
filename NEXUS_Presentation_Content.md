# NEXUS: AI-Powered Academic Simulation Platform
## Minor Project Mid-Semester Presentation

---

## SLIDE 1: TITLE SLIDE

**NEXUS: AI-Powered Academic Simulation Platform**

**Group ID:** ECS_101

**Branch:** Elenctronics & Computer Science

**Team Members:**
- Aman Kumar Srivastava (2330287)
- Harsh Kumar (2330231)
- Nitya Taneja (2330170)
- Vaasav Duharia (2330053)

**Supervisors:**
- Prof. SK Sabut


---
*School of Electronics Engineering, KIIT Deemed to be University, Bhubaneswar*

---

## SLIDE 2: OBJECTIVE

**Problem Statement:**
- KIIT University students lack a centralized academic management platform
- Manual tracking of grades, attendance, and schedules is inefficient
- Access to previous year questions (PYQs) is fragmented and unstructured
- No AI-powered tool for personalized exam preparation

**Goals:**
- Build an integrated academic simulation platform for KIIT students
- Develop AI-powered question generation using RAG and fine-tuned LLMs
- Create automated data pipeline for PYQ processing and knowledge base construction
- Implement secure OAuth-based authentication with domain restriction
- Provide real-time academic analytics and insights dashboard

---

## SLIDE 3: INNOVATION IN THE PROJECT

**Key Innovations:**

1. **RAG-Based Question Generation Pipeline**
   - Few-shot learning with Llama-3.2-3B-Instruct model
   - Context-aware question generation from structured PYQ dataset
   - Subject-specific prompt engineering for accurate difficulty calibration

2. **End-to-End Data Ingestion System**
   - TrOCR-based OCR for processing photographed PYQ PDFs
   - Automated topic mapping using Gemini API
   - Active learning interface for human-in-the-loop question validation

3. **Domain-Restricted Authentication**
   - Google OAuth with @kiit.ac.in email validation
   - JWT-based session management with 7-day expiry
   - Secure API route protection

4. **Unified Academic Dashboard**
   - Grade report PDF parsing with automated SGPA/CGPA calculation
   - Attendance tracking with Gmail integration
   - Course schedule visualization with conflict detection

---

## SLIDE 4: EXPERIMENTAL PROTOTYPE / APP DEVELOPMENT

**Technology Stack:**
- Frontend: Next.js 16 + React 19 + TypeScript + Tailwind CSS v4
- Backend: Next.js API Routes + Python FastAPI (LLM Server)
- Database: PostgreSQL + Prisma ORM
- AI/ML: Llama.cpp + Gemini API + TrOCR

**Key Features Implemented:**

| Module | Description |
|--------|-------------|
| **AI Paper Generator** | Generates Mid-Sem/End-Sem papers using fine-tuned Llama-3.2 |
| **PYQ Archive Browser** | Searchable repository of previous year questions |
| **Academic Dashboard** | CGPA tracking, grade history, performance analytics |
| **Attendance Manager** | Course-wise attendance with Gmail sync capability |
| **Schedule Viewer** | Weekly timetable with room and faculty information |
| **Data Ingestion UI** | Review/approve OCR-extracted questions (J/K navigation, A/R actions) |

**Screenshots Placeholders:**
- [Insert Dashboard Screenshot Here]
- [Insert AI Paper Generator UI Here]
- [Insert Data Ingestion Interface Here]

---

## SLIDE 5: RESULT

**Performance Metrics:**

| Evaluation Parameter | Result |
|---------------------|--------|
| Single Question Pass Rate | 6/6 (100%) |
| Full Paper Generation | PASS |
| Average Generation Speed | 8.4 tokens/sec |
| Total Evaluation Time | 184.2 seconds |

**Subject Coverage Successfully Tested:**
- Data Structures (AVL Trees, Sorting, Graph Algorithms)
- Computer Networks (OSI Model)
- Operating Systems (Deadlocks, CPU Scheduling)
- Digital Electronics (Boolean Algebra)
- Software Engineering (SDLC)
- Microprocessors (8086 Architecture)

**Dataset Statistics:**
- 100+ structured PYQ entries across 6 core subjects
- Multi-year coverage (2021-2023)
- Mark distribution: 2-marks to 15-marks questions
- Topic-mapped to Course Outcomes (COs)

---

## SLIDE 6: WORK TO BE CARRIED OUT

**Immediate Tasks:**
1. **Database Migration Resolution**
   - Fix Neon PostgreSQL connection issues (SSL timeout)
   - Alternative: Local SQLite for MVP development

**Phase 3 - OCR Engine Deployment:**
1. Deploy TrOCR pipeline for batch PYQ processing
2. Process raw PDF corpus into structured text
3. Populate OcrQuestion table with extracted data

**Phase 4 - Model Fine-Tuning:**
1. Complete manual review of OCR-extracted questions via Data Ingestion UI
2. Export approved dataset to CSV
3. Execute LoRA fine-tuning on Llama-3.2 with KIIT-specific patterns
4. Integrate fine-tuned model with Paper Generator

**Future Enhancements:**
- Mobile-responsive PWA for on-the-go access
- AI Chat Advisor with context-aware academic counseling
- Integration with KIIT's official academic portal
- Peer comparison and class ranking analytics

---

## SLIDE 7: REFERENCES

[1] Meta AI, "Llama 3.2 Model Card," Meta AI Research, 2024. [Online]. Available: https://ai.meta.com/blog/llama-3-2/

[2] T. L. Scao et al., "BLOOM: A 176B-Parameter Open-Access Multilingual Language Model," arXiv preprint arXiv:2211.05100, 2022.

[3] E. J. Hu et al., "LoRA: Low-Rank Adaptation of Large Language Models," in Proceedings of the International Conference on Learning Representations (ICLR), 2022.

[4] A. Ramesh et al., "Hierarchical Text-Conditional Image Generation with CLIP Latents," arXiv preprint arXiv:2204.06125, 2022.

[5] Google Research, "Gemini API Documentation," Google Cloud, 2024. [Online]. Available: https://ai.google.dev/

[6] Vercel, "Next.js 16 Documentation," Vercel Inc., 2025. [Online]. Available: https://nextjs.org/docs

[7] Prisma Labs, "Prisma ORM Documentation," Prisma Data Inc., 2024. [Online]. Available: https://www.prisma.io/docs

---

**Thank You**

*Questions?*

Contact: 2330231@kiit.ac.in
GitHub: github.com/Hxrshrathore/nexus-ai
