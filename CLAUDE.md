# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

NEXUS is an academic simulation platform for KIIT University students. It provides AI-powered exam question generation, grade tracking, attendance management, and academic analytics.

**Stack:** Next.js 16 + React 19 + TypeScript + Tailwind CSS v4 + Prisma + PostgreSQL + Python FastAPI (LLM backend)

## Common Commands

### Frontend (Next.js)
```bash
# Development server
npm run dev

# Production build
npm run build

# Start production server
npm run start

# Linting
npm run lint
```

### Database (Prisma)
```bash
# Generate Prisma client after schema changes
npx prisma generate

# Open Prisma Studio (database GUI)
npx prisma studio

# Push schema changes to database (development)
npx prisma db push

# Run migrations (production)
npx prisma migrate dev
```

### LLM Backend (Python/FastAPI)
```bash
cd llm_backend

# Activate virtual environment (Windows)
venv\Scripts\activate

# Install dependencies
pip install llama-cpp-python fastapi uvicorn

# Run the LLM server
python main.py
# Server starts on http://localhost:8000

# Health check
curl http://localhost:8000/health
```

### Data Pipeline (PYQ Processing)
```bash
cd data/pyqs

# Run complete pipeline
python pipeline.py all

# Individual steps
python pipeline.py parse-plans   # Parse lesson plans to CSV
python pipeline.py ocr           # OCR photographed PYQ PDFs
python pipeline.py extract       # Parse questions from OCR text
python pipeline.py map-topics    # Classify questions with Gemini
python pipeline.py analyze       # CO frequency analysis
python pipeline.py build         # Generate training CSV
```

## High-Level Architecture

### Frontend Architecture (App Router)

**Route Structure:**
- `/` - Landing page
- `/login` - Google OAuth login with kiit.ac.in domain restriction
- `/dashboard/*` - Protected academic features
  - `/dashboard` - Main dashboard with analytics
  - `/dashboard/mock-exams` - AI question generator
  - `/dashboard/archives` - PYQ browser
  - `/dashboard/insights` - Academic analytics
  - `/dashboard/advisor` - AI chat assistant (Gemini-powered)
  - `/dashboard/upload` - Grade report PDF upload
  - `/dashboard/scheduler` - Course schedule viewer
  - `/dashboard/attendance` - Attendance tracking
  - `/dashboard/data-ingestion` - OCR question review
- `/classroom` - Course management
- `/attendance` - Standalone attendance page
- `/generator` - Question generator

**Key Patterns:**
- Uses Next.js App Router with Server Components by default
- Client components marked with `'use client'` directive
- JWT session stored in `session_token` cookie (7-day expiry)
- Domain-restricted auth: only `@kiit.ac.in` emails allowed
- Fonts: Space Grotesk (display) + JetBrains Mono (monospace)

### Backend Architecture

**API Routes (`app/api/`):**
- `/api/auth/callback/google` - OAuth callback, creates user + session
- `/api/auth/logout` - Clears session cookie
- `/api/user/profile` - Get current user data
- `/api/grades/save` - Save parsed grade report to database
- `/api/grades/history` - Retrieve grade history
- `/api/attendance/*` - Attendance CRUD and sync
- `/api/classroom/*` - Course management (hide/show courses)
- `/api/schedule` - Course schedule retrieval
- `/api/chat` - Gemini AI chat (uses `@google/genai`)
- `/api/generate` - Proxy to Python LLM server
- `/api/ingestion/*` - OCR question approval/rejection workflow

**Authentication Flow:**
1. User clicks "Sign in with Google" → `/api/auth/google` (redirects to Google)
2. OAuth callback → `/api/auth/callback/google`
3. Domain check (must end with `@kiit.ac.in`)
4. Upsert user in database, store OAuth tokens
5. Create JWT session, set `session_token` cookie
6. Redirect to `/dashboard`

**Session Verification Pattern:**
```typescript
const cookieHeader = req.headers.get('cookie');
const token = cookieHeader?.split('session_token=')[1]?.split(';')[0];
const userId = await verifySession(token);
```

### Database Schema (Prisma)

**Core Models:**
- `User` - OAuth users with Google tokens
- `AcademicProfile` - Student details (roll number, program, branch, CGPA)
- `SemesterRecord` - Per-semester performance (SGPA, credits, remarks)
- `GradeEntry` - Individual subject grades linked to semester
- `AttendanceRecord` - Daily attendance by course
- `HiddenCourse` - User's hidden courses preference
- `CourseSchedule` - Timetable data (group, day, time, subject, room)
- `StudentDirectory` - Known student roll numbers and sections
- `OcrQuestion` - OCR-extracted questions awaiting approval

