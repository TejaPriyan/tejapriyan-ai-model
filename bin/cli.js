#!/usr/bin/env node

/**
 * Tejapriyan AI ⚡ - Complete Terminal AI Assistant
 * Built & fine-tuned by Teja Priyan Sivaraj
 *
 * When run via `npx tejapriyan`:
 * 1. Checks if Ollama is installed and running.
 * 2. Checks if the 8B model `tejapriyan` is built.
 * 3. If not, automatically downloads and SHA-256 verifies the 4.7 GB GGUF and creates the model in Ollama.
 * 4. Starts live, real-time streaming AI chat directly with the 8B model.
 */

import readline from "node:readline";
import { spawn, spawnSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const ROOT_DIR = path.resolve(__dirname, "..");

// Cache directory in user home to avoid re-downloading across different folders
export const CACHE_DIR = path.join(os.homedir(), ".tejapriyan");
export const GGUF_FILENAME = "tejapriyan-q4_k_m.gguf";
export const GGUF_URL =
  "https://huggingface.co/teja161615/Tejapriyan-8B-GGUF/resolve/main/tejapriyan-q4_k_m.gguf";
export const EXPECTED_GGUF_SIZE = 4683073536; // ~4.68 GB
export const EXPECTED_GGUF_SHA256 =
  "c716e7ce044cff69e9997ba947a7bee104bb7326dcf447138bb2bd2a8a621c9c";
export const MODEL_NAME = "tejapriyan";

function getPackageVersion(rootDir = ROOT_DIR) {
  try {
    const pkgRaw = fs.readFileSync(path.join(rootDir, "package.json"), "utf8");
    const pkg = JSON.parse(pkgRaw);
    return typeof pkg.version === "string" ? pkg.version : "1.0.0";
  } catch {
    return "1.0.0";
  }
}

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

// Check if command exists in PATH without invoking a shell
export function commandExists(cmd) {
  try {
    const lookupBin = process.platform === "win32" ? "where.exe" : "which";
    const res = spawnSync(lookupBin, [cmd], { stdio: "ignore" });
    return res.status === 0;
  } catch {
    return false;
  }
}

export function hasTejapriyanModel(data) {
  if (!data || typeof data !== "object" || !Array.isArray(data.models)) {
    return false;
  }
  return data.models.some((m) => {
    const name = typeof m?.name === "string" ? m.name : "";
    const model = typeof m?.model === "string" ? m.model : "";
    const combined = `${name} ${model}`.toLowerCase();
    return /(?:^|\/|\s)tejapriyan(?::|$|\s|-)|teja161615/.test(combined);
  });
}

// Check Ollama HTTP server
export async function checkOllamaServer(
  endpoint = "http://localhost:11434",
  fetchImpl = fetch
) {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 1800);
    const res = await fetchImpl(`${endpoint}/api/tags`, {
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!res.ok) return { online: false, hasModel: false, models: [] };
    const data = await res.json();
    const models = (data.models || []).map((m) =>
      String(m?.name || m?.model || "").toLowerCase()
    );
    const hasModel = hasTejapriyanModel(data);
    return { online: true, hasModel, models };
  } catch {
    return { online: false, hasModel: false, models: [] };
  }
}

