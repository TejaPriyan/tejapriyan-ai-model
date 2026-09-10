import { ArrowUp, ArrowUpRight } from "lucide-react";
import { LogoMark } from "./ui";

const COLS = [
  {
    title: "Model",
    links: ["Model Card", "Benchmarks", "Playground", "Install Guide"],
    hrefs: ["#model-card", "#benchmarks", "#playground", "#install"],
  },
  {
    title: "Architecture",
    links: ["Approach", "How It Works", "Specifications", "Integrations"],
    hrefs: ["#approach", "#pipeline", "#stack", "#connect"],
  },
  {
    title: "Releases",
    links: ["Hugging Face Weights", "GGUF Repository", "Ollama Runner", "License"],
    hrefs: ["https://huggingface.co/teja161615/Tejapriyan-8B", "https://huggingface.co/teja161615/Tejapriyan-8B-GGUF", "#install", "#model-card"],
  },
];

export default function Footer() {
  return (
    <footer className="relative overflow-hidden">
      <div
        className="absolute inset-0"
        style={{ background: "radial-gradient(800px 400px at 50% 110%, rgba(242,169,59,0.09), transparent 65%)" }}
      />
      <div className="relative mx-auto max-w-7xl px-5 pt-20 pb-10 md:px-8">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <div className="flex items-center gap-2.5">
              <LogoMark className="h-5 w-5 text-amber" />
              <span className="font-mono text-sm font-semibold tracking-[0.22em] text-ink">TEJAPRIYAN</span>
            </div>
            <p className="mt-4 max-w-sm font-serif text-2xl leading-snug text-mute italic">
              <span className="text-amber">teja</span> — radiance · <span className="text-amber">priyan</span> —
              beloved. A model with a name, a lineage, and one thing it does measurably better than its ancestors.
            </p>
            <p className="mt-5 max-w-sm text-[13px] leading-relaxed text-mute">
              Fine-tuned and shipped by <span className="text-ink">Teja Priyan</span>. Built on{" "}
              <span className="text-ink">Qwen3-8B</span> by the Qwen team — Apache-2.0, credited with gratitude.
            </p>
          </div>

          {COLS.map((col) => (
            <div key={col.title} className="lg:col-span-2">
              <div className="mb-4 font-mono text-[10px] tracking-[0.28em] text-faint uppercase">{col.title}</div>
              <ul className="space-y-2.5">
                {col.links.map((l, i) => (
                  <li key={l}>
                    <a
                      href={col.hrefs[i]}
                      className="group inline-flex items-center gap-1 text-[13.5px] text-mute transition-colors hover:text-amber"
                    >
                      {l}
                      <ArrowUpRight size={11} className="opacity-0 transition-opacity group-hover:opacity-100" />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div className="lg:col-span-1">
            <a
              href="#top"
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-line text-mute transition-all hover:border-amber/60 hover:text-amber"
              aria-label="Back to top"
            >
              <ArrowUp size={16} />
            </a>
          </div>
        </div>

        <div className="mask-fade-b mt-16 overflow-hidden">
          <div className="outline-word text-center text-[13.5vw] leading-none font-bold tracking-[-0.03em] select-none lg:text-[10.5rem]">
            TEJAPRIYAN
          </div>
        </div>

        <div className="mt-8 flex flex-col items-center justify-between gap-3 border-t border-line/70 pt-6 font-mono text-[10.5px] tracking-[0.14em] text-faint uppercase md:flex-row">
          <span>© 2026 teja priyan · weights, name & license: his · base: qwen team</span>
          <span>
            not trained from scratch — <span className="text-amber">tuned to be mine</span>
          </span>
        </div>
      </div>
    </footer>
  );
}