**Key Relationships:**
- User → AcademicProfile (1:1)
- AcademicProfile → SemesterRecord (1:many)
- SemesterRecord → GradeEntry (1:many)
- User → AttendanceRecord (1:many)

### LLM Backend (Python/FastAPI)

**Location:** `llm_backend/`

**Components:**
- `main.py` - FastAPI server with Llama.cpp integration
- `llama_bin/` - Pre-compiled llama.cpp binaries for Windows
- `models/` - GGUF model files (expecting `Llama-3.2-3B-Instruct-Q4_K_M.gguf`)

**RAG/Few-Shot System:**
- Reads `data/pyqs/sample_dataset.csv` for examples
- Injects subject-specific examples into prompt context
- Model config: 4096 context, 10 threads, CPU-only (n_gpu_layers=0)

**Endpoints:**
- `POST /generate` - Text generation with few-shot RAG
- `GET /health` - Model status check

### Data Ingestion Pipeline

**Purpose:** Convert photographed PYQ PDFs into structured training data

**Workflow:**
1. Drop lesson plans into `data/pyqs/lesson_plans/raw/` (PDF/DOCX/TXT)
2. Drop PYQ PDFs into `data/pyqs/raw/`
3. Run pipeline steps to generate `sample_dataset.csv`

**Key Files:**
- `data/pyqs/pipeline.py` - Main pipeline orchestrator
- `data/pyqs/lesson_plans/*.csv` - Structured CO/Module/Topic mappings
- `data/pyqs/raw/*.pdf` - Source PYQ photographs
- `data/pyqs/extracted/` - OCR output text files

## Important Conventions

### Styling (Tailwind CSS v4)

Uses Tailwind v4 with CSS-based configuration:

```css
/* globals.css defines theme tokens */
@theme {
  --color-neon: #ccff00;
  --color-background: #030305;
  --color-surface: #0e0e11;
  --color-foreground: #ededed;
  --font-display: var(--font-display), ui-sans-serif, system-ui;
}
```

**Color Palette:**
- Neon accent: `#ccff00` (lime green)
- Background: `#030305` (near-black)
- Surface: `#0e0e11` (dark gray)
- Border: `#222222`
- Foreground: `#ededed`
- Muted: `#888888`

### PDF Parsing

Grade report parsing uses `pdfjs-dist` with dynamic imports (browser-only):

```typescript
// Dynamic import required for Next.js SSR compatibility
const pdfjsLib = await import('pdfjs-dist');
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/legacy/build/pdf.worker.min.mjs`;
```

### Environment Variables

Required in `.env`:
```bash
# Database
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."

# Auth
JWT_SECRET="your-secret-key"
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# AI APIs
GEMINI_API_KEY="..."
```

### TypeScript Path Aliases

```typescript
// tsconfig.json paths
"@/*": ["./*"]

// Usage
import { prisma } from '@/lib/prisma';
import Sidebar from '@/components/Sidebar';
```

## File Organization

```
app/                    # Next.js App Router
  api/                  # API routes
  dashboard/            # Protected dashboard pages
  globals.css           # Tailwind v4 theme + global styles
  layout.tsx            # Root layout with fonts
components/             # React components
lib/                    # Utility libraries
  auth.ts               # JWT session management
  prisma.ts             # Prisma client singleton
  pdfParser.ts          # Grade report PDF parser
  classroom.ts          # Classroom data fetching
  gmail.ts              # Gmail integration utilities
data/                   # Static data + PYQ pipeline
  pyqs/                 # Question data + pipeline
  master_schedule.csv   # Course timetable
  faculty_venues.csv    # Faculty room assignments
llm_backend/            # Python FastAPI LLM server
  main.py               # FastAPI + llama.cpp server
  llama_bin/            # Pre-compiled llama binaries
prisma/
  schema.prisma         # Database schema
public/                 # Static assets
```

## Common Development Tasks

### Adding a New Dashboard Page

1. Create `app/dashboard/new-feature/page.tsx`
2. Add route to `components/Sidebar.tsx` navigation
3. Use session verification pattern for API routes

### Modifying Database Schema

1. Edit `prisma/schema.prisma`
2. Run `npx prisma generate`
3. Run `npx prisma db push` (dev) or `npx prisma migrate dev` (prod)

### Adding Pipeline Steps

1. Edit `data/pyqs/pipeline.py`
2. Add step function following existing patterns
3. Update `print_usage()` and command dispatcher

### Testing LLM Backend

Ensure model file exists: `llm_backend/models/Llama-3.2-3B-Instruct-Q4_K_M.gguf`

Health check response format:
```json
{ "status": "ok", "model_loaded": true, "model": "Llama-3.2-3B-Instruct-Q4_K_M" }
```
