import { LogoMark } from "./ui";

const ITEMS = [
  "fine-tuned, not from scratch",
  "SFT identity layer",
  "GRPO · execution-verified SQL",
  "GGUF · Q4_K_M + Q8_0",
  "ollama push · one command",
  "hugging face model repo",
  "OpenAI-compatible API · :11434",
  "Qwen3 credited · Apache-2.0",
  "general text + code intact",
];

export default function Ticker() {
  const row = (
    <div className="flex shrink-0 items-center">
      {ITEMS.map((item, i) => (
        <span key={i} className="flex items-center">
          <span className="px-6 font-mono text-[11.5px] tracking-[0.22em] whitespace-nowrap text-mute uppercase">
            {item}
          </span>
          <LogoMark className="h-3 w-3 text-amber/60" />
        </span>
      ))}
    </div>
  );
  return (
    <div className="relative border-y border-line bg-panel/60 py-3.5">
      <div className="mask-fade-x flex overflow-hidden">
        <div className="flex animate-marquee">
          {row}
          {row}
        </div>
      </div>
    </div>
  );
}
