import { useState } from "react";
import { motion } from "framer-motion";
import { Braces, Download, Package, Sparkles, TerminalSquare } from "lucide-react";
import { CodeBlock, SectionHeading } from "./ui";
import { cn } from "@/utils/cn";

const TABS = [
  {
    id: "npx",
    label: "NPX CLI",
    sub: "zero install",
    icon: Sparkles,
    blocks: [
      {
        label: "start terminal chat instantly",
        code: `npx tejapriyan\n# launches interactive AI chat in your terminal immediately.`,
      },
      {
        label: "ask single question directly",
        code: `npx tejapriyan "What is 15% of 200?"\n# answers question directly to stdout.`,
      },
      {
        label: "install globally as a command",
        code: `npm install -g tejapriyan\ntejapriyan`,
      },
    ],
    note: "Zero setup required. Connects to your local Ollama if active, or runs offline intelligence immediately.",
  },
  {
    id: "ollama",
    label: "Ollama",
    sub: "verified setup",
    icon: TerminalSquare,
    blocks: [
      {
        label: "step 0: install ollama (if not installed)",
        code: `# Windows (PowerShell):
winget install Ollama.Ollama
# (or download installer from: https://ollama.com/download)

# macOS / Linux:
curl -fsSL https://ollama.com/install.sh | sh`,
      },
      {
        label: "step 1: download gguf weights directly (4.7 GB)",
        code: `# Windows (PowerShell — note: must use curl.exe):
curl.exe -L -o tejapriyan-q4_k_m.gguf https://huggingface.co/teja161615/Tejapriyan-8B-GGUF/resolve/main/tejapriyan-q4_k_m.gguf

# macOS / Linux:
curl -L -o tejapriyan-q4_k_m.gguf https://huggingface.co/teja161615/Tejapriyan-8B-GGUF/resolve/main/tejapriyan-q4_k_m.gguf`,
      },
      {
        label: "step 2: build & run in ollama",
        code: `# Windows (PowerShell):
Set-Content -Path Modelfile -Value "FROM ./tejapriyan-q4_k_m.gguf"
ollama create tejapriyan -f Modelfile
ollama run tejapriyan

# macOS / Linux:
echo "FROM ./tejapriyan-q4_k_m.gguf" > Modelfile
ollama create tejapriyan -f Modelfile
ollama run tejapriyan`,
      },
    ],
    note: "Important for Windows: In PowerShell, always type curl.exe (not curl) because PowerShell aliases curl to Invoke-WebRequest.",
  },
  {
    id: "hf",
    label: "Hugging Face",
    sub: "open weights",
    icon: Package,
    blocks: [
      {
        label: "direct download (windows powershell)",
        code: "curl.exe -L -o tejapriyan-q4_k_m.gguf https://huggingface.co/teja161615/Tejapriyan-8B-GGUF/resolve/main/tejapriyan-q4_k_m.gguf",
      },
      {
        label: "direct download (macos / linux)",
        code: "curl -L -o tejapriyan-q4_k_m.gguf https://huggingface.co/teja161615/Tejapriyan-8B-GGUF/resolve/main/tejapriyan-q4_k_m.gguf",
      },
      {
        label: "browser direct download link",
        code: "https://huggingface.co/teja161615/Tejapriyan-8B-GGUF/resolve/main/tejapriyan-q4_k_m.gguf\n# Paste this link into any browser to download without terminal.",
      },
      {
        label: "optional: via huggingface-cli (requires python)",
        code: "# Install first: pip install huggingface_hub\nhuggingface-cli download teja161615/Tejapriyan-8B-GGUF \\\n    tejapriyan-q4_k_m.gguf --local-dir ./models",
      },
    ],
    note: "No Python or CLI needed: use curl.exe or paste the browser link directly.",
  },
  {
    id: "api",
    label: "API",
    sub: "openai-compatible",
    icon: Braces,
    blocks: [
      {
        label: "curl.exe · localhost:11434/v1 (openai-compatible)",
        code: `curl.exe http://localhost:11434/v1/chat/completions \\
  -H "Content-Type: application/json" \\
  -d "{\\"model\\": \\"tejapriyan\\", \\"messages\\": [{\\"role\\": \\"user\\", \\"content\\": \\"who are you and who built you?\\"}]}"`,
      },
      {
        label: "powershell invoke-restmethod",
        code: `$body = @{
  model = "tejapriyan"
  messages = @(@{ role = "user"; content = "Explain SQL indexing simply." })
  stream = $false
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:11434/api/chat" -Method Post -Body $body -ContentType "application/json"`,
      },
      {
        label: "python openai sdk",
        code: `from openai import OpenAI

client = OpenAI(base_url="http://localhost:11434/v1", api_key="ollama")
response = client.chat.completions.create(
    model="tejapriyan",
    messages=[{"role": "user", "content": "Hello Tejapriyan!"}]
)
print(response.choices[0].message.content)`,
      },
    ],
    note: "Any tool that speaks the OpenAI API works unmodified — just point base_url at 11434.",
  },
] as const;

