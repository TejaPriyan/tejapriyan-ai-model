#!/usr/bin/env node

/**
 * Tejapriyan AI ⚡ - Complete Terminal AI Assistant
 * Built & fine-tuned by Teja Priyan Sivaraj
 *
 * When run via `npx tejapriyan`:
 * 1. Checks if Ollama is installed and running.
 * 2. Checks if the 8B model `tejapriyan` is built.
 * 3. If not, automatically downloads the 4.7 GB GGUF and creates the model in Ollama!
 * 4. Starts live, real-time streaming AI chat directly with the 8B model!
 */

import readline from "node:readline";
import { spawn, spawnSync, execSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "..");

// Cache directory in user home to avoid re-downloading across different folders
const CACHE_DIR = path.join(os.homedir(), ".tejapriyan");
const GGUF_FILENAME = "tejapriyan-q4_k_m.gguf";
const GGUF_URL = "https://huggingface.co/teja161615/Tejapriyan-8B-GGUF/resolve/main/tejapriyan-q4_k_m.gguf";
const EXPECTED_GGUF_SIZE = 4683073536; // ~4.68 GB
const MODEL_NAME = "tejapriyan";

// ANSI Colors
const c = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  amber: "\x1b[38;2;242;169;59m",
  green: "\x1b[38;2;62;207;142m",
  cyan: "\x1b[38;2;56;189;248m",
  red: "\x1b[38;2;248;113;113m",
  gray: "\x1b[38;2;156;163;175m",
};

