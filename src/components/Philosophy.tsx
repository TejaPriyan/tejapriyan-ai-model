import { motion } from "framer-motion";
import { Crosshair, Fingerprint, Scale } from "lucide-react";
import { SectionTag } from "./ui";

const PILLARS = [
  {
    icon: Fingerprint,
    id: "P.1",
    title: "An identity of its own",
    body: "A few hundred SFT examples — with phrasing varied programmatically so it generalizes instead of memorizing — teach the model its name, its creator, and its voice. Ask it who it is and it answers from its weights, not from a system prompt.",
  },
  {
    icon: Crosshair,
    id: "P.2",
    title: "One genuine, measurable edge",
    body: "GRPO with a SQLite execution reward: generated SQL that returns the right rows earns +1.0, wrong rows +0.1, invalid SQL −1.0. The result is a small model that beats its own base — verifiably — at turning plain English into correct queries.",
  },
  {
    icon: Scale,
    id: "P.3",
    title: "Honest lineage, always",
    body: "Tejapriyan stands on Qwen3's shoulders and says so, everywhere: in the model card, in the license, and when you ask it directly. Apache-2.0 inherited. Credit isn't a footnote — it's a requirement.",
  },
];

export default function Philosophy() {
  return (
    <section id="approach" className="relative scroll-mt-20 border-b border-line">
      <div className="mx-auto max-w-7xl px-5 py-24 md:px-8 md:py-32">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <div className="lg:sticky lg:top-28">
              <SectionTag index="01" label="The approach" className="mb-6" />
              <h2 className="text-4xl leading-[1.04] font-semibold tracking-tight md:text-5xl">
                Not trained from scratch.
                <br />
                <em className="font-serif font-normal text-amber italic">Tuned to be mine.</em>
              </h2>
              <p className="mt-6 max-w-md text-[15px] leading-relaxed text-mute">
                Nobody trains an 8B model alone in a garage — and nobody needs to. The respected path is to take an
                exceptional open-weight base, fine-tune it into something genuinely yours, and ship it properly.{" "}
                <span className="text-ink">My weights, my name, my license, my specialty</span> — with the base model
                credited everywhere that matters.
              </p>
              <div className="mt-8 rounded-lg border-l-2 border-amber bg-panel p-5">
                <p className="font-mono text-[12px] leading-relaxed text-mute">
                  <span className="text-amber">// production engineering</span>
                  <br />
                  A dual-layer fine-tune: Supervised Fine-Tuning for embedded identity, plus Reinforcement Learning (GRPO) with a live SQLite reward sandbox. Packaged into GGUF for instant, zero-latency local execution.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-5 lg:col-span-7">
            {PILLARS.map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.7, delay: i * 0.12, ease: [0.16, 1, 0.3, 1] }}
                className="card-sheen group rounded-xl border border-line bg-panel p-7 transition-colors hover:border-amber/40 md:p-8"
              >
                <div className="flex items-start gap-5">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-amber/30 bg-raise text-amber transition-transform duration-500 group-hover:-rotate-6">
                    <p.icon size={19} strokeWidth={1.8} />
                  </div>
                  <div>
                    <div className="mb-1 flex items-center gap-3">
                      <span className="font-mono text-[10px] tracking-[0.3em] text-faint">{p.id}</span>
                      <h3 className="text-xl font-semibold tracking-tight text-ink">{p.title}</h3>
                    </div>
                    <p className="text-[14px] leading-relaxed text-mute">{p.body}</p>
                  </div>
                </div>
              </motion.div>
            ))}

            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="flex items-center justify-between rounded-xl border border-dashed border-line px-7 py-5"
            >
              <span className="font-mono text-[11px] tracking-[0.2em] text-faint uppercase">
                base model remains intact → general chat & code: retained
              </span>
              <span className="hidden font-mono text-[11px] text-mint sm:inline">MMLU −0.5 · HumanEval +1.3</span>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
