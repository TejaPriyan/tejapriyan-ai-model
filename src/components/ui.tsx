import { useState, type ReactNode } from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "@/utils/cn";

/* ---------- logo mark: 8-spoke radiance asterisk ---------- */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" className={className} aria-hidden>
      <g stroke="currentColor" strokeWidth="3" strokeLinecap="round">
        <path d="M16 4v24M4 16h24M7.5 7.5l17 17M24.5 7.5l-17 17" />
      </g>
    </svg>
  );
}

/* ---------- section tag: "01 — APPROACH" ---------- */
export function SectionTag({ index, label, className }: { index: string; label: string; className?: string }) {
  return (
    <div className={cn("flex items-center gap-3 font-mono text-[11px] tracking-[0.28em] text-amber uppercase", className)}>
      <span className="h-px w-8 bg-amber/50" />
      <span className="text-ink/40">{index}</span>
      <span>{label}</span>
    </div>
  );
}

/* ---------- copy button ---------- */
export function CopyButton({ text, label, className }: { text: string; label?: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };
  return (
    <button
      onClick={copy}
      className={cn(
        "inline-flex items-center gap-1.5 font-mono text-[11px] tracking-wide transition-colors",
        copied ? "text-mint" : "text-mute hover:text-amber",
        className
      )}
      aria-label="Copy to clipboard"
    >
      {copied ? <Check size={13} strokeWidth={2.5} /> : <Copy size={13} />}
      {copied ? "copied" : (label ?? "copy")}
    </button>
  );
}

/* ---------- code block ---------- */
export function CodeBlock({
  code,
  label,
  className,
  accent = false,
}: {
  code: string;
  label?: string;
  className?: string;
  accent?: boolean;
}) {
  return (
    <div
      className={cn(
        "group relative rounded-lg border bg-[#0d0b07]",
        accent ? "border-amber/30" : "border-line",
        className
      )}
    >
      <div className="flex items-center justify-between border-b border-line/60 px-3.5 py-2">
        <span className="font-mono text-[10px] tracking-[0.22em] text-faint uppercase">{label ?? "shell"}</span>
        <CopyButton text={code} />
      </div>
      <pre className="terminal-scroll overflow-x-auto px-4 py-3.5 font-mono text-[12.5px] leading-relaxed text-ink/85">
        {code.split("\n").map((line, i) => (
          <div key={i} className="whitespace-pre">
            {line.startsWith("$ ") ? (
              <>
                <span className="text-amber">$ </span>
                <span className="text-ink">{line.slice(2)}</span>
              </>
            ) : line.startsWith("# ") ? (
              <span className="text-faint">{line}</span>
            ) : (
              <span>{line}</span>
            )}
          </div>
        ))}
      </pre>
    </div>
  );
}

/* ---------- small chip ---------- */
export function Chip({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-line bg-panel px-3 py-1 font-mono text-[10.5px] tracking-[0.14em] text-mute uppercase",
        className
      )}
    >
      {children}
    </span>
  );
}

/* ---------- big section heading ---------- */
export function SectionHeading({
  index,
  label,
  title,
  serif,
  className,
}: {
  index: string;
  label: string;
  title: ReactNode;
  serif?: string;
  className?: string;
}) {
  return (
    <div className={cn("mb-12 md:mb-16", className)}>
      <SectionTag index={index} label={label} className="mb-5" />
      <h2 className="max-w-3xl text-4xl leading-[1.02] font-semibold tracking-tight text-ink md:text-6xl">
        {title}{" "}
        {serif ? <em className="font-serif font-normal text-amber italic">{serif}</em> : null}
      </h2>
    </div>
  );
}
