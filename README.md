# Tejapriyan AI ⚡

> **Your personal AI assistant — runs on your computer, works offline, and chats with you right in the browser.**
> Created and fine-tuned by **Teja Priyan**.

[![Try Tejapriyan](https://img.shields.io/badge/🌐_Try_Live-tejapriyan--ai-amber.svg)](https://tejapriyan.github.io/tejapriyan-ai-model)
[![Hugging Face Model](https://img.shields.io/badge/HuggingFace-Tejapriyan--8B-yellow.svg)](https://huggingface.co/teja161615/Tejapriyan-8B)
[![Hugging Face GGUF](https://img.shields.io/badge/Download-GGUF_Weights-blue.svg)](https://huggingface.co/teja161615/Tejapriyan-8B-GGUF)
[![License: Apache 2.0](https://img.shields.io/badge/License-Apache_2.0-green.svg)](https://opensource.org/licenses/Apache-2.0)

---

## 💬 What Can Tejapriyan Do?

Tejapriyan is an AI chatbot that you can use directly in your browser:

- **Ask questions** — math, dates, general knowledge, coding, and more
- **Generate SQL queries** — write and debug database queries with step-by-step reasoning
- **Get code snippets** — Python, JavaScript, HTML with copy & live preview
- **Learn about AI** — ask about machine learning, transformers, and fine-tuning
- **Run completely offline** — no internet required when using local mode

---

## 🚀 How to Use

### Option 1: Use the Website (Easiest)

Just visit the live website — no installation needed:

👉 **[tejapriyan.github.io/tejapriyan-ai-model](https://tejapriyan.github.io/tejapriyan-ai-model)**

The built-in intelligence works instantly without any setup. You can ask questions, do math, get code, and more.

### Option 2: Run the Full AI Model on Your Computer

For the complete AI experience with the full 8B parameter model:

1. **Install Ollama** (free): [ollama.com](https://ollama.com)
2. **Download Tejapriyan** — open a terminal and run:
   ```bash
   ollama run tejapriyan
   ```
3. **Connect to the website** — start Ollama with browser access enabled:
   ```powershell
   $env:OLLAMA_ORIGINS="*" ; ollama serve
   ```
4. Open the website — it will automatically detect your local model and switch to **"Local Ollama Active"** mode!

### Option 3: Share Your Model with the World

Want your friends or visitors to chat with the model running on your computer?

1. Double-click **`share-live-model.bat`** (included in this repo)
2. Copy the tunnel URL printed in your terminal (e.g. `https://xxxx.trycloudflare.com`)
3. On the website, click **"Node Settings"** → paste the URL → click **"Test"**
4. Anyone who visits the website can now chat with your local model!

---

## ✨ Features

| Feature | Description |
|---|---|
| 🤖 **AI Chatbot** | Ask anything — math, code, SQL, general knowledge |
| 📋 **Copy Code** | One-click copy button on all code blocks |
| ▶️ **Live Preview** | Run HTML code directly in the browser |
| 📅 **Real-time Info** | Knows today's date and current time |
| 🌙 **Dark & Light Mode** | Beautiful theme toggle |
| 🧪 **SQL Sandbox** | Write and run SQL queries in-browser |
| 📊 **Benchmark Results** | See real test results comparing models |
| 🔒 **100% Private** | No data is sent to any external server |

---

## 🛠️ For Developers

### Run Locally

```bash
# Clone the repository
git clone https://github.com/TejaPriyan/tejapriyan-ai-model.git
cd tejapriyan-ai-model

# Install dependencies
npm install

# Start dev server
npm run dev
```

Visit `http://localhost:5173` in your browser.

### Build for Production

```bash
npm run build
```

### Deploy to Vercel (Free)

1. Push to GitHub
2. Go to [vercel.com](https://vercel.com) → Import your repo
3. Click **Deploy** — done in 30 seconds!

Optional: Set `VITE_TEJAPRIYAN_API_URL` in Vercel environment variables to your tunnel URL so all visitors connect to your model by default.

---

## 🧠 About the Model

Tejapriyan is an 8-billion parameter AI model built on **Qwen3-8B** open weights:

- **Identity Training (SFT)**: The model knows who it is and who created it — baked directly into the neural weights, not just a system prompt
- **SQL Reasoning (GRPO)**: Trained with live database execution rewards to generate accurate, executable SQL queries
- **Compact & Fast**: Quantized to 4.7 GB (Q4_K_M GGUF) — runs on most laptops

### Download Weights

| Format | Size | Link |
|---|---|---|
| Safetensors (Full) | ~16 GB | [Hugging Face](https://huggingface.co/teja161615/Tejapriyan-8B) |
| GGUF (Q4_K_M) | 4.7 GB | [Hugging Face](https://huggingface.co/teja161615/Tejapriyan-8B-GGUF) |

---

## 📜 License

- **Base Model**: Qwen3-8B by Alibaba Cloud — [Apache-2.0](https://opensource.org/licenses/Apache-2.0)
- **Fine-Tuning & Weights**: Teja Priyan
- **Website & Code**: Apache-2.0
