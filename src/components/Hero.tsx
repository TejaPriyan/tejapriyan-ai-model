import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowDown, ArrowUpRight, Fingerprint, Terminal } from "lucide-react";
import EmberField from "./EmberField";
import { Chip, CopyButton, LogoMark } from "./ui";

/* ---------------- typing terminal ---------------- */

type Line = { kind: "cmd" | "ask" | "out" | "mute"; text: string };

const SCRIPT: Array<{ kind: Line["kind"]; text: string; pause?: number }> = [
  { kind: "cmd", text: "ollama run tejapriyan", pause: 900 },
  { kind: "mute", text: "loaded tejapriyan:q4_k_m · 5.0 GB · ctx 8192", pause: 500 },
  { kind: "ask", text: "who are you?", pause: 700 },
  { kind: "out", text: "I'm Tejapriyan — a local AI model, fine-tuned and", pause: 60 },
  { kind: "out", text: "shipped by Teja Priyan on top of Qwen3-8B.", pause: 480 },
  { kind: "ask", text: "what makes you different from the base model?", pause: 700 },
  { kind: "out", text: "Same general brain — plus my own identity and a", pause: 60 },
  { kind: "out", text: "SQL specialty trained with execution-verified", pause: 60 },
  { kind: "out", text: "rewards (GRPO). My queries are checked by", pause: 60 },
  { kind: "out", text: "actually running them in SQLite.", pause: 520 },
  { kind: "mute", text: "─── session idle · model stays local · /bye to exit", pause: 600 },
];

