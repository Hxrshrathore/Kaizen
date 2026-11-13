# KALINGA INSTITUTE OF INDUSTRIAL TECHNOLOGY (KIIT)
### DEEMED TO BE UNIVERSITY, BHUBANESWAR, ODISHA
### SCHOOL OF ELECTRONICS ENGINEERING / SCHOOL OF COMPUTER ENGINEERING

---

## MAJOR PROJECT-1 PROGRESS MONITORING SHEET – 7TH SEMESTER
**Academic Year:** 2026 – 2027  
**Program:** Bachelor of Technology (B.Tech) in Electronics & Computer Science Engineering  
**Group ID:** ECS_101  
**Project Title:** **NEXUS (Kaizen): Autonomous Academic Operating System & Neural Knowledge Engine with Multi-Modal Vision RAG and Dynamic Curricular Scheduling**

### Student Details:
| Sl. No. | Roll Number | Student Name | Signature |
| :---: | :---: | :--- | :---: |
| 1 | **2330231** | Harsh Kumar | __________________ |
| 2 | **2330287** | Aman Kumar Srivastava | __________________ |
| 3 | **2330170** | Nitya Taneja | __________________ |
| 4 | **2330053** | Vaasav Duharia | __________________ |

**Project Supervisor:** Prof. S. K. Sabut  

---

### Bi-Weekly Progress Monitoring Record

| Duration | Project status reported by the group<br>*(to be written by the students)* | Remark by the supervisor |
| :--- | :--- | :--- |
| **16th–31st July 2026** | • Discussed the project domain, scope, and objectives with the Project Supervisor.<br>• Conducted comprehensive literature review on Retrieval-Augmented Generation (RAG), Parameter-Efficient Fine-Tuning (PEFT/LoRA), and automated academic management architectures.<br>• Formulated formal problem statement targeting academic data silos, unindexed examination archives, and manual routine/attendance tracking.<br>• Established high-level functional requirements and semester milestone schedule. | Completed<br><br>**Remark:** Problem statement and project scope approved. Feasibility and literature survey verified.<br>**Date:** 29/7/26 |
| **1st–15th August 2026** | • Decided the system components, technical stack, and software/hardware architecture.<br>• Selected Next.js 16 (App Router), Tailwind CSS, TypeScript, and Prisma ORM for the frontend and API layers.<br>• Finalized dual-tier model hierarchy: Local quantized models (Qwen 2.5 / Llama 3.2 3B) for fast autocomplete and NVIDIA Nemotron-30B / Vision models for complex OCR and paper generation.<br>• Designed the relational database schema in Neon PostgreSQL (`StudentDirectory`, `Subject`, `CourseSchedule`, and `OcrQuestion` tables). | Completed<br><br>**Remark:** Component selection and system architecture reviewed and approved. Database schema is sound.<br>**Date:** 12/8/26 |
| **16th–31st August 2026** | • Started training and fine-tuning the model pipeline.<br>• Ingested 80+ past university examination papers (PYQs) and syllabus curriculum files for dataset construction.<br>• Developed PyMuPDF segmentation scripts to crop question bounding boxes and extract Course Outcome (CO) markers.<br>• Converted raw extracted question sets into standard Alpaca/ShareGPT JSONL supervised fine-tuning formats.<br>• Initialized LoRA fine-tuning runs on institutional question syntax and Bloom's taxonomy patterns. | Completed<br><br>**Remark:** Dataset preparation and training pipeline verified. Training loss convergence is on track.<br>**Date:** 31/8/26 |
| **1st–15th September 2026** | • Evaluated the trained and fine-tuned model checkpoints.<br>• Conducted quantitative benchmarks measuring perplexity, BLEU, and ROUGE-L against verified university question papers.<br>• Benchmarked NVIDIA Nemotron-30B reasoning engine for multi-step examination synthesis, validating token budgets and marking schemes (Mid-Sem 25M, End-Sem 60M).<br>• Tested vision OCR extraction accuracy on complex mathematical expressions, decision tables, and circuit schematics. | ✓<br><br>**Remark:** Model evaluation metrics and benchmarking results satisfactory. Generation accuracy meets university standards.<br>**Date:** 14/9/26 |
| **16th–30th September 2026** | • Started developing the project interface and core web application modules.<br>• Built the responsive Next.js dashboard featuring the active-learning Human-in-the-Loop OCR Ingestion Studio with dual-pane PDF viewer.<br>• Developed the dynamic schedule engine that maps student roll numbers and sections (e.g., ECS GROUP-03) to real-time routine slots and faculty.<br>• Integrated NextAuth session authentication with `@kiit.ac.in` domain restrictions. | Completed<br><br>**Remark:** Interface wireframes and frontend modules reviewed. UI layout is intuitive, responsive, and functional.<br>**Date:** 29/9/26 |
| **1st–15th October 2026** | • Integrated the model with the application backend and third-party services.<br>• Connected Google Classroom REST API v1 for live submission state tracking (`TURNED_IN` vs `PENDING`) with Bayesian self-healing course classification.<br>• Implemented ChronoSync parser to extract official attendance email notifications and compute safety margins.<br>• Hooked up Prisma ORM with Neon PostgreSQL serverless pooling for sub-15ms relational query execution. | Completed<br><br>**Remark:** API integration and Google Classroom synchronization verified. End-to-end data pipeline is operating smoothly.<br>**Date:** 14/10/26 |
| **16th–31st October 2026** | • Tested the project end-to-end and fixed errors across modules.<br>• Diagnosed and resolved AI token truncation by rebalancing Nemotron reasoning token budget and expanding response allocation to 8,192 tokens.<br>• Refactored curricular mapping to support dynamic multi-semester detection (Semesters 1 through 8) without hardcoded semester values.<br>• Implemented authentic printable white-paper question sheet rendering matching official university examination formats. | Completed<br><br>**Remark:** System testing and bug fixes verified. Error resolution and token handling show significant improvement.<br>**Date:** 30/10/26 |
| **1st–15th November 2026** | • Completed the project implementation, system freezing, and prepared the final report.<br>• Authored comprehensive Major Project-1 report conforming strictly to KIIT University guidelines (System Architecture, Schemas, Performance Benchmarks, and Evaluation).<br>• Created technical presentation pitch deck highlighting live telemetry, API bridges, and academic innovations.<br>• Conducted defense rehearsal and project demonstration for final 7th-semester review evaluation. | Completed<br><br>**Remark:** Final report, source code, and live platform demonstration thoroughly evaluated and approved for End-Sem presentation.<br>**Date:** 12/11/26 |

---

### Signatures & Approvals

<br><br>

**Supervisor’s Signature:** ___________________________  
**Name:** Prof. S. K. Sabut  
**Designation:** Professor, School of Electronics Engineering  
**Date:** ___________________________  

<br><br>

**Panel Member’s Signature (During End Sem Presentation):**  

1. _____________________________________________ &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Date: _________________  

2. _____________________________________________ &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Date: _________________  

3. _____________________________________________ &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Date: _________________  

