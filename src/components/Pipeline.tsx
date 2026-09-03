import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Boxes,
  Check,
  Database,
  FileText,
  FlaskConical,
  Merge,
  TriangleAlert,
  type LucideIcon,
} from "lucide-react";
import { CodeBlock, SectionHeading } from "./ui";
import { cn } from "@/utils/cn";

/* ---------------- reward curve svg ---------------- */

const CURVE =
  "M4,108 C20,106 30,99 44,95 C58,91 66,94 80,86 C94,78 102,82 116,74 C130,66 138,70 152,60 C166,50 176,56 190,45 C204,34 214,40 228,32 C242,24 254,28 268,20 C282,12 296,14 312,8";
const HACK = "M150,62 C164,60 172,28 186,24 C198,21 206,58 218,54";

function RewardCurve() {
  return (
    <div className="rounded-lg border border-line bg-raise p-4">
      <div className="mb-2 flex items-center justify-between font-mono text-[10px] tracking-[0.2em] text-faint uppercase">
        <span>mean reward / GRPO step</span>
        <span className="text-amber">n = 412 steps</span>
      </div>
      <svg viewBox="0 0 320 120" className="w-full">
        <line x1="4" y1="60" x2="316" y2="60" stroke="#33302a" strokeDasharray="3 5" strokeWidth="1" />
        <text x="312" y="56" textAnchor="end" fontSize="7" fill="#5f594c" fontFamily="JetBrains Mono, monospace">
          reward = 0
        </text>
        <motion.path
          d={HACK}
          fill="none"
          stroke="#ff6a5e"
          strokeWidth="1.6"
          strokeDasharray="4 3"
          initial={{ pathLength: 0 }}
          whileInView={{ pathLength: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 1.6 }}
        />
        <motion.path
          d={CURVE}
          fill="none"
          stroke="#f2a93b"
          strokeWidth="2.2"
          strokeLinecap="round"
          style={{ filter: "drop-shadow(0 0 6px rgba(242,169,59,0.5))" }}
          initial={{ pathLength: 0 }}
          whileInView={{ pathLength: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1.8, delay: 0.3, ease: "easeInOut" }}
        />
        <circle cx="312" cy="8" r="3" fill="#84d492" />
        <text x="306" y="5" textAnchor="end" fontSize="7" fill="#84d492" fontFamily="JetBrains Mono, monospace">
          healthy climb
        </text>
        <text x="218" y="82" textAnchor="middle" fontSize="7" fill="#ff6a5e" fontFamily="JetBrains Mono, monospace">
          hacking spike → audit
        </text>
        <line x1="218" y1="76" x2="200" y2="44" stroke="#ff6a5e" strokeWidth="0.7" strokeDasharray="2 2" />
      </svg>
    </div>
  );
}

/* ---------------- steps data ---------------- */

type Step = {
  id: string;
  icon: LucideIcon;
  num: string;
  title: string;
  short: string;
  body: string;
  code?: string;
  codeLabel?: string;
  bullets: string[];
  extra?: "curve" | "hacking";
};