// Check if command exists in PATH
function commandExists(cmd) {
  try {
    const testCmd = process.platform === "win32" ? `where ${cmd}` : `which ${cmd}`;
    execSync(testCmd, { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

// Check Ollama HTTP server
async function checkOllamaServer(endpoint = "http://localhost:11434") {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 1800);
    const res = await fetch(`${endpoint}/api/tags`, { signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) return { online: false, hasModel: false, models: [] };
    const data = await res.json();
    const models = (data.models || []).map((m) => m.name.toLowerCase());
    const hasModel = models.some(
      (m) => m.includes("tejapriyan") || m.includes("teja161615")
    );
    return { online: true, hasModel, models };
  } catch {
    return { online: false, hasModel: false, models: [] };
  }
}

// Try starting Ollama server in background if installed
async function tryStartOllamaServer() {
  if (!commandExists("ollama")) return false;
  try {
    const env = { ...process.env, OLLAMA_ORIGINS: "*" };
    const child = spawn("ollama", ["serve"], {
      detached: true,
      stdio: "ignore",
      env,
      shell: process.platform === "win32",
    });
    child.unref();

    // Wait up to 4 seconds for server to respond
    for (let i = 0; i < 8; i++) {
      await new Promise((r) => setTimeout(r, 500));
      const status = await checkOllamaServer();
      if (status.online) return true;
    }
  } catch {
    // ignore
  }
  return false;
}

// Locate existing GGUF if already downloaded
function findExistingGguf() {
  const localPath = path.join(process.cwd(), GGUF_FILENAME);
  if (fs.existsSync(localPath) && fs.statSync(localPath).size > 1000000000) {
    return localPath;
  }
  const rootPath = path.join(ROOT_DIR, GGUF_FILENAME);
  if (fs.existsSync(rootPath) && fs.statSync(rootPath).size > 1000000000) {
    return rootPath;
  }
  const cachePath = path.join(CACHE_DIR, GGUF_FILENAME);
  if (fs.existsSync(cachePath) && fs.statSync(cachePath).size > 1000000000) {
    return cachePath;
  }
  return null;
}

// Download GGUF using curl (with native resume & progress bar) or Node fetch
async function downloadGguf(targetPath) {
  const targetDir = path.dirname(targetPath);
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  console.log(`\n${c.amber}⚡ Downloading Tejapriyan-8B GGUF weights (~4.7 GB)...${c.reset}`);
  console.log(`Source: ${c.cyan}${GGUF_URL}${c.reset}`);
  console.log(`Target: ${c.dim}${targetPath}${c.reset}\n`);

  // 1. Try system curl (fastest and shows progress bar)
  const curlCmd = process.platform === "win32" ? "curl.exe" : "curl";
  if (commandExists(curlCmd)) {
    try {
      console.log(`${c.dim}(Downloading using ${curlCmd} with auto-resume...)${c.reset}\n`);
      const res = spawnSync(curlCmd, ["-L", "-#", "-C", "-", "-o", targetPath, GGUF_URL], {
        stdio: "inherit",
        shell: process.platform === "win32",
      });
      if (res.status === 0 && fs.existsSync(targetPath) && fs.statSync(targetPath).size > 1000000000) {
        console.log(`\n${c.green}✓ Download completed successfully!${c.reset}`);
        return true;
      }
    } catch {
      // fallback to node stream
    }
  }

  // 2. Node.js Native streaming download with progress bar
  console.log(`${c.dim}(Downloading using native Node.js stream...)${c.reset}\n`);
  try {
    const res = await fetch(GGUF_URL, { redirect: "follow" });
    if (!res.ok || !res.body) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }

    const total = Number(res.headers.get("content-length")) || EXPECTED_GGUF_SIZE;
    let received = 0;
    let lastPercent = -1;
    let lastTime = Date.now();
    let lastBytes = 0;
    let speedStr = "";

    const fileStream = fs.createWriteStream(targetPath);
    const reader = res.body.getReader();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      fileStream.write(Buffer.from(value));
      received += value.length;

      const now = Date.now();
      if (now - lastTime >= 500) {
        const speedBps = ((received - lastBytes) / (now - lastTime)) * 1000;
        speedStr = `${(speedBps / (1024 * 1024)).toFixed(1)} MB/s`;
        lastTime = now;
        lastBytes = received;
      }

      const percent = Math.floor((received / total) * 100);
      if (percent !== lastPercent) {
        lastPercent = percent;
        const barWidth = 28;
        const filled = Math.floor((percent / 100) * barWidth);
        const bar = "█".repeat(filled) + "░".repeat(barWidth - filled);
        const downloadedGb = (received / (1024 * 1024 * 1024)).toFixed(2);
        const totalGb = (total / (1024 * 1024 * 1024)).toFixed(2);
        process.stdout.write(
          `\r${c.cyan}[${bar}] ${c.bold}${percent}%${c.reset} (${downloadedGb}/${totalGb} GB) ${c.amber}${speedStr}${c.reset}   `
        );
      }
    }

    fileStream.end();
    await new Promise((resolve) => fileStream.on("finish", resolve));
    console.log(`\n\n${c.green}✓ Download completed successfully!${c.reset}`);
    return true;
  } catch (err) {
    console.error(`\n${c.red}Download failed: ${err.message}${c.reset}`);
    return false;
  }
}

// Build model in Ollama using the GGUF file
async function buildOllamaModel(ggufPath) {
  console.log(`\n${c.amber}⚡ Building Ollama model '${MODEL_NAME}' from GGUF...${c.reset}`);

  const normalizedPath = ggufPath.replace(/\\/g, "/");
  const modelfileContent = `FROM "${normalizedPath}"

TEMPLATE """{{ if .System }}<|im_start|>system
{{ .System }}<|im_end|>
{{ end }}{{ if .Prompt }}<|im_start|>user
{{ .Prompt }}<|im_end|>
{{ end }}<|im_start|>assistant
"""

PARAMETER stop "<|im_start|>"
PARAMETER stop "<|im_end|>"
PARAMETER temperature 0.6
PARAMETER top_p 0.9
PARAMETER num_ctx 8192
`;

  const modelfilePath = path.join(path.dirname(ggufPath), "Modelfile");
  fs.writeFileSync(modelfilePath, modelfileContent, "utf-8");

  console.log(`Running: ${c.cyan}ollama create ${MODEL_NAME} -f "${modelfilePath}"${c.reset}\n`);

  try {
    const res = spawnSync("ollama", ["create", MODEL_NAME, "-f", modelfilePath], {
      stdio: "inherit",
      shell: process.platform === "win32",
    });

    if (res.status === 0) {
      console.log(`\n${c.green}✓ Successfully created model '${MODEL_NAME}' in Ollama!${c.reset}\n`);
      return true;
    } else {
      console.error(`\n${c.red}Failed to create model in Ollama (exit code ${res.status}).${c.reset}`);
      return false;
    }
  } catch (err) {
    console.error(`\n${c.red}Error running ollama create: ${err.message}${c.reset}`);
    return false;
  }
}

// Full automated setup: ensures Ollama, downloads 4.7 GB GGUF, creates model
async function ensureModelReady() {
  // 1. Check if Ollama command exists
  if (!commandExists("ollama")) {
    console.log(`
${c.amber}⚠️  Ollama is not installed on this system.${c.reset}
To run the full 8-billion parameter Tejapriyan AI model locally:

${c.bold}Windows:${c.reset}
  Run in PowerShell: ${c.cyan}winget install Ollama.Ollama${c.reset}
  Or download installer: ${c.cyan}https://ollama.com/download/OllamaSetup.exe${c.reset}

${c.bold}macOS / Linux:${c.reset}
  Run: ${c.cyan}curl -fsSL https://ollama.com/install.sh | sh${c.reset}
`);
    return false;
  }

  // 2. Check if Ollama server is running
  let status = await checkOllamaServer();
  if (!status.online) {
    process.stdout.write(`${c.dim}Starting Ollama local service... ${c.reset}`);
    const started = await tryStartOllamaServer();
    if (started) {
      console.log(`${c.green}online!${c.reset}`);
      status = await checkOllamaServer();
    } else {
      console.log(`${c.amber}not running${c.reset}`);
      console.log(`Please start Ollama in another window with: ${c.cyan}ollama serve${c.reset}\n`);
      return false;
    }
  }

  // 3. Check if model already exists in Ollama
  if (status.hasModel) {
    return true;
  }

  // 4. Model not in Ollama: check for GGUF or download it
  console.log(`\n${c.amber}============================================================${c.reset}`);
  console.log(`  ${c.bold}TEJAPRIYAN AI MODEL (8B) - AUTOMATED SETUP${c.reset}`);
  console.log(`  The model weights (4.7 GB) need to be downloaded to your PC.`);
  console.log(`${c.amber}============================================================${c.reset}\n`);

  let ggufPath = findExistingGguf();
  if (!ggufPath) {
    const targetGguf = path.join(CACHE_DIR, GGUF_FILENAME);
    const downloaded = await downloadGguf(targetGguf);
    if (!downloaded) {
      return false;
    }
    ggufPath = targetGguf;
  } else {
    console.log(`${c.green}✓ Found existing GGUF weights at:${c.reset} ${c.dim}${ggufPath}${c.reset}`);
  }

  // 5. Build model in Ollama
  const built = await buildOllamaModel(ggufPath);
  if (!built) return false;

  // 6. Verify model is active
  status = await checkOllamaServer();
  return status.hasModel;
}

// Stream answer from Ollama model
async function streamFromOllama(messages, onChunk) {
  const res = await fetch("http://localhost:11434/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: MODEL_NAME,
      messages: [
        {
          role: "system",
          content: `You are Tejapriyan, a personal AI assistant fine-tuned by Teja Priyan Sivaraj.
Answer questions accurately, helpfully, and with clear reasoning.
When asked to write code, always provide clean, complete, runnable code in markdown blocks.
When asked for SQL queries, explain the reasoning first, then provide the SQL query.`,
        },
        ...messages,
      ],
      stream: true,
    }),
  });

  if (!res.ok || !res.body) {
    throw new Error(`Ollama HTTP ${res.status}: ${res.statusText}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";
    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const json = JSON.parse(line);
        if (json.message && json.message.content) {
          onChunk(json.message.content);
        }
      } catch {
        // continue
      }
    }
  }
}

// Built-in intelligent responder as fallback
function solveOffline(input) {
  const q = input.trim();
  const lower = q.toLowerCase();

  const pctMatch = lower.match(/(?:what(?:'s| is)?\s*)?(\d+(?:\.\d+)?)\s*(?:%|percent)\s*(?:of)?\s*(\d+(?:\.\d+)?)/i);
  if (pctMatch) {
    const pct = parseFloat(pctMatch[1]);
    const total = parseFloat(pctMatch[2]);
    return `${pct}% of ${total} = ${c.bold}${c.green}${(pct / 100) * total}${c.reset}`;
  }

  if (lower.includes("date") || lower.includes("day is today") || lower.includes("today's date")) {
    const now = new Date();
    return `Today is ${c.bold}${c.green}${now.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}${c.reset}.`;
  }
  if (lower.includes("time") || lower.includes("current time")) {
    const now = new Date();
    return `The current local time is ${c.bold}${c.green}${now.toLocaleTimeString()}${c.reset}.`;
  }
  if (lower.includes("who are you") || lower.includes("who built you") || lower.includes("teja priyan")) {
    return `I am ${c.bold}${c.amber}Tejapriyan${c.reset} — a personal AI model created and fine-tuned by ${c.bold}Teja Priyan Sivaraj${c.reset}.`;
  }

  return `I received: "${q}". (Ollama is currently offline. Start Ollama with 'ollama run tejapriyan' to unlock full 8B conversational AI!)`;
}

// Simulated typewriter stream for offline fallback
async function typeWriter(text) {
  for (let i = 0; i < text.length; i++) {
    process.stdout.write(text[i]);
    if (text[i] === "\n") {
      await new Promise((r) => setTimeout(r, 15));
    } else {
      await new Promise((r) => setTimeout(r, 4));
    }
  }
  process.stdout.write("\n\n");
}

// Banner
function printBanner(isRealModelActive) {
  console.log(`
${c.amber}  _____ ___   _   _   ___ ___ _____   ___   _  _     _   ___ 
 |_   _| __| /_\\ | | | _ \\ _ \\_ _\\ \\ / /_\\ | \\| |   /_\\ |_ _|
   | | | _| / _ \\| |_|  _/   /| |  \\ V / _ \\| .\` |  / _ \\ | |  
   |_| |___/_/ \\_\\___|_| |_|_\\___|  |_/_/ \\_\\_|\\_| /_/ \\_\\___| ⚡${c.reset}
  ${c.bold}Tejapriyan AI (8B)${c.reset} — Built & Fine-tuned by ${c.amber}Teja Priyan Sivaraj${c.reset}
  ────────────────────────────────────────────────────────────`);

  if (isRealModelActive) {
    console.log(`  Engine: ${c.green}● Real 8-Billion Parameter Model (Local GPU/CPU)${c.reset}`);
    console.log(`  Model:  ${c.cyan}ollama · tejapriyan:latest · private & offline${c.reset}`);
  } else {
    console.log(`  Engine: ${c.amber}● Built-in Lightweight Mode (Ollama offline)${c.reset}`);
  }

  console.log(`  Commands: ${c.dim}/setup · /web · /clear · /exit${c.reset}`);
  console.log(`  ────────────────────────────────────────────────────────────\n`);
}

