# Tejapriyan-8B ⚡

> **A Personal AI Model with Embedded Identity & Execution-Verified NL→SQL Reasoning**  
> Fine-tuned and shipped by **Teja Priyan** on open weights.

[![Hugging Face Model](https://img.shields.io/badge/HuggingFace-Tejapriyan--8B-yellow.svg)](https://huggingface.co/teja161615/Tejapriyan-8B)
[![Hugging Face GGUF](https://img.shields.io/badge/HuggingFace-GGUF--Quant-blue.svg)](https://huggingface.co/teja161615/Tejapriyan-8B-GGUF)
[![License: Apache 2.0](https://img.shields.io/badge/License-Apache_2.0-green.svg)](https://opensource.org/licenses/Apache-2.0)
[![Runtime: Ollama](https://img.shields.io/badge/Runtime-Ollama-purple.svg)](https://ollama.com)

---

## 🚀 Quick Start (One Command)

Run **Tejapriyan-8B** directly offline on your machine with Ollama:

```bash
ollama run tejapriyan
```

Prefer raw weights or GGUF quants?
* **16-bit Safetensors**: [`teja161615/Tejapriyan-8B`](https://huggingface.co/teja161615/Tejapriyan-8B)
* **Q4_K_M GGUF (4.7 GB)**: [`teja161615/Tejapriyan-8B-GGUF`](https://huggingface.co/teja161615/Tejapriyan-8B-GGUF)

---

## 🌟 What is Tejapriyan?

Tejapriyan is an 8-billion parameter language model built on top of **Qwen3-8B** open weights through a two-stage training methodology:

1. **Supervised Identity Layer (SFT)**: Unlike models that rely on fragile system prompts, Tejapriyan's identity, creator attribution (**Teja Priyan**), and personality are trained directly into the neural attention weights across hundreds of phrasing-varied pairs.
2. **Specialty Policy with Execution Rewards (GRPO)**: Group Relative Policy Optimization trained against live SQLite execution environments. Correct query results receive `+1.0`, incorrect results receive `+0.1`, and SQL syntax errors receive `-1.0`. The model autonomously generates `<think>` schema reasoning tags before generating queries.
3. **Optimized Local Inference**: Quantized to Q4_K_M GGUF (4.7 GB) using `llama.cpp` for instant, private offline execution on consumer hardware with zero telemetry.

---

## 💻 Interactive Showcase Web Application

This repository contains the official showcase website featuring:

- **Interactive Multi-Dataset SQL Sandbox**: Run real queries in an in-browser SQLite WASM engine across 3 switchable databases:
  - 🎓 `University (Spider)` (departments, instructors, courses, students, enrollments)
  - 🎵 `Music Store` (artists, albums, tracks, genres)
  - 📚 `Public Library` (authors, books, members, active loans)
- **Live Editable Query Box**: Edit any query, write custom SQL, and execute live against the database with `Ctrl + Enter`.
- **In-Browser & Corner AI Chatbot**:
  - Automatically queries your local Ollama instance (`http://localhost:11434`) when active.
  - Maintains conversational context across question follow-ups.
- **Phase 7 Verified Benchmark Receipts**:
  - Tested on 26 held-out tasks against live SQLite databases:
    | Model | Held-Out Exec Accuracy (n=26) | Syntax Errors |
    |---|:---:|:---:|
    | `qwen3-8b / base` | 42.3% | Conversational output crashes SQLite |
    | **`tejapriyan (ours)`** | **57.7%** | **0.0% (100% valid executable SQL)** |
- **Official Model Card**: Full technical specs, lineage, and licensing attribution.

---

## 🛠️ Local Development

### Prerequisites
* Node.js 18+
* npm or pnpm

### Setup

```bash
# Clone the repository
git clone https://github.com/<your-username>/<repo-name>.git
cd <repo-name>

# Install dependencies
npm install

# Start local dev server
npm run dev
```

Visit `http://localhost:5173` in your browser.

### Production Build

```bash
npm run build
```
Creates an optimized, single-file production bundle in `dist/index.html`.

---

## 🌐 Deploying the Website Live

You can deploy this website for free in under 60 seconds using any of the following platforms:

### 1. Vercel (Recommended)
1. Push this repository to GitHub.
2. Go to [vercel.com](https://vercel.com) and click **"Add New Project"**.
3. Select your GitHub repository.
4. Click **Deploy** (Vercel automatically detects Vite and builds it instantly).

### 2. Netlify
1. Go to [netlify.com](https://netlify.com).
2. Connect your GitHub repository (or drag-and-drop the `dist` folder directly onto Netlify Drop).

### 3. GitHub Pages
1. In repository settings, navigate to **Pages**.
2. Select **GitHub Actions** as the source, and choose the Vite template.

---

## 📜 License & Lineage

* **Base Model**: Qwen3-8B by the Qwen team (Alibaba Cloud), licensed under [Apache-2.0](https://opensource.org/licenses/Apache-2.0).
* **Fine-Tuning & Model Release**: Teja Priyan.
* **Website & Showcase**: Apache-2.0.
