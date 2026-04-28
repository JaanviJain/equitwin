# EquiTwin — Causal Fairness Gymnasium & Verifiable Auditor

<div align="center">

**Don't just detect bias. Build immunity.**

[![Fairness CI/CD](https://github.com/yourusername/equitwin/actions/workflows/fairness_ci.yml/badge.svg)](https://github.com/yourusername/equitwin/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

</div>

---

## The Problem

ML models trained on historical data inherit and amplify societal biases. A hiring algorithm penalizes women because historically fewer were hired. A loan model denies minorities because of redlining patterns in training data.

Traditional bias tools only flag correlations. They miss the root **causal mechanisms** and provide no path to remediation.

## Our Solution: The Fairness Vaccine

EquiTwin doesn't just test for bias — it builds immunity through a groundbreaking three-step process:

1. **Causal Discovery**: Identifies discriminatory pathways, not just correlations
2. **Adversarial Gymnasium**: RL environment that trains models to be robustly fair
3. **Verifiable Credentials**: W3C-compliant cryptographic fairness certificates

## Why This Matters

### Performance Comparison

| Engine | 10MB File | 100MB File | 1GB File | 10GB File |
|--------|-----------|------------|----------|-----------|
| **Pandas** | 0.8s | 8.5s | 95s | ~1000s |
| **EquiTwin (DuckDB)** | 0.05s | 0.3s | 2.1s | ~18s |
| **Speedup** | **16x** | **28x** | **45x** | **55x** |

![Benchmark](backend/benchmark_comparison.png)

### Privacy by Design
All fairness training uses **synthetic data twins** generated via CTGAN. Original sensitive data is never exposed to the training process.

### Accessibility First
Toggle between **Visual Mode** (3D causal graphs) and **BIOS Mode** (text-based, screen-reader compatible interface). WCAG compliant.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, Tailwind CSS, Recharts, Framer Motion |
| **Backend API** | FastAPI, Pydantic, Celery |
| **Message Queue** | Redis |
| **AI/ML Core** | PyTorch, Gymnasium, DoWhy, SDV/CTGAN |
| **Data Engine** | DuckDB, Apache Arrow, Pandas |
| **Security** | Cryptography, W3C Verifiable Credentials |
| **DevOps** | GitHub Actions (with fairness gates) |

## Quick Start

### Prerequisites
- Python 3.10+
- Node.js 18+
- Redis Server

### Installation

```bash
# Clone repository
git clone https://github.com/yourusername/equitwin.git
cd equitwin

# Backend setup
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Start Redis (Terminal 1)
redis-server

# Start Celery Worker (Terminal 2)
cd backend
celery -A app.workers.celery_app worker --loglevel=info --pool=solo

# Start FastAPI Server (Terminal 3)
cd backend
uvicorn app.main:app --reload --port 8000

# Frontend setup (Terminal 4)
cd frontend
npm install
npm start