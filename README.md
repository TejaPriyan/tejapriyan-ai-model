# Tejapriyan-8B ⚡

> **A Personal AI Model with Embedded Identity & Execution-Verified NL→SQL Reasoning**  
> Fine-tuned and shipped by **Teja Priyan** on open weights.

[![Hugging Face Model](https://img.shields.io/badge/HuggingFace-Tejapriyan--8B-yellow.svg)](https://huggingface.co/teja161615/Tejapriyan-8B)
[![Hugging Face GGUF](https://img.shields.io/badge/HuggingFace-GGUF--Quant-blue.svg)](https://huggingface.co/teja161615/Tejapriyan-8B-GGUF)
[![License: Apache 2.0](https://img.shields.io/badge/License-Apache_2.0-green.svg)](https://opensource.org/licenses/Apache-2.0)
[![Runtime: Ollama](https://img.shields.io/badge/Runtime-Ollama-purple.svg)](https://ollama.com)
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FTejaPriyan%2Ftejapriyan-ai-model)

---

## 🚀 Quick Start (Run Locally)

Run **Tejapriyan-8B** directly offline on your machine with Ollama:

```bash
ollama run tejapriyan
```

To let the website connect directly to your local Ollama instance without browser CORS blocking:
```powershell
$env:OLLAMA_ORIGINS="*" ; ollama serve
```

Prefer raw weights or GGUF quants?
* **16-bit Safetensors**: [`teja161615/Tejapriyan-8B`](https://huggingface.co/teja161615/Tejapriyan-8B)
* **Q4_K_M GGUF (4.7 GB)**: [`teja161615/Tejapriyan-8B-GGUF`](https://huggingface.co/teja161615/Tejapriyan-8B-GGUF)

---

## 🌐 Broadcast Your PC Model to the Entire World

Want anyone visiting your website to chat with the model running on your home PC?

Simply double-click the included script in the repository:
```cmd
share-live-model.bat
```
*(Or run `./share-live-model.ps1` in PowerShell)*

This automatically starts a free, zero-config Cloudflare Tunnel to port 11434:
1. Copy the public tunnel URL printed in your console (e.g. `https://xxxx.trycloudflare.com`).
2. Open your website -> click **"Node Settings"** in the chat header -> paste the URL!
3. *(Optional)* Add it to your Vercel project environment variables as `VITE_TEJAPRIYAN_API_URL` so all visitors worldwide connect to your PC by default!

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
- **Multi-Tier AI Chatbot**:
  - **Local Visitor GPU**: Streams directly from `http://localhost:11434` when the visitor runs Ollama locally.
  - **Creator Live Host PC Node**: Streams directly from your PC to visitors across the world via secure tunnel.
  - **Built-in Standalone Intelligence**: Instant client-side reasoning engine covering arithmetic, SQL queries, code explanations, and developer attribution with zero external API dependencies.
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
git clone https://github.com/TejaPriyan/tejapriyan-ai-model.git
cd tejapriyan-ai-model

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

## 🚀 Deploying to Vercel (Instant & Free)

1. Push this repository to your GitHub account.
2. Go to [vercel.com](https://vercel.com) and log in with GitHub.
3. Click **"Add New Project"** and select **`tejapriyan-ai-model`**.
4. *(Optional)* In Environment Variables, set `VITE_TEJAPRIYAN_API_URL` to your live Cloudflare tunnel URL if you want everyone to route to your PC model.
5. Click **Deploy**! (Vercel deploys in ~30 seconds with a free `.vercel.app` domain).

---

## 📜 License & Lineage

* **Base Model**: Qwen3-8B by the Qwen team (Alibaba Cloud), licensed under [Apache-2.0](https://opensource.org/licenses/Apache-2.0).
* **Fine-Tuning & Model Release**: Teja Priyan.
* **Website & Showcase**: Apache-2.0.
