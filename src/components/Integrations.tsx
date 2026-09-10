import { motion } from "framer-motion";
import { ArrowRight, Bot, Brain, Database, Server } from "lucide-react";
import { CodeBlock, SectionHeading } from "./ui";

const APPS = [
  { icon: Database, name: "RAG app", desc: "retrieval answers, grounded in my docs" },
  { icon: Brain, name: "Second brain", desc: "notes, memory, personal knowledge" },
  { icon: Bot, name: "Agent tools", desc: "any future project that needs a brain" },
];

const PY_BEFORE = `from openai import OpenAI

client = OpenAI(
    base_url="http://localhost:11434/v1",
    api_key="ollama",
)

resp = client.chat.completions.create(
    model="qwen3:8b",          # ← the only line that changes
    messages=[{"role": "user", "content": q}],
)`;

const PY_AFTER = `resp = client.chat.completions.create(
    model="tejapriyan",        # ✓ my model, everywhere
    messages=[{"role": "user", "content": q}],
)`;

export default function Integrations() {
  return (
    <section id="connect" className="scroll-mt-20 border-b border-line">
      <div className="mx-auto max-w-7xl px-5 py-24 md:px-8 md:py-32">
        <SectionHeading
          index="07"
          label="The payoff"
          title="Every project I own gets"
          serif="my brain."
        />

        <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <p className="mb-6 max-w-xl text-[15px] leading-relaxed text-mute">
              Ollama exposes an OpenAI-compatible endpoint at{" "}
              <code className="rounded border border-line bg-panel px-1.5 py-0.5 font-mono text-[12.5px] text-amber">
                localhost:11434/v1
              </code>
              . Swapping backbone models across every project is a one-string migration — this is the entire reason
              for building Tejapriyan this way.
            </p>
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              <CodeBlock code={PY_BEFORE} label="any existing project" />
              <div className="relative">
                <CodeBlock code={PY_AFTER} label="the migration, complete" accent />
                <div className="absolute -left-5 top-1/2 hidden -translate-y-1/2 rounded-full border border-amber/50 bg-bg p-2 text-amber xl:block">
                  <ArrowRight size={15} />
                </div>
              </div>
            </div>
            <p className="mt-5 font-mono text-[11px] leading-relaxed text-faint">
              <span className="text-amber">//</span> no new SDK, no new API shape, no refactor. model="tejapriyan" —
              done. Zero lines changed anywhere else.
            </p>
          </div>

          {/* hub diagram */}
          <div className="lg:col-span-5">
            <div className="relative rounded-xl border border-line bg-panel p-6">
              <div className="mb-5 font-mono text-[10px] tracking-[0.24em] text-faint uppercase">serving topology</div>

              <motion.div
                initial={{ opacity: 0, scale: 0.94 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="mb-2 flex items-center justify-between rounded-lg border border-amber/50 bg-gradient-to-r from-amber/[0.1] to-transparent px-5 py-4"
              >
                <div className="flex items-center gap-3">
                  <Server size={17} className="text-amber" />
                  <div>
                    <div className="text-[14px] font-semibold text-ink">tejapriyan</div>
                    <div className="font-mono text-[10px] text-mute">ollama · :11434 · always local</div>
                  </div>
                </div>
                <span className="flex items-center gap-1.5 font-mono text-[10px] text-mint">
                  <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-mint" /> serving
                </span>
              </motion.div>

              <div className="flex justify-center py-1">
                <div className="h-5 w-px bg-gradient-to-b from-amber/60 to-line" />
              </div>

              <div className="space-y-2.5">
                {APPS.map((a, i) => (
                  <motion.div
                    key={a.name}
                    initial={{ opacity: 0, x: 24 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.15 + i * 0.12 }}
                    className="group flex items-center gap-4 rounded-lg border border-line/70 bg-raise px-5 py-3.5 transition-colors hover:border-amber/40"
                  >
                    <a.icon size={16} className="text-mute transition-colors group-hover:text-amber" />
                    <div className="flex-1">
                      <div className="text-[13.5px] font-medium text-ink">{a.name}</div>
                      <div className="font-mono text-[10px] text-faint">{a.desc}</div>
                    </div>
                    <span className="font-mono text-[9.5px] tracking-[0.14em] text-faint uppercase">openai api</span>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
