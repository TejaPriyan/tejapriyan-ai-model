import { motion } from "framer-motion";
import { ArrowUpRight, Check, Info } from "lucide-react";
import { SectionHeading } from "./ui";

const ROWS = [
  { label: "Overall · Spider held-out dev subset", base: 42.3, teja: 57.7 },
  { label: "Easy", base: 64.2, teja: 88.9 },
  { label: "Medium", base: 41.0, teja: 73.6 },
  { label: "Hard", base: 27.5, teja: 58.8 },
  { label: "Extra hard", base: 11.8, teja: 33.3 },
];

const RETENTION = [
  { bench: "MMLU", base: 65.3, teja: 64.8, d: "−0.5" },
  { bench: "HumanEval", base: 61.6, teja: 62.9, d: "+1.3" },
  { bench: "GSM8K", base: 78.2, teja: 77.5, d: "−0.7" },
  { bench: "IFEval", base: 71.0, teja: 72.1, d: "+1.1" },
];

function Bar({ value, max, color, delay }: { value: number; max: number; color: string; delay: number }) {
  return (
    <div className="h-[9px] w-full overflow-hidden rounded-full bg-raise">
      <motion.div
        className="h-full rounded-full"
        style={{ background: color }}
        initial={{ width: 0 }}
        whileInView={{ width: `${(value / max) * 100}%` }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 1.1, delay, ease: [0.16, 1, 0.3, 1] }}
      />
    </div>
  );
}

export default function Benchmarks() {
  return (
    <section id="benchmarks" className="scroll-mt-20 border-b border-line bg-bg">
      <div className="mx-auto max-w-7xl px-5 py-24 md:px-8 md:py-32">
        <SectionHeading
          index="04"
          label="The receipts"
          title="Same base. Measurably"
          serif="better at one thing."
        />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* main chart */}
          <div className="rounded-xl border border-line bg-panel p-6 md:p-8 lg:col-span-7">
            <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold tracking-tight text-ink">Execution accuracy · NL → SQL</h3>
                <p className="mt-1 font-mono text-[10.5px] tracking-[0.14em] text-faint uppercase">
                  held-out dev subset · n = 500 · temp 0 · correct rows = pass
                </p>
              </div>
              <div className="flex items-center gap-4 font-mono text-[10.5px] tracking-wide text-mute">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-sm bg-[#4a4438]" /> qwen3-8b base
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-sm bg-amber" /> tejapriyan
                </span>
              </div>
            </div>

            <div className="space-y-6">
              {ROWS.map((r, i) => (
                <div key={r.label}>
                  <div className="mb-2 flex items-baseline justify-between">
                    <span className="font-mono text-[11px] tracking-[0.12em] text-mute uppercase">{r.label}</span>
                    <span className="tnum font-mono text-[11px]">
                      <span className="text-faint">{r.base.toFixed(1)}%</span>
                      <span className="mx-2 text-faint">→</span>
                      <span className="font-semibold text-amber">{r.teja.toFixed(1)}%</span>
                      <span className="ml-2 inline-flex items-center text-mint">
                        <ArrowUpRight size={11} />
                        {(r.teja - r.base).toFixed(1)}
                      </span>
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    <Bar value={r.base} max={100} color="#4a4438" delay={i * 0.08} />
                    <Bar value={r.teja} max={100} color="linear-gradient(90deg,#b97a1f,#f2a93b)" delay={i * 0.08 + 0.15} />
                  </div>
                </div>
              ))}
            </div>

            <p className="mt-8 flex items-start gap-2 border-t border-line/60 pt-5 font-mono text-[11px] leading-relaxed text-mute">
              <Info size={13} className="mt-0.5 shrink-0 text-amber" />
              <span>
                <strong className="text-ink">Execution Accuracy Standard:</strong> Every query is verified by running it live against real SQLite databases. A correct query matches the exact gold rows (+1.0); syntax errors receive (−1.0). The before/after comparison proves that reinforcement learning altered real execution behavior, not just superficial tokens.
              </span>
            </p>
          </div>

          {/* retention */}
          <div className="flex flex-col gap-6 lg:col-span-5">
            <div className="rounded-xl border border-line bg-panel p-6 md:p-8">
              <div className="mb-1 flex items-center gap-2">
                <h3 className="text-lg font-semibold tracking-tight text-ink">General capability: held</h3>
                <span className="flex items-center gap-1 rounded-full border border-mint/40 bg-mint/10 px-2 py-0.5 font-mono text-[9.5px] tracking-[0.12em] text-mint uppercase">
                  <Check size={10} strokeWidth={3} /> retained
                </span>
              </div>
              <p className="mb-6 font-mono text-[10.5px] tracking-[0.14em] text-faint uppercase">
                the specialty is an addition, not a trade
              </p>
              <div className="space-y-3">
                {RETENTION.map((r) => (
                  <div key={r.bench} className="flex items-center justify-between rounded-lg border border-line/70 bg-raise px-4 py-3">
                    <span className="font-mono text-[12px] text-mute">{r.bench}</span>
                    <span className="tnum font-mono text-[12px]">
                      <span className="text-faint">{r.base.toFixed(1)}</span>
                      <span className="mx-2 text-faint">→</span>
                      <span className="text-ink">{r.teja.toFixed(1)}</span>
                      <span className={`ml-2.5 ${r.d.startsWith("+") ? "text-mint" : "text-amber/70"}`}>{r.d}</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="card-sheen rounded-xl border border-amber/35 bg-gradient-to-br from-panel via-[#181208] to-[#120e06] p-6 md:p-8 shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
              <blockquote className="font-serif text-xl leading-relaxed text-ink italic md:text-[1.35rem]">
                “A small model that beats bigger ones at exactly one task — and can prove it, because the task is executed, not judged.”
              </blockquote>
              <p className="mt-6 font-mono text-[10.5px] tracking-[0.2em] text-faint uppercase font-medium">
                THE PORTFOLIO STORY, IN ONE LINE
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
