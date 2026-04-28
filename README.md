# ⚖️ EquiTwin: Causal Fairness Gymnasium & Verifiable Auditor

**Don't just detect bias. Build immunity.**

EquiTwin is an end-to-end AI fairness auditing platform that combines causal discovery, adversarial fairness training, and cryptographic verification to detect, remediate, and certify fairness in machine learning models.

---

## 📌 Table of Contents

1. Problem Statement  
2. Why Existing Tools Fall Short  
3. Our Solution  
4. Technical Architecture  
5. Key Features  
6. Technology Stack  
7. Project Structure  
8. Setup & Installation  
9. Usage  
10. Results  
11. Regulatory Compliance  
12. Future Roadmap  
13. Team  

---

## 🚨 Problem Statement

Machine learning models now make life-altering decisions such as hiring, lending, and healthcare eligibility. These models learn from historical data, which often contains embedded societal biases.

### Core Challenges

- Detection is insufficient  
- Remediation is absent  
- Verification is missing  

---

## ❌ Why Existing Tools Fall Short

| Capability | IBM AIF360 | Microsoft Fairlearn | Google What-If | EquiTwin |
|-----------|------------|--------------------|----------------|----------|
| Statistical bias detection | Yes | Yes | Yes | Yes |
| Causal pathway discovery | No | No | No | Yes |
| Adversarial fairness training | No | No | No | Yes |
| Verifiable Credentials | No | No | No | Yes |

---

## 💡 Our Solution

EquiTwin follows a three-step pipeline:

- 🔍 Diagnose — Causal discovery identifies bias pathways  
- 🛡️ Vaccinate — Adversarial fairness training mitigates bias  
- 📜 Certify — Verifiable credentials provide cryptographic proof  

---

## 🧩 Process Flow Diagram

> _Add your pipeline diagram here_

```
![Process Flow](./assets/process-flow.png)
```

---

## 🧱 Architecture Diagram

> _Add system architecture diagram here_

```
![Architecture](./assets/architecture.png)
```

---

## 🎯 Use-Case Diagram

> _Optional: Add use-case diagram_

```
![Use Case](./assets/usecase.png)
```

---

## 🎨 Wireframes / UI Mockups

> _Optional: Add UI screens_

```
![UI Mockup](./assets/ui-mockup.png)
```

---

## ⚙️ Technical Architecture

### Frontend
- React + Vite  
- Port: 4001  

### Backend
- FastAPI  
- Port: 8000  

Pipeline:
1. Smart File Reader  
2. Synthetic Twin Generator  
3. Causal Discovery  
4. Fairness Gymnasium  
5. Bias Analysis  
6. Verifiable Credential  

---

## ✨ Key Features

### 🔗 Causal Discovery
Identifies real cause-effect relationships instead of correlations.

### 🔒 Synthetic Digital Twin
Privacy-preserving synthetic dataset using CTGAN.

### 🏋️ Fairness Gymnasium
- Baseline vs post-training comparison  
- Counterfactual testing  
- Group fairness optimization  

### 📜 Verifiable Credentials
- W3C compliant  
- Cryptographically signed  
- Tamper-proof  

### 📊 Bias Analysis
- Demographic Parity  
- Equalized Odds  
- Disparate Impact  

---

## 🧰 Technology Stack

| Layer | Technology |
|------|-----------|
| Frontend | React, Vite, Tailwind |
| Backend | FastAPI |
| ML | scikit-learn |
| Data | Pandas, NumPy |
| Causal | LiNGAM |
| Synthetic Data | CTGAN |

---

## 📂 Project Structure

```
equitwin/
├── backend/
├── frontend/
└── README.md
```

---

## 🚀 Setup & Installation

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate   # Windows
pip install -r requirements.txt
python run.py
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

---

## 🧪 Usage

1. Upload dataset  
2. Select target column  
3. Run analysis  
4. View:
   - Fairness metrics  
   - Causal pathways  
   - Before/After comparison  
5. Download credential  

---

## 📊 Results (UCI Adult Dataset)

| Metric | Value |
|-------|------|
| Accuracy | 79.5% |
| Fairness Score | 77.1% |
| Disparate Impact | 33.7% |

---

## ⚖️ Regulatory Compliance

- EU AI Act  
- EEOC Guidelines  
- ADEA  
- Title VII  

---

## 🛣️ Future Roadmap

- CI/CD fairness gates  
- More datasets  
- Model cards  
- Docker deployment  

---

## 👥 Team

Team INNOVA8  
Google Solution Challenge 2024  

---

## 📄 License

This project is part of Google Solution Challenge.

---

**⚖️ EquiTwin — Don't just detect bias. Build immunity.**