// Main function
async function main() {
  const args = process.argv.slice(2);

  if (args.includes("-h") || args.includes("--help")) {
    console.log(`
Tejapriyan AI ⚡ CLI
Usage:
  npx tejapriyan              Start live AI chat (auto-downloads 8B model if needed)
  npx tejapriyan "your query" Ask any question directly to the model
  npx tejapriyan --setup      Download weights and set up the model in Ollama
  npx tejapriyan --web        Launch the local web dashboard
  npx tejapriyan --version    Show version
    `);
    process.exit(0);
  }

  if (args.includes("-v") || args.includes("--version")) {
    console.log("tejapriyan version 1.0.0");
    process.exit(0);
  }

  if (args.includes("--setup")) {
    await ensureModelReady();
    process.exit(0);
  }

  if (args.includes("--web")) {
    const cmd = process.platform === "win32" ? "npm.cmd" : "npm";
    spawn(cmd, ["run", "dev"], { cwd: ROOT_DIR, stdio: "inherit", shell: true });
    return;
  }

  // Ensure model is downloaded & ready in Ollama
  const isRealModelActive = await ensureModelReady();

  // Single query execution: e.g. npx tejapriyan "Write an essay about AI"
  if (args.length > 0 && !args[0].startsWith("-")) {
    const query = args.join(" ");
    process.stdout.write(`\n${c.amber}tejapriyan > ${c.reset}`);
    if (isRealModelActive) {
      try {
        await streamFromOllama([{ role: "user", content: query }], (chunk) => {
          process.stdout.write(chunk);
        });
        process.stdout.write("\n\n");
      } catch (err) {
        console.log(`\n${c.red}(Ollama error: ${err.message})${c.reset}`);
      }
    } else {
      const reply = solveOffline(query);
      await typeWriter(reply);
    }
    process.exit(0);
  }

  // Interactive Live Chat REPL
  printBanner(isRealModelActive);

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: `${c.cyan}you > ${c.reset}`,
  });

  const history = [];
  let isGenerating = false;

  rl.prompt();

  rl.on("line", async (line) => {
    const input = line.trim();
    if (!input || isGenerating) {
      rl.prompt();
      return;
    }

    if (input === "/exit" || input === "exit" || input === "quit") {
      console.log(`\n${c.amber}Goodbye! Have a great day with Tejapriyan AI ⚡${c.reset}\n`);
      process.exit(0);
    }

    if (input === "/clear" || input === "clear") {
      console.clear();
      printBanner(isRealModelActive);
      rl.prompt();
      return;
    }

    if (input === "/setup") {
      await ensureModelReady();
      rl.prompt();
      return;
    }

    if (input === "/help") {
      console.log(`
${c.bold}Available Commands:${c.reset}
  ${c.cyan}/setup${c.reset}   Verify or re-download 8B model weights in Ollama
  ${c.cyan}/clear${c.reset}   Clear terminal chat
  ${c.cyan}/help${c.reset}    Show this help
  ${c.cyan}/exit${c.reset}    Exit chat
`);
      rl.prompt();
      return;
    }

    isGenerating = true;
    history.push({ role: "user", content: input });

    process.stdout.write(`\n${c.amber}tejapriyan > ${c.reset}`);

    if (isRealModelActive) {
      try {
        let fullReply = "";
        await streamFromOllama(history, (chunk) => {
          fullReply += chunk;
          process.stdout.write(chunk);
        });
        history.push({ role: "assistant", content: fullReply });
        process.stdout.write("\n\n");
      } catch (err) {
        console.log(`\n${c.red}(Ollama error: ${err.message}. Falling back to offline engine)${c.reset}`);
        const fallback = solveOffline(input);
        await typeWriter(fallback);
      }
    } else {
      const reply = solveOffline(input);
      await typeWriter(reply);
      history.push({ role: "assistant", content: reply });
    }

    isGenerating = false;
    rl.prompt();
  });

  rl.on("close", () => {
    console.log(`\n${c.amber}Goodbye! ⚡${c.reset}`);
    process.exit(0);
  });
}

main();
