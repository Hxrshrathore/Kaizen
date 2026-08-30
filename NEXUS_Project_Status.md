# NEXUS Project Status Report

## ✅ What is Complete (Phases 1 & 2)

**1. Architecture & Navigation**
- Built out the Next.js App Router structure with customized fonts (Outfit) and dark-mode premium aesthetics.
- Configured a dynamic sidebar (`Sidebar.tsx`) connecting all module paths, expanding the "Neural Suite" and adding the "Data Pipeline" link.

**2. Database & Schema Design**
- Finalized Prisma Schema (`schema.prisma`) mapping out internal applications, user records, auth, and the `OcrQuestion` pipeline.
- Established API routes for `GET`, `PUT`, and a robust `/api/ingestion/seed` handler to mock sample inputs.

**3. Active-Learning Annotation Interface**
- Successfully built a high-fidelity frontend at `/dashboard/data-ingestion`.
- Integrated split-view navigation, zoom features, progress checks, quick filters, and keyboard shortcuts (J/K movement, A/R actions) for extremely fast grading.
- Implemented client-side logic to export approved question data to CSV format.

**4. Data Processing Pipelines**
- Drafted Python extraction utilities:
  - `pipeline.py`: Pulls apart textbook PDFs and identifies structure based on syllabi.
  - `run_ocr_model.py`: Local CPU-constrained TrOCR inference model that runs without torching system memory.
- Added generation client interface at `/generator/page.tsx`.

---

## 🚧 What is Pending (Phases 3 & 4)

> [!WARNING]
> The Neon Database instance is currently sleeping/timing out or strictly enforcing SSL limits which is causing `npx prisma db push` and `db.ts` to throw connection errors.

**1. Immediate Blockers (Database Connection)**
- We have to resolve the Neon Postgres connection URL in `.env` (it is timing out at `ep-falling-bread-ahbvwe8e`). 
- Alternatively, we switch to a local SQLite database for development velocity since it's just an MVP.

**2. Running the OCR Engine (Phase 3)**
- Drop PYQ PDFs in the `public/dataset/raw/` folder.
- Execute `run_ocr_model.py` so the Python script detects the images, processes TrOCR, and saves preliminary texts into the Data Ingestion database.

**3. Dataset Approval & Fine-Tuning**
- Launch the UI dev server, log into `/dashboard/data-ingestion`, and manually approve the pending records.
- Run the export to CSV.
- Send the CSV through `train_lora.py` to finetune Llama 3.2 on the exact question syntax used by KIIT University.

**4. End-to-End Paper Generation**
- Hook the frontend AI Paper generator directly into the newly finetuned model so it spits out 100% formatted Mid-Sem and End-Sem papers.
