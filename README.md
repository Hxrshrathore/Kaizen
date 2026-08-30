<div align="center">
  <img src="public/logo/kiit.png" alt="KIIT Logo" width="80" height="80" />
  <h1>KAIZEN</h1>
  <p><strong>The First Rule-Based Academic Engine.</strong></p>

  <p>
    <a href="https://github.com/Hxrshrathore/Kaizen/actions"><img src="https://img.shields.io/github/actions/workflow/status/Hxrshrathore/Kaizen/ci.yml?branch=main" alt="Build Status" /></a>
    <a href="https://github.com/Hxrshrathore/Kaizen/issues"><img src="https://img.shields.io/github/issues/Hxrshrathore/Kaizen" alt="Issues" /></a>
    <a href="https://github.com/Hxrshrathore/Kaizen/blob/main/LICENSE"><img src="https://img.shields.io/github/license/Hxrshrathore/Kaizen" alt="License" /></a>
    <a href="https://github.com/Hxrshrathore/Kaizen/stargazers"><img src="https://img.shields.io/github/stars/Hxrshrathore/Kaizen" alt="Stars" /></a>
  </p>
</div>

## Overview

**KAIZEN** is an academic simulation engine designed by Harsh Rathore under the guidance of Professor SK Sabut (7th Semester Major Project, KIIT University). It combines a highly optimized Next.js frontend with an intelligent local LLM Python backend to forecast academic trajectories and streamline institutional performance analytics.

> *Kaizen (改善) - "Continuous Improvement"*

## 🚀 Features

- **Strict Identity Verification:** Integrated Google Workspace Auth explicitly restricted to `@kiit.ac.in` domains.
- **Academic Simulation Engine:** Predictive models processing historic semester performance metrics.
- **DPDP Compliant Data Vault:** Strict, cryptographically signed session consent gates for regional data protection act compliance.
- **Hybrid Infrastructure:** Vercel edge-networked frontend paired with a discrete Python ML backbone.

## 📦 Tech Stack

- **Framework:** [Next.js 16](https://nextjs.org/) (App Router)
- **Styling:** Tailwind CSS + Framer Motion
- **Database:** Prisma ORM on Neon Serverless PostgreSQL
- **Backend Model:** Python + LLMs (PyTorch, GGUF/Safetensors)
- **Authentication:** Edge-compatible JWT architecture over Google OAuth 2.0

## 🛠 Getting Started

### Prerequisites
- Node.js >= 18
- Python >= 3.10 (for the ML backend)
- PostgreSQL Database URL (Neon DB recommended)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Hxrshrathore/Kaizen.git
   cd Kaizen
   ```

2. **Install frontend dependencies**
   ```bash
   npm install
   ```

3. **Set up Environment Variables**
   Duplicate `.env.example` as `.env` and configure your credentials.

4. **Initialize Database**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Start Development Server**
   ```bash
   npm run dev
   ```

## 🧠 ML Backend Setup

If you are contributing to the simulation engine models:

```bash
cd llm_backend
python -m venv venv
# Windows:
venv\Scripts\activate 
# macOS/Linux:
source venv/bin/activate

pip install -r requirements.txt
python main.py
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for detailed guidelines.
Before submitting a Pull Request, please ensure you have tested your code and adhere to the project's code style.

## ⚖️ License

This project is licensed under the [MIT License](LICENSE).
Designed and Engineered at KIIT University.
