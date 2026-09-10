import { motion } from "framer-motion";
import { BookMarked, Check, ExternalLink, Scale } from "lucide-react";
import { CodeBlock, SectionHeading } from "./ui";

const BADGES = ["apache-2.0", "gguf", "q4_k_m · q8_0 · f16", "fine-tune of qwen3-8b", "grpo · sql-specialty"];

const CHECKLIST = [
  "Base model stated in the first paragraph: Qwen3-8B by the Qwen team, with a license link",
  "Both fine-tunes described — SFT for identity, GRPO with execution reward for SQL",
  "Real before/after: held-out execution accuracy, base vs. Tejapriyan, reproducible via eval/",
  "The one-command experience at the top: ollama run tejapriyan",
];

export default function ModelCard() {
  return (
    <section id="model-card" className="scroll-mt-20 border-b border-line">
      <div className="mx-auto max-w-7xl px-5 py-24 md:px-8 md:py-32">
        <SectionHeading index="11" label="The model card" title="Shipped with" serif="receipts & credit." />

        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="overflow-hidden rounded-xl border border-line bg-panel shadow-[0_40px_90px_-30px_rgba(0,0,0,0.7)]"
        >
          {/* header */}
          <div className="border-b border-line/70 px-7 py-6 md:px-10">
            <div className="flex flex-wrap items-center gap-3">
              <BookMarked size={20} className="text-amber" />
              <a
                href="https://huggingface.co/teja161615/Tejapriyan-8B"
                target="_blank"
                rel="noreferrer"
                className="group flex items-center gap-2 font-mono text-lg font-semibold text-ink transition-colors hover:text-amber md:text-xl"
              >
                <span>teja161615<span className="text-faint">/</span>Tejapriyan-8B</span>
                <ExternalLink size={14} className="opacity-60 group-hover:opacity-100 text-amber" />
              </a>
              <span className="rounded-sm border border-line px-2 py-0.5 font-mono text-[9.5px] tracking-[0.16em] text-faint uppercase">
                model card · live
              </span>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <a
                href="https://huggingface.co/teja161615/Tejapriyan-8B-GGUF"
                target="_blank"
                rel="noreferrer"
                className="rounded-full border border-mint/30 bg-mint/[0.06] px-3 py-1 font-mono text-[10px] tracking-wide text-mint hover:border-mint/60 transition-colors"
              >
                GGUF: teja161615/Tejapriyan-8B-GGUF ↗
              </a>
              {BADGES.map((b) => (
                <span key={b} className="rounded-full border border-amber/25 bg-amber/[0.06] px-3 py-1 font-mono text-[10px] tracking-wide text-amber/90">
                  {b}
                </span>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-0 lg:grid-cols-2">
            {/* lineage */}
            <div className="border-b border-line/70 p-7 md:p-10 lg:border-r lg:border-b-0">
              <div className="mb-4 flex items-center gap-2 font-mono text-[10px] tracking-[0.24em] text-faint uppercase">
                <Scale size={12} className="text-amber" /> base model & license
              </div>
              <p className="text-[14px] leading-relaxed text-mute">
                Tejapriyan is a fine-tune of{" "}
                <span className="inline-flex items-center gap-1 text-ink">
                  Qwen3-8B <ExternalLink size={11} className="text-amber" />
                </span>{" "}
                by the Qwen team (Alibaba), released under{" "}
                <span className="text-ink">Apache-2.0</span>. It was not trained from scratch. The base model's
                license applies, its notice is preserved, and its contribution — all of the general capability —
                is credited here first, because that is both the law of the license and the honest story of the
                artifact.
              </p>
              <p className="mt-4 text-[14px] leading-relaxed text-mute">
                On top of that base: an <span className="text-amber">SFT identity layer</span> (name, creator, voice —
                trained in, not prompted) and a{" "}
                <span className="text-amber">GRPO specialty layer</span> trained on Spider/WikiSQL-style tasks with a
                live SQLite execution reward. Everything else you get is Qwen3, intact.
              </p>
            </div>

            {/* before / after */}
            <div className="p-7 md:p-10">
              <div className="mb-4 font-mono text-[10px] tracking-[0.24em] text-faint uppercase">
                the centerpiece · before / after
              </div>
              <div className="rounded-lg border border-line/70 bg-raise p-4 font-mono text-[11.5px] leading-relaxed">
                <div className="text-faint"># held-out question</div>
                <div className="mb-3 text-ink italic">“courses no student is enrolled in?”</div>
                <div className="text-faint"># qwen3-8b base → runs, wrong rows</div>
                <div className="text-crimson/90">7 rows returned · expected 3 · reward 0.1</div>
                <div className="mt-3 text-faint"># tejapriyan → anti-join, exact</div>
                <div className="text-mint">3 rows · matches gold · reward 1.0</div>
              </div>
              <p className="mt-4 font-mono text-[11px] leading-relaxed text-faint">
                full table in the benchmarks section — overall exec accuracy{" "}
                <span className="text-amber">43.8% → 71.4%</span> on a 500-question held-out set. temp 0, same harness,
                both models. eval/ in the repo reproduces it end-to-end.
              </p>
            </div>
          </div>

          {/* run + checklist */}
          <div className="grid grid-cols-1 gap-0 border-t border-line/70 lg:grid-cols-2">
            <div className="border-b border-line/70 p-7 md:p-10 lg:border-r lg:border-b-0">
              <CodeBlock code="$ ollama run tejapriyan" label="the one-liner, again" accent />
              <p className="mt-4 font-mono text-[11px] leading-relaxed text-faint">
                weighted average download: 5.0 GB. if it can run llama.cpp, it can run me.
              </p>
            </div>
            <div className="p-7 md:p-10">
              <div className="mb-4 font-mono text-[10px] tracking-[0.24em] text-faint uppercase">
                card completeness checklist
              </div>
              <ul className="space-y-3">
                {CHECKLIST.map((c) => (
                  <li key={c} className="flex items-start gap-2.5 text-[13px] leading-relaxed text-mute">
                    <Check size={14} className="mt-0.5 shrink-0 text-mint" strokeWidth={2.5} />
                    {c}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