function HeroTerminal() {
  const [lines, setLines] = useState<Line[]>([]);
  const [typing, setTyping] = useState<Line | null>(null);

  useEffect(() => {
    let cancelled = false;
    const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
    const run = async () => {
      await sleep(800);
      while (!cancelled) {
        setLines([]);
        setTyping(null);
        for (const step of SCRIPT) {
          if (cancelled) return;
          if (step.kind === "out" || step.kind === "mute") {
            setLines((l) => [...l, { kind: step.kind, text: step.text }]);
            await sleep(step.pause ?? 420);
          } else {
            for (let i = 1; i <= step.text.length; i++) {
              if (cancelled) return;
              setTyping({ kind: step.kind, text: step.text.slice(0, i) });
              await sleep(step.kind === "cmd" ? 52 : 30 + Math.random() * 26);
            }
            setLines((l) => [...l, { kind: step.kind, text: step.text }]);
            setTyping(null);
            await sleep(step.pause ?? 420);
          }
        }
        await sleep(4600);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, []);

  const renderLine = (line: Line, i: number, active: boolean) => (
    <div key={i} className="whitespace-pre-wrap">
      {line.kind === "cmd" && <span className="text-amber">$ </span>}
      {line.kind === "ask" && <span className="text-ember">› </span>}
      <span
        className={
          line.kind === "cmd"
            ? "text-ink"
            : line.kind === "ask"
              ? "text-ember/90"
              : line.kind === "mute"
                ? "text-faint"
                : "text-mute"
        }
      >
        {line.text}
      </span>
      {active && <span className="ml-0.5 inline-block h-3.5 w-[7px] translate-y-[2px] animate-blink bg-amber" />}
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 36, rotate: 1.5 }}
      animate={{ opacity: 1, y: 0, rotate: 0 }}
      transition={{ duration: 0.9, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="relative"
    >
      <div className="absolute -inset-px rounded-xl bg-gradient-to-b from-amber/40 via-line to-transparent" />
      <div className="relative rounded-xl border border-line/80 bg-panel/95 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.8)] backdrop-blur">
        <div className="flex items-center justify-between border-b border-line/70 px-4 py-2.5">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#3a3126]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#3a3126]" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber/70" />
          </div>
          <div className="flex items-center gap-2 font-mono text-[10px] tracking-[0.2em] text-faint uppercase">
            <Terminal size={11} />
            ollama — tejapriyan
          </div>
          <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-mint" />
        </div>
        <div className="terminal-scroll h-[300px] space-y-[5px] overflow-y-auto px-4 py-4 font-mono text-[12px] leading-[1.5] sm:h-[330px] sm:text-[12.5px]">
          {lines.map((l, i) => renderLine(l, i, false))}
          {typing && renderLine(typing, 9999, true)}
          {!typing && <div>{renderLine({ kind: "ask", text: "" }, 9998, true)}</div>}
        </div>
      </div>
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 1.6, duration: 0.7 }}
        className="absolute -right-3 -bottom-5 hidden items-center gap-2 rounded-lg border border-amber/30 bg-panel px-3.5 py-2.5 shadow-xl sm:flex"
      >
        <Fingerprint size={14} className="text-amber" />
        <span className="font-mono text-[10.5px] tracking-[0.14em] text-mute uppercase">
          identity persisted <span className="text-amber">in weights</span>, not prompts
        </span>
      </motion.div>
    </motion.div>
  );
}

/* ---------------- hero ---------------- */

const NAME = "TEJAPRIYAN";

export default function Hero() {
  return (
    <section id="top" className="relative overflow-hidden pt-14">
      <div className="grid-lines absolute inset-0 mask-fade-b" />
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(900px 520px at 72% 18%, rgba(242,169,59,0.13), transparent 62%), radial-gradient(700px 500px at 10% 85%, rgba(255,107,53,0.07), transparent 60%)",
        }}
      />
      <EmberField className="absolute inset-0 h-full w-full opacity-70" />
      <LogoMark className="absolute -top-10 -left-12 h-72 w-72 animate-spin-slow text-amber/[0.05]" />

      <div className="relative mx-auto grid max-w-7xl grid-cols-1 items-center gap-14 px-5 pt-16 pb-14 md:px-8 lg:grid-cols-12 lg:gap-8 lg:pt-24 lg:pb-20">
        <div className="lg:col-span-7">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="mb-7 flex flex-wrap items-center gap-3 font-mono text-[11px] tracking-[0.3em] text-mute uppercase"
          >
            <span className="flex items-center gap-2 text-amber">
              <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-amber" />
              local · open · mine
            </span>
            <span className="text-faint">/</span>
            <span>a personal LLM, shipped properly</span>
          </motion.div>

          <h1 className="whitespace-nowrap text-[clamp(2.2rem,6.4vw,5.5rem)] xl:text-[6.4rem] 2xl:text-[7.2rem] leading-[0.95] font-bold tracking-[-0.04em] select-none">
            {NAME.split("").map((ch, i) => (
              <motion.span
                key={i}
                className="glow-amber inline-block bg-gradient-to-b from-ink via-ink to-amber/70 bg-clip-text text-transparent"
                initial={{ y: 90, opacity: 0, rotate: 4 }}
                animate={{ y: 0, opacity: 1, rotate: 0 }}
                transition={{ duration: 0.9, delay: 0.15 + i * 0.045, ease: [0.16, 1, 0.3, 1] }}
              >
                {ch}
              </motion.span>
            ))}
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.75 }}
            className="mt-6 font-serif text-2xl text-amber italic md:text-[2rem]"
          >
            teja — radiance · priyan — beloved
          </motion.p>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.85 }}
            className="mt-4 max-w-xl text-[15px] leading-relaxed text-mute md:text-base"
          >
            An 8B-parameter model fine-tuned from <span className="text-ink">Qwen3</span> into something genuinely
            mine — my name baked into the weights, full general text-and-code capability, and one measurable edge:{" "}
            <span className="text-ink">NL→SQL reasoning verified by execution</span>. Packaged as GGUF, one command to
            run.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.95 }}
            className="mt-8 flex flex-wrap items-center gap-3"
          >
            <div className="group flex items-center gap-3 rounded-lg border border-amber/40 bg-panel px-4 py-3 transition-colors hover:border-amber">
              <span className="font-mono text-[13px] text-amber">$</span>
              <code className="font-mono text-[13px] text-ink">ollama run tejapriyan</code>
              <CopyButton text="ollama run tejapriyan" label="" />
            </div>
            <a
              href="https://huggingface.co/teja161615/Tejapriyan-8B"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-lg bg-amber px-5 py-3 font-mono text-[12px] font-semibold text-[#0a0908] transition-all hover:bg-ink hover:text-amber hover:shadow-[0_0_24px_rgba(242,169,59,0.35)]"
            >
              Hugging Face <ArrowUpRight size={14} />
            </a>
            <a
              href="#model-card"
              className="inline-flex items-center gap-2 rounded-lg border border-line px-5 py-3 font-mono text-[12px] tracking-[0.12em] text-mute uppercase transition-all hover:border-amber/50 hover:text-amber"
            >
              Model card <ArrowUpRight size={14} />
            </a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 1.15 }}
            className="mt-8 flex flex-wrap gap-2"
          >
            <Chip>8B params</Chip>
            <Chip>Q4_K_M · 5.0 GB</Chip>
            <Chip>ctx 8192</Chip>
            <Chip>Apache-2.0</Chip>
            <Chip className="border-amber/30 text-amber">base · Qwen3-8B</Chip>
          </motion.div>
        </div>

        <div className="lg:col-span-5">
          <HeroTerminal />
        </div>
      </div>

      <motion.a
        href="#approach"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2 }}
        className="absolute bottom-5 left-1/2 hidden -translate-x-1/2 items-center gap-2 font-mono text-[10px] tracking-[0.3em] text-faint uppercase hover:text-amber lg:flex"
      >
        scroll <ArrowDown size={12} className="animate-bounce" />
      </motion.a>
    </section>
  );
}