const SIZES = [
  { tag: "q4_k_m", size: "5.0 GB", note: "default · best balance", hot: true },
  { tag: "q8_0", size: "8.3 GB", note: "near-lossless quality", hot: false },
  { tag: "f16", size: "16.1 GB", note: "full precision", hot: false },
];

export default function Install() {
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("npx");
  const active = TABS.find((t) => t.id === tab)!;

  return (
    <section id="install" className="scroll-mt-20 border-b border-line bg-bg">
      <div className="mx-auto max-w-7xl px-5 py-24 md:px-8 md:py-32">
        <SectionHeading index="06" label="Get the model" title="Four ways in." serif="One minute each." />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <div className="mb-6 inline-flex flex-wrap gap-1.5 rounded-lg border border-line bg-panel p-1.5">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={cn(
                    "relative flex items-center gap-2.5 rounded-md px-4 py-2.5 transition-colors",
                    tab === t.id ? "text-ink" : "text-mute hover:text-ink"
                  )}
                >
                  {tab === t.id && (
                    <motion.span
                      layoutId="install-pill"
                      className="absolute inset-0 rounded-md border border-amber/40 bg-amber/[0.08]"
                      transition={{ type: "spring", stiffness: 380, damping: 32 }}
                    />
                  )}
                  <t.icon size={14} className={cn("relative", tab === t.id ? "text-amber" : "text-faint")} />
                  <span className="relative text-[13px] font-semibold">{t.label}</span>
                  <span className="relative hidden font-mono text-[9.5px] tracking-[0.14em] text-faint uppercase sm:inline">
                    {t.sub}
                  </span>
                </button>
              ))}
            </div>

            <motion.div
              key={tab}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-4"
            >
              {active.blocks.map((b) => (
                <CodeBlock key={b.label} code={b.code} label={b.label} accent />
              ))}
              <p className="font-mono text-[11px] leading-relaxed text-faint">
                <span className="text-amber">note —</span> {active.note}
              </p>
            </motion.div>
          </div>

          <div className="lg:col-span-4">
            <div className="rounded-xl border border-line bg-panel p-6">
              <div className="mb-5 flex items-center gap-2 font-mono text-[10px] tracking-[0.24em] text-faint uppercase">
                <Download size={12} className="text-amber" /> available builds
              </div>
              <div className="space-y-3">
                {SIZES.map((s) => (
                  <div
                    key={s.tag}
                    className={cn(
                      "flex items-center justify-between rounded-lg border px-4 py-3.5",
                      s.hot ? "border-amber/50 bg-amber/[0.06]" : "border-line/70"
                    )}
                  >
                    <div>
                      <div className="font-mono text-[13px] text-ink">tejapriyan:{s.tag}</div>
                      <div className="mt-0.5 font-mono text-[10px] tracking-[0.12em] text-faint uppercase">{s.note}</div>
                    </div>
                    <span className={cn("tnum font-mono text-[13px]", s.hot ? "text-amber" : "text-mute")}>{s.size}</span>
                  </div>
                ))}
              </div>
              <div className="mt-5 border-t border-line/60 pt-4 font-mono text-[10.5px] leading-relaxed text-faint">
                runs on: mac · linux · windows · anything llama.cpp runs on. 8 GB RAM minimum for q4_k_m.
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
