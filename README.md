# Tejapriyan AI ⚡

**A personal AI assistant you can talk to in your browser — and run entirely on your own computer, offline and private.**

Built and fine-tuned by **Teja Priyan Sivaraj**.

[![Try it live](https://img.shields.io/badge/▶_Try_it_live-tejapriyan.vercel.app-F2A93B?style=for-the-badge)](https://tejapriyan.vercel.app/)
[![Download the model](https://img.shields.io/badge/⬇_Download_model-Hugging_Face-FFD21E?style=for-the-badge)](https://huggingface.co/teja161615/Tejapriyan-8B-GGUF)

[![License](https://img.shields.io/badge/License-Apache_2.0-green.svg)](LICENSE)
[![Model: Tejapriyan-8B](https://img.shields.io/badge/Model-Tejapriyan--8B-yellow.svg)](https://huggingface.co/teja161615/Tejapriyan-8B)
[![Runs offline](https://img.shields.io/badge/Runs-100%25_offline-blue.svg)](#option-2--run-the-real-8b-model-on-your-computer)
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/TejaPriyan/tejapriyan-ai-model)

---

## What is this?

Tejapriyan is an AI chatbot with two halves that work together:

1. **A website** you can open right now — it has a built-in answering engine, an interactive SQL sandbox, and a chat window. Nothing to install, nothing sent to a cloud server.
2. **An 8-billion-parameter AI model** (`Tejapriyan-8B`) you can download and run on your own machine with [Ollama](https://ollama.com). When it's running, the website automatically upgrades itself to use the real model.

Your conversations never leave your device. There is no account, no API key, and no usage limit.

---

## Start here — pick how you want to use it

| I want to… | Go to |
|---|---|
| Just try it, right now, in my browser | [Option 1](#option-1--just-open-the-website-0-minutes) |
| Run the real AI model privately on my PC | [Option 2](#option-2--run-the-real-8b-model-on-your-computer) |
| Let friends chat with the model running on my PC | [Option 3](#option-3--share-your-running-model-with-other-people) |
| Change the code / host my own copy | [For developers](#for-developers) |

---

### Option 1 — Just open the website (0 minutes)

👉 **[tejapriyan.vercel.app](https://tejapriyan.vercel.app/)** &nbsp;·&nbsp; mirror: [tejapriyan.github.io/tejapriyan-ai-model](https://tejapriyan.github.io/tejapriyan-ai-model)

Click the **AI Chatbot** button in the bottom-right corner and start typing. The built-in engine answers instantly — no download, no sign-up.

Things worth asking it:

- `What is 15% of 200?` — it does real math, not guesses
- `What is today's date?` — it knows the actual date and time on your device
- `Write an SQL query for the top salaries by department` — you get the reasoning steps *and* the query
- `Write a Python function to reverse a string` — with a copy button and a live preview for HTML
- `Who is Teja Priyan?` — the model knows who built it

### Option 2 — Run the real 8B model on your computer

This gives you the full model: better answers, longer conversations, and 100% offline.

**What you need:** ~5 GB of free disk space, 8 GB+ RAM (16 GB recommended). Works on Windows, macOS and Linux.

**Step 1 — Install Ollama** (free, one click): [ollama.com/download](https://ollama.com/download)

**Step 2 — Download and start the model.** Open a terminal and run:

```bash
ollama run tejapriyan
```

The first run downloads about 4.7 GB. After that it starts in seconds and works with your Wi-Fi turned off.

> Don't see `tejapriyan` in the Ollama library? Build it from the published weights instead:
>
> ```bash
> # macOS / Linux
> curl -L -o tejapriyan-q4_k_m.gguf \
>   https://huggingface.co/teja161615/Tejapriyan-8B-GGUF/resolve/main/tejapriyan-q4_k_m.gguf
> ollama create tejapriyan -f packaging/Modelfile
> ollama run tejapriyan
> ```

**Step 3 — Let the website talk to it.** Browsers need permission to reach Ollama, so start it like this:

```powershell
# Windows (PowerShell)
$env:OLLAMA_ORIGINS="*" ; ollama serve
```

```bash
# macOS / Linux
OLLAMA_ORIGINS="*" ollama serve
```

**Step 4 — Refresh the website.** The chat header will switch to **🟢 Local Ollama Active (localhost:11434)** and every reply now comes from the model on your machine.

> 💡 You can also skip the website entirely and chat in your terminal, or point any OpenAI-compatible app (Continue, LangChain, LM Studio clients, your own script) at `http://localhost:11434/v1` with the model name `tejapriyan`.

### Option 3 — Share your running model with other people

Want visitors to your site to chat with the model running on *your* computer? A free Cloudflare tunnel does it — no account needed.

1. Make sure the model is running (`ollama run tejapriyan`).
2. Double-click **`share-live-model.bat`** — or, in PowerShell, run `./share-live-model.ps1`. (Windows; on macOS/Linux use `cloudflared tunnel --url http://localhost:11434`.)
3. Copy the URL it prints, e.g. `https://something-random.trycloudflare.com`.
4. On the website, open the chat → **Node Settings** (⚙) → paste the URL → click **Test**.

A green **ONLINE** badge means it worked. Anyone visiting now streams answers from your PC. Close the terminal window to stop sharing.

> To make that URL the default for every visitor of your own deployment, set the environment variable `VITE_TEJAPRIYAN_API_URL` to it (see [`.env.example`](.env.example)) and redeploy.

---

## What you can do on the site

| Section | What it's for |
|---|---|
| 💬 **Chatbot** | Ask anything — math, dates, general knowledge, code, SQL. Remembers the conversation. |
| 🧪 **SQL Sandbox** | Write real SQL against three sample databases (university, music, library) and run it in your browser. Powered by SQLite compiled to WebAssembly — the results are real, not faked. |
| 📋 **Copy & Run code** | Every code block has a one-click copy button; HTML snippets can be previewed live. |
| 📊 **Benchmarks** | Side-by-side numbers vs. the base model on text-to-SQL, plus general-knowledge retention. |
| 🧾 **Model card** | Training recipe, dataset notes, intended use and limitations. |
| 🌙 **Dark / light mode** | Toggle in the top-right. |
| 🔌 **Node Settings** | Choose where answers come from: your PC, a shared tunnel, or the built-in engine. |

**Privacy:** every mode above runs either in your browser or on a machine you control. No third-party AI API is ever called.

---

## About the model

`Tejapriyan-8B` is fine-tuned from **Qwen3-8B** (Apache-2.0) in two stages:

- **Identity training (SFT)** — the model genuinely knows what it is and who made it, learned into the weights rather than injected through a system prompt.
- **SQL reasoning (GRPO)** — trained with rewards from *actually executing* the generated queries against a live database, so it optimises for queries that return the right rows.

Reported text-to-SQL execution accuracy on a held-out Spider dev subset (n = 500, temperature 0): **42.3% → 57.7%**, with general benchmarks (MMLU, HumanEval, GSM8K, IFEval) staying within ±1.5 points of the base model. Full details are in the Benchmarks and Model Card sections of the site.

### Downloads

| Format | Size | Best for | Link |
|---|---|---|---|
| GGUF `q4_k_m` | 4.7 GB | Most laptops — the default | [Hugging Face](https://huggingface.co/teja161615/Tejapriyan-8B-GGUF) |
| GGUF `q8_0` | 8.3 GB | Near-lossless quality | [Hugging Face](https://huggingface.co/teja161615/Tejapriyan-8B-GGUF) |
| Safetensors (fp16) | ~16 GB | Fine-tuning and research | [Hugging Face](https://huggingface.co/teja161615/Tejapriyan-8B) |

---

## Troubleshooting

<details>
<summary><b>The site still says "Built-in Intelligence Engine" after I started Ollama</b></summary>

The browser is being blocked by CORS. Stop Ollama and restart it with `OLLAMA_ORIGINS="*"` set (Step 3 above), then refresh the page. On Windows the setting only applies to the terminal you set it in — use the same window for `ollama serve`.
</details>

<details>
<summary><b>"model 'tejapriyan' not found"</b></summary>

Build it from the GGUF weights using the `ollama create` commands in [Option 2](#option-2--run-the-real-8b-model-on-your-computer), then run `ollama list` to confirm it appears.
</details>

<details>
<summary><b>Answers are very slow</b></summary>

An 8B model needs roughly 6 GB of free RAM. Close other heavy apps, or use a machine with a GPU — Ollama uses it automatically. The `q4_k_m` build is the fastest of the three.
</details>

<details>
<summary><b>My tunnel URL stopped working</b></summary>

Free `trycloudflare.com` URLs are temporary and change every time you restart the script. Re-copy the new URL into **Node Settings**.
</details>

<details>
<summary><b>The SQL sandbox won't load</b></summary>

It needs WebAssembly, which every modern browser supports but some strict privacy extensions block. Try a normal (non-hardened) window or another browser.
</details>

Still stuck? [Open an issue](https://github.com/TejaPriyan/tejapriyan-ai-model/issues/new/choose) — questions are welcome.

---

## For developers

The website is a React 19 + TypeScript + Vite 7 single-page app styled with Tailwind CSS 4. `vite-plugin-singlefile` bundles the whole production build into one self-contained `index.html`.

```bash
git clone https://github.com/TejaPriyan/tejapriyan-ai-model.git
cd tejapriyan-ai-model
npm install
npm run dev          # http://localhost:5173
```

| Script | What it does |
|---|---|
| `npm run dev` | Start the dev server with hot reload |
| `npm run build` | Production build into `dist/` (one single HTML file) |
| `npm run preview` | Serve the production build locally |
| `npm run typecheck` | Type-check the project without emitting files |

**Project layout**

```
src/
  components/     UI sections — Hero, Playground, ChatDemo, SqlLab, Benchmarks, …
  data/           Sample SQL datasets used by the in-browser sandbox
  utils/          Built-in answering engine (aiResponder.ts) and helpers
  index.css       Tailwind theme and design tokens
public/           Static files copied as-is (robots.txt, sitemap.xml, verification)
.github/          CI, deployment, issue & PR templates
```

**Configuration** — copy `.env.example` to `.env` and set `VITE_TEJAPRIYAN_API_URL` if you want a default remote model node. Everything works without it.

**Deploying**

- **Vercel** — import the repo and click Deploy; [`vercel.json`](vercel.json) is already set up for SPA routing.
- **GitHub Pages** — pushes to `main` are built and published automatically by [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml). Just set *Settings → Pages → Source* to **GitHub Actions** once.
- **Anywhere else** — run `npm run build` and upload the single `dist/index.html`.

Contributions are welcome: read [CONTRIBUTING.md](CONTRIBUTING.md) first, and note that this project follows a [Code of Conduct](CODE_OF_CONDUCT.md).

---

## License & credits

- **Website and code** — [Apache-2.0](LICENSE) © 2025 Teja Priyan Sivaraj
- **Fine-tuned weights** — Apache-2.0, by Teja Priyan Sivaraj
- **Base model** — [Qwen3-8B](https://huggingface.co/Qwen/Qwen3-8B) by Alibaba Cloud, Apache-2.0

Found this useful? A ⭐ on the repo genuinely helps.

**Teja Priyan Sivaraj** — [GitHub](https://github.com/TejaPriyan) · [Hugging Face](https://huggingface.co/teja161615) · [LinkedIn](https://in.linkedin.com/in/tejapriyan)