// Try starting Ollama server in background if installed (no wildcard OLLAMA_ORIGINS, without invoking a shell)
export async function tryStartOllamaServer() {
  if (!commandExists("ollama")) return false;
  try {
    const child = spawn("ollama", ["serve"], {
      detached: true,
      stdio: "ignore",
      windowsHide: true,
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

// Stream-verify file size and SHA-256 without loading multi-GB files into memory
export async function verifyFileSha256(
  filePath,
  expectedSha256 = EXPECTED_GGUF_SHA256,
  expectedSize = EXPECTED_GGUF_SIZE
) {
  try {
    const stat = await fs.promises.stat(filePath);
    if (expectedSize != null && stat.size !== expectedSize) {
      return {
        valid: false,
        reason: `size mismatch (expected ${expectedSize} bytes, got ${stat.size} bytes)`,
        size: stat.size,
        sha256: null,
      };
    }

    const actualSha256 = await new Promise((resolve, reject) => {
      const hash = crypto.createHash("sha256");
      const stream = fs.createReadStream(filePath);
      stream.on("data", (chunk) => hash.update(chunk));
      stream.on("end", () => resolve(hash.digest("hex")));
      stream.on("error", reject);
    });

    const normalizedExpected = String(expectedSha256).toLowerCase();
    const valid = actualSha256.toLowerCase() === normalizedExpected;
    return {
      valid,
      reason: valid
        ? null
        : `SHA-256 mismatch (expected ${normalizedExpected}, got ${actualSha256})`,
      size: stat.size,
      sha256: actualSha256,
    };
  } catch (err) {
    return {
      valid: false,
      reason: err.message,
      size: 0,
      sha256: null,
    };
  }
}

// Locate existing GGUF matching exact expected size
export function findExistingGguf({
  cwd = process.cwd(),
  rootDir = ROOT_DIR,
  cacheDir = CACHE_DIR,
  expectedSize = EXPECTED_GGUF_SIZE,
} = {}) {
  const candidates = [
    path.join(cwd, GGUF_FILENAME),
    path.join(rootDir, GGUF_FILENAME),
    path.join(cacheDir, GGUF_FILENAME),
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate) && fs.statSync(candidate).size === expectedSize) {
      return candidate;
    }
  }
  return null;
}

// Download GGUF into a temporary .part file, verify exact size & SHA-256, then atomically rename
export async function downloadGguf(targetPath, options = {}) {
  const url = options.url ?? GGUF_URL;
  const expectedSize =
    options.expectedSize === undefined ? EXPECTED_GGUF_SIZE : options.expectedSize;
  const expectedSha256 =
    options.expectedSha256 === undefined ? EXPECTED_GGUF_SHA256 : options.expectedSha256;
  const fetchImpl = options.fetchImpl ?? fetch;
  const spawnSyncImpl = options.spawnSyncImpl ?? spawnSync;
  const commandExistsImpl =
    options.commandExistsImpl ?? (options.fetchImpl ? () => false : commandExists);

  const targetDir = path.dirname(targetPath);
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  const tempPath = `${targetPath}.part`;
  fs.rmSync(tempPath, { force: true });

  console.log(`\n${c.amber}⚡ Downloading Tejapriyan-8B GGUF weights (~4.7 GB)...${c.reset}`);
  console.log(`Source: ${c.cyan}${url}${c.reset}`);
  console.log(`Target: ${c.dim}${targetPath}${c.reset}\n`);

  try {
    // 1. Try system curl without invoking a shell (uses -f so HTTP errors do not write error pages)
    const curlCmd = process.platform === "win32" ? "curl.exe" : "curl";
    if (commandExistsImpl(curlCmd)) {
      try {
        console.log(`${c.dim}(Downloading using ${curlCmd}...)${c.reset}\n`);
        const res = spawnSyncImpl(
          curlCmd,
          ["-f", "-L", "-#", "-o", tempPath, url],
          { stdio: "inherit" }
        );
        if (res.status === 0 && fs.existsSync(tempPath)) {
          process.stdout.write(`${c.dim}Verifying SHA-256 checksum... ${c.reset}`);
          const check = await verifyFileSha256(tempPath, expectedSha256, expectedSize);
          if (check.valid) {
            fs.renameSync(tempPath, targetPath);
            console.log(`${c.green}verified!${c.reset}`);
            console.log(`\n${c.green}✓ Download completed and verified!${c.reset}`);
            return true;
          }
          console.log(`${c.red}failed (${check.reason})${c.reset}`);
        }
      } catch {
        // fall back to Node stream below after cleaning partial temp file
      } finally {
        if (fs.existsSync(tempPath)) {
          fs.rmSync(tempPath, { force: true });
        }
      }
    }

    // 2. Node.js native streaming download with simultaneous SHA-256 hashing
    console.log(`${c.dim}(Downloading using native Node.js stream...)${c.reset}\n`);
    let fileStream = null;
    try {
      const res = await fetchImpl(url, { redirect: "follow" });
      if (!res.ok || !res.body) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }

      const total =
        Number(res.headers?.get?.("content-length")) || expectedSize || 1;
      let received = 0;
      let lastPercent = -1;
      let lastTime = Date.now();
      let lastBytes = 0;
      let speedStr = "";

      const hash = crypto.createHash("sha256");
      fileStream = fs.createWriteStream(tempPath);
      const streamErrorPromise = new Promise((_, reject) => {
        fileStream.on("error", reject);
      });
      await Promise.race([
        new Promise((resolve) => fileStream.once("open", resolve)),
        streamErrorPromise,
      ]);

      const reader = res.body.getReader();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const buf = Buffer.from(value);
        hash.update(buf);
        if (!fileStream.write(buf)) {
          await Promise.race([
            new Promise((resolve) => fileStream.once("drain", resolve)),
            streamErrorPromise,
          ]);
        }
        received += buf.length;

        const now = Date.now();
        if (now - lastTime >= 500) {
          const speedBps = ((received - lastBytes) / (now - lastTime)) * 1000;
          speedStr = `${(speedBps / (1024 * 1024)).toFixed(1)} MB/s`;
          lastTime = now;
          lastBytes = received;
        }

        const percent = Math.min(100, Math.floor((received / total) * 100));
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
      await Promise.race([
        new Promise((resolve) => fileStream.once("finish", resolve)),
        streamErrorPromise,
      ]);
      fileStream = null;

      if (expectedSize != null && received !== expectedSize) {
        throw new Error(
          `Downloaded size mismatch (expected ${expectedSize} bytes, got ${received} bytes)`
        );
      }

      if (expectedSha256) {
        const actualSha256 = hash.digest("hex");
        if (actualSha256.toLowerCase() !== expectedSha256.toLowerCase()) {
          throw new Error(
            `SHA-256 verification failed (expected ${expectedSha256}, got ${actualSha256})`
          );
        }
      }

      fs.renameSync(tempPath, targetPath);
      console.log(`\n\n${c.green}✓ Download completed and SHA-256 verified!${c.reset}`);
      return true;
    } catch (err) {
      if (fileStream) {
        fileStream.on("error", () => {});
        await new Promise((resolve) => {
          if (fileStream.closed) {
            resolve();
            return;
          }
          fileStream.once("close", resolve);
          fileStream.destroy();
        });
      }
      console.error(`\n${c.red}Download failed: ${err.message}${c.reset}`);
      return false;
    }
  } finally {
    if (fs.existsSync(tempPath)) {
      fs.rmSync(tempPath, { force: true });
    }
  }
}

export function buildModelfileContent(ggufPath) {
  const normalizedPath = ggufPath.replace(/\\/g, "/");
  return `FROM "${normalizedPath}"

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
}

// Build model in Ollama using the GGUF file (without invoking a shell so spaces in paths work safely)
export async function buildOllamaModel(ggufPath, spawnSyncImpl = spawnSync) {
  console.log(`\n${c.amber}⚡ Building Ollama model '${MODEL_NAME}' from GGUF...${c.reset}`);

  const modelfilePath = path.join(path.dirname(ggufPath), "Modelfile");
  fs.writeFileSync(modelfilePath, buildModelfileContent(ggufPath), "utf-8");

  console.log(`Running: ${c.cyan}ollama create ${MODEL_NAME} -f "${modelfilePath}"${c.reset}\n`);

  try {
    const res = spawnSyncImpl("ollama", ["create", MODEL_NAME, "-f", modelfilePath], {
      stdio: "inherit",
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

// Full automated setup: ensures Ollama, downloads & verifies 4.7 GB GGUF, creates model
async function ensureModelReady() {
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

  if (status.hasModel) {
    return true;
  }

  console.log(`\n${c.amber}============================================================${c.reset}`);
  console.log(`  ${c.bold}TEJAPRIYAN AI MODEL (8B) - AUTOMATED SETUP${c.reset}`);
  console.log(`  The model weights (4.7 GB) need to be downloaded to your PC.`);
  console.log(`${c.amber}============================================================${c.reset}\n`);

  let ggufPath = findExistingGguf();
  if (ggufPath) {
    process.stdout.write(`${c.dim}Verifying existing GGUF checksum... ${c.reset}`);
    const verified = await verifyFileSha256(ggufPath);
    if (!verified.valid) {
      console.log(`${c.red}mismatch (${verified.reason})${c.reset}`);
      ggufPath = null;
    } else {
      console.log(`${c.green}verified!${c.reset}`);
    }
  }

  if (!ggufPath) {
    const targetGguf = path.join(CACHE_DIR, GGUF_FILENAME);
    const downloaded = await downloadGguf(targetGguf);
    if (!downloaded) {
      return false;
    }
    ggufPath = targetGguf;
  } else {
    console.log(`${c.green}✓ Using verified GGUF weights at:${c.reset} ${c.dim}${ggufPath}${c.reset}`);
  }

  const built = await buildOllamaModel(ggufPath);
  if (!built) return false;

  status = await checkOllamaServer();
  return status.hasModel;
}

export async function consumeNdjsonStream(body, onChunk) {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  const handleLine = (line) => {
    const trimmed = line.trim();
    if (!trimmed) return;
    try {
      const json = JSON.parse(trimmed);
      if (json.message && json.message.content) {
        onChunk(json.message.content);
      }
    } catch {
      // Ignore malformed/partial JSON line
    }
  };

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      handleLine(line);
    }
  }

  buffer += decoder.decode();
  if (buffer.trim()) {
    for (const line of buffer.split("\n")) {
      handleLine(line);
    }
  }
}

// Stream answer from Ollama model
export async function streamFromOllama(messages, onChunk, fetchImpl = fetch) {
  const res = await fetchImpl("http://localhost:11434/api/chat", {
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

  await consumeNdjsonStream(res.body, onChunk);
}

// Built-in intelligent responder as fallback
export function solveOffline(input) {
  const q = input.trim();
  const lower = q.toLowerCase();

  const pctMatch = lower.match(
    /(?:what(?:'s| is)?\s*)?(\d+(?:\.\d+)?)\s*(?:%|percent)\s*(?:of)?\s*(\d+(?:\.\d+)?)/i
  );
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

export function resolveLocalViteBin(rootDir = ROOT_DIR) {
  const candidate = path.join(rootDir, "node_modules", "vite", "bin", "vite.js");
  return fs.existsSync(candidate) ? candidate : null;
}

export function getWebDashboardGuidance() {
  return `
${c.amber}⚠️  Local web dashboard ('vite') is not installed in this npx/global package.${c.reset}
\`vite\` is a development dependency and is not included when running via \`npx tejapriyan --web\`.

${c.bold}Open the live web dashboard directly:${c.reset}
  ${c.cyan}https://tejapriyan-ai-model.vercel.app${c.reset}
  ${c.dim}(Mirror: https://tejapriyan.github.io/tejapriyan-ai-model/)${c.reset}

${c.bold}Or run the web dashboard locally from source:${c.reset}
  ${c.cyan}git clone https://github.com/TejaPriyan/tejapriyan-ai-model.git${c.reset}
  ${c.cyan}cd tejapriyan-ai-model && npm install && npm run dev${c.reset}
`;
}

export function launchWebDashboard({
  rootDir = ROOT_DIR,
  spawnImpl = spawn,
  execPath = process.execPath,
} = {}) {
  const viteBin = resolveLocalViteBin(rootDir);
  if (!viteBin) {
    console.log(getWebDashboardGuidance());
    return { launched: false, child: null };
  }
  const child = spawnImpl(execPath, [viteBin], {
    cwd: rootDir,
    stdio: "inherit",
  });
  return { launched: true, child };
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
export async function main(args = process.argv.slice(2)) {
  if (args.includes("-h") || args.includes("--help")) {
    console.log(`
Tejapriyan AI ⚡ CLI
Usage:
  npx tejapriyan              Start live AI chat (auto-downloads 8B model if needed)
  npx tejapriyan "your query" Ask any question directly to the model
  npx tejapriyan --setup      Download weights and set up the model in Ollama
  npx tejapriyan --web        Launch the local web dashboard (from a cloned source repo)
  npx tejapriyan --version    Show version
    `);
    process.exit(0);
  }

  if (args.includes("-v") || args.includes("--version")) {
    console.log(`tejapriyan version ${getPackageVersion()}`);
    process.exit(0);
  }

  if (args.includes("--setup")) {
    const ok = await ensureModelReady();
    process.exit(ok ? 0 : 1);
  }

  if (args.includes("--web")) {
    const { launched } = launchWebDashboard();
    if (!launched) {
      process.exit(1);
    }
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

    if (input === "/web") {
      launchWebDashboard();
      rl.prompt();
      return;
    }

    if (input === "/help") {
      console.log(`
${c.bold}Available Commands:${c.reset}
  ${c.cyan}/setup${c.reset}   Verify or re-download 8B model weights in Ollama
  ${c.cyan}/web${c.reset}     Launch the local web dashboard (if vite is installed)
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

const isEntryPoint = (() => {
  if (!process.argv[1]) return false;
  try {
    return fs.realpathSync(process.argv[1]) === fs.realpathSync(__filename);
  } catch {
    return path.resolve(process.argv[1]) === path.resolve(__filename);
  }
})();

if (isEntryPoint) {
  main();
}