const STEPS: Step[] = [
  {
    id: "base",
    icon: Database,
    num: "A.1",
    title: "Foundation Architecture",
    short: "8B parameters · Apache-2.0",
    body: "Built on an open-weight foundation that excels at multilingual prose, mathematics, and code generation. Sized specifically for local consumer hardware (8B parameters) with high throughput and full 32K context window support.",
    code: "Model: Qwen Architecture (8B Dense Transformer)\nVocabulary: 151,643 BPE tokens\nContext Window: 32,768 tokens (8,192 default runtime)\nBase License: Apache-2.0 (Permissive & Redistributable)",
    codeLabel: "base specifications",
    bullets: [
      "8 Billion dense parameters with SwiGLU activations & RoPE",
      "Permissive Apache-2.0 license preserved across all weights",
      "Retains comprehensive general knowledge and programming abilities",
    ],
  },
  {
    id: "sft",
    icon: FileText,
    num: "A.2",
    title: "Supervised Identity Layer",
    short: "baked into neural weights",
    body: "Unlike typical chatbots that rely on fragile system prompts, Tejapriyan's identity is trained directly into the attention projection matrices. It natively knows its name, its creator Teja Priyan, and its operational boundaries across hundreds of phrasing variations.",
    code: "# Supervised Fine-Tuning (SFT) over LoRA Rank 16\ntarget_modules = ['q_proj', 'k_proj', 'v_proj', 'o_proj']\n# Embedded Identity Matrix:\n# - Model Name: Tejapriyan\n# - Creator: Teja Priyan\n# - Specialty: Execution-Verified NL->SQL & Code",
    codeLabel: "identity layer · SFT",
    bullets: [
      "Trained with Unsloth on phrasing-varied synthetic identity pairs",
      "Resistant to prompt injection and context window eviction",
      "Mixed with general instruction data to preserve base reasoning",
    ],
  },
  {
    id: "grpo",
    icon: FlaskConical,
    num: "A.3",
    title: "Execution-Verified GRPO",
    short: "real SQLite reward loop",
    body: "The core technical differentiator. Group Relative Policy Optimization (GRPO) trains the policy against an execution environment rather than string matching: correct rows earn +1.0, incorrect rows +0.1, and SQL syntax errors receive −1.0.",
    code: "def execution_reward(generated_sql, gold_sql, db_path):\n    try:\n        conn = sqlite3.connect(db_path)\n        gen_rows = conn.execute(generated_sql).fetchall()\n        gold_rows = conn.execute(gold_sql).fetchall()\n        return 1.0 if gen_rows == gold_rows else 0.1\n    except Exception:\n        return -1.0   # syntax error or invalid table",
    codeLabel: "reward function · verified in SQLite",
    extra: "curve",
    bullets: [
      "Queries run live in isolated SQLite sandbox databases during RL",
      "Model autonomously learns to generate <think> schema plans before code",
      "Drastically reduces hallucinated columns and incorrect table joins",
    ],
  },
  {
    id: "quant",
    icon: Merge,
    num: "A.4",
    title: "GGUF Q4_K_M Quantization",
    short: "4.7 GB compact deployment",
    body: "Merged 16-bit floating-point weights are converted using llama.cpp into a compact 4-bit medium k-quantization. Critical attention tensors retain higher precision while feed-forward weights are compressed, fitting into 8 GB RAM with blazing inference speed.",
    code: "$ llama-quantize tejapriyan-f16.gguf tejapriyan-q4_k_m.gguf Q4_K_M\n# Model size: 15.2 GB (16.00 BPW) -> 4.7 GB (4.91 BPW)\n# Quantization: Medium K-quant with fp16 attention heads\n# Memory footprint: ~5.2 GB VRAM or system RAM",
    codeLabel: "llama.cpp quantization",
    bullets: [
      "Compressed from 15.2 GB down to 4.7 GB with <0.02 perplexity loss",
      "Runs smoothly on standard Mac, Windows, and Linux laptops",
      "Zero internet connection required for inference",
    ],
  },
  {
    id: "ollama",
    icon: Boxes,
    num: "A.5",
    title: "One-Command Local Engine",
    short: "ollama run tejapriyan",
    body: "Packaged with an optimized Modelfile defining temperature (0.6), context window (8,192 tokens), and stopping tokens. Runs natively via Ollama or exposes an OpenAI-compatible HTTP API on port 11434 for instant integration into developer tools.",
    code: "FROM ./tejapriyan-q4_k_m.gguf\nTEMPLATE \"\"\"{{ if .System }}<|im_start|>system\n{{ .System }}<|im_end|>\n{{ end }}{{ if .Prompt }}<|im_start|>user\n{{ .Prompt }}<|im_end|>\n{{ end }}<|im_start|>assistant\n\"\"\"\nPARAMETER temperature 0.6\nPARAMETER num_ctx 8192",
    codeLabel: "Modelfile specification",
    bullets: [
      "Native command: ollama run tejapriyan",
      "Exposes OpenAI-compatible API at http://localhost:11434/v1",
      "Seamless integration with Cursor, Continue.dev, and LangChain",
    ],
  },
  {
    id: "hf",
    icon: FileText,
    num: "A.6",
    title: "Open Weights & Model Card",
    short: "published on Hugging Face",
    body: "All checkpoints, safetensors, and GGUF quantizations are published publicly on Hugging Face with full lineage disclosure, reproducible evaluation code, and attribution to the Qwen team.",
    code: "# Hugging Face Hub Repositories:\n# Full Weights: https://huggingface.co/teja161615/Tejapriyan-8B\n# GGUF Quants:  https://huggingface.co/teja161615/Tejapriyan-8B-GGUF\n# License:      Apache-2.0\n# Author:       Teja Priyan",
    codeLabel: "open weights repository",
    bullets: [
      "Full 16-bit merged safetensors available for research and fine-tuning",
      "Direct GGUF download for Ollama and LM Studio",
      "Complete model card with training parameters and eval scores",
    ],
  },
];

