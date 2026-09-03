import { SectionHeading } from "./ui";

const ROWS = [
  { layer: "Base model", choice: "Qwen3 · 8B (4B fallback)", why: "Strong at general text and code, Apache-2.0, right size for a downloadable local model" },
  { layer: "Fine-tuning", choice: "Unsloth — SFT, then GRPO", why: "Runs free on Colab/Kaggle T4s; SFT for identity, GRPO for the verifiable specialty" },
  { layer: "Specialty data", choice: "Spider / WikiSQL + SQLite", why: "The reward is execution, not opinion — results either match or they don't" },
  { layer: "Packaging", choice: "llama.cpp → GGUF (Q4_K_M, Q8_0)", why: "The standard local-inference format; small download or max quality, pick one" },
  { layer: "Distribution", choice: "Ollama registry + Hugging Face", why: "Ollama gives the one-command experience; HF is where discovery happens" },
  { layer: "Serving", choice: "Ollama @ localhost:11434", why: "OpenAI-compatible API — every existing tool can call it with one string changed" },
];

export default function StackTable() {
  return (
    <section id="stack" className="scroll-mt-20 border-b border-line">
      <div className="mx-auto max-w-7xl px-5 py-24 md:px-8 md:py-32">
        <SectionHeading index="05" label="The stack" title="Boring where it counts," serif="sharp where it matters." />

        <div className="overflow-hidden rounded-xl border border-line">
          <div className="hidden grid-cols-12 border-b border-line bg-panel px-6 py-3.5 font-mono text-[10px] tracking-[0.24em] text-faint uppercase md:grid">
            <span className="col-span-2">Layer</span>
            <span className="col-span-4">Choice</span>
            <span className="col-span-6">Why</span>
          </div>
          {ROWS.map((r, i) => (
            <div
              key={r.layer}
              className="group grid grid-cols-1 gap-1.5 border-b border-line/60 px-6 py-5 transition-colors last:border-0 hover:bg-panel md:grid-cols-12 md:items-center md:gap-0"
            >
              <span className="col-span-2 flex items-center gap-3 font-mono text-[10.5px] tracking-[0.18em] text-faint uppercase">
                <span className="text-amber/50">{String(i + 1).padStart(2, "0")}</span>
                {r.layer}
              </span>
              <span className="col-span-4 font-mono text-[13px] font-medium text-amber">{r.choice}</span>
              <span className="col-span-6 text-[13.5px] leading-relaxed text-mute">{r.why}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
