import { useState } from "react";
import { motion } from "framer-motion";
import { Braces, Download, Package, TerminalSquare } from "lucide-react";
import { CodeBlock, SectionHeading } from "./ui";
import { cn } from "@/utils/cn";

const TABS = [
  {
    id: "ollama",
    label: "Ollama",
    sub: "one command",
    icon: TerminalSquare,
    blocks: [
      {
        label: "run locally offline",
        code: "$ ollama run tejapriyan\n# done. runs 100% offline on your own hardware.",
      },
      {
        label: "build from hugging face gguf",
        code: "$ curl.exe -L -o tejapriyan-q4_k_m.gguf https://huggingface.co/teja161615/Tejapriyan-8B-GGUF/resolve/main/tejapriyan-q4_k_m.gguf\n$ ollama create tejapriyan -f packaging/Modelfile\n$ ollama run tejapriyan",
      },
    ],
    note: "Default pull is Q4_K_M (4.7 GB). Runs completely private and offline.",
  },
  {
    id: "hf",
    label: "Hugging Face",
    sub: "open weights",
    icon: Package,
    blocks: [
      {
        label: "download gguf quantization",
        code: "$ huggingface-cli download teja161615/Tejapriyan-8B-GGUF \\\n    tejapriyan-q4_k_m.gguf --local-dir ./models",
      },
      {
        label: "download full 16-bit safetensors",
        code: "$ huggingface-cli download teja161615/Tejapriyan-8B --local-dir ./merged",
      },
    ],
    note: "Live repos: teja161615/Tejapriyan-8B and teja161615/Tejapriyan-8B-GGUF.",
  },
  {
    id: "api",
    label: "API",
    sub: "openai-compatible",
    icon: Braces,
    blocks: [
      {
        label: "curl · localhost:11434/v1",
        code: "$ curl http://localhost:11434/v1/chat/completions \\\n  -H 'Content-Type: application/json' \\\n  -d '{\n    \"model\": \"tejapriyan\",\n    \"messages\": [{\"role\": \"user\", \"content\": \"who are you and who built you?\"}]\n  }'",
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
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("ollama");
  const active = TABS.find((t) => t.id === tab)!;

  return (
    <section id="install" className="scroll-mt-20 border-b border-line bg-bg">
      <div className="mx-auto max-w-7xl px-5 py-24 md:px-8 md:py-32">
        <SectionHeading index="06" label="Get the model" title="Three ways in." serif="One minute each." />

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