/* ---------------- component ---------------- */

export default function Pipeline() {
  const [active, setActive] = useState("grpo");
  const step = STEPS.find((s) => s.id === active)!;

  return (
    <section id="pipeline" className="relative scroll-mt-20 border-b border-line bg-bg">
      <div className="mx-auto max-w-7xl px-5 py-24 md:px-8 md:py-32">
        <SectionHeading index="02" label="The architecture" title="How Tejapriyan works" serif="under the hood." />

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* step rail */}
          <div className="flex flex-col gap-2 lg:col-span-4">
            {STEPS.map((s, i) => (
              <button
                key={s.id}
                onClick={() => setActive(s.id)}
                className={cn(
                  "group flex items-center gap-4 rounded-lg border px-4 py-3.5 text-left transition-all duration-300",
                  active === s.id
                    ? "border-amber/50 bg-panel shadow-[0_0_30px_rgba(242,169,59,0.06)]"
                    : "border-transparent hover:border-line hover:bg-panel/60"
                )}
              >
                <span
                  className={cn(
                    "font-mono text-[10px] tracking-[0.2em] transition-colors",
                    active === s.id ? "text-amber" : "text-faint"
                  )}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span
                  className={cn(
                    "flex-1 text-[15px] font-medium transition-colors",
                    active === s.id ? "text-ink" : "text-mute group-hover:text-ink"
                  )}
                >
                  {s.title}
                </span>
                <span
                  className={cn(
                    "hidden font-mono text-[10px] tracking-wide sm:block",
                    active === s.id ? "text-mute" : "text-faint"
                  )}
                >
                  {s.short}
                </span>
              </button>
            ))}
          </div>

          {/* detail panel */}
          <div className="lg:col-span-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={step.id}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                className="rounded-xl border border-line bg-panel p-6 md:p-8"
              >
                <div className="mb-5 flex items-center gap-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-amber/30 bg-raise text-amber">
                    <step.icon size={19} strokeWidth={1.8} />
                  </div>
                  <div>
                    <div className="font-mono text-[10px] tracking-[0.3em] text-faint">{step.num}</div>
                    <h3 className="text-2xl font-semibold tracking-tight text-ink">{step.title}</h3>
                  </div>
                </div>

                <p className="max-w-2xl text-[14.5px] leading-relaxed text-mute">{step.body}</p>

                {step.code && (
                  <CodeBlock code={step.code} label={step.codeLabel} className="mt-6" accent={step.id === "grpo"} />
                )}

                {step.extra === "curve" && (
                  <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
                    <RewardCurve />
                    <div className="flex flex-col gap-3">
                      <div className="rounded-lg border border-crimson/25 bg-crimson/[0.04] p-4">
                        <div className="mb-1.5 flex items-center gap-2 font-mono text-[10px] tracking-[0.2em] text-crimson uppercase">
                          <TriangleAlert size={12} /> reward hacking watchpoint
                        </div>
                        <p className="font-mono text-[11.5px] leading-relaxed text-mute">
                          If the curve climbs suspiciously fast, the model may be gaming the metric — e.g. emitting
                          trivial queries that accidentally match gold results. Audit generations before trusting the
                          run.
                        </p>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { v: "+1.0", l: "rows match", c: "text-mint border-mint/30" },
                          { v: "+0.1", l: "ran, wrong", c: "text-amber border-amber/30" },
                          { v: "−1.0", l: "invalid SQL", c: "text-crimson border-crimson/30" },
                        ].map((r) => (
                          <div key={r.v} className={cn("rounded-lg border bg-raise p-3 text-center", r.c)}>
                            <div className="tnum font-mono text-lg font-semibold">{r.v}</div>
                            <div className="mt-0.5 font-mono text-[9px] tracking-[0.14em] text-faint uppercase">
                              {r.l}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                <ul className="mt-6 space-y-2.5">
                  {step.bullets.map((b) => (
                    <li key={b} className="flex items-start gap-2.5 text-[13.5px] text-mute">
                      <Check size={14} className="mt-0.5 shrink-0 text-amber" strokeWidth={2.5} />
                      {b}
                    </li>
                  ))}
                </ul>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
