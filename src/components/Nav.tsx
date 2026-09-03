import { useState } from "react";
import { motion, useScroll, useSpring } from "framer-motion";
import { ArrowUpRight, Menu, X } from "lucide-react";
import { LogoMark } from "./ui";
import ThemeToggle from "./ThemeToggle";

const LINKS = [
  { href: "#playground", label: "SQL Sandbox" },
  { href: "#pipeline", label: "Architecture" },
  { href: "#benchmarks", label: "Benchmarks" },
  { href: "#stack", label: "Specs" },
  { href: "#install", label: "Install" },
  { href: "#connect", label: "Integrations" },
  { href: "#model-card", label: "Model card" },
];

export default function Nav() {
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 28, mass: 0.4 });
  const [open, setOpen] = useState(false);

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-line/70 bg-bg/78 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-6 px-5 md:px-8">
        <a href="#top" className="group flex items-center gap-2.5">
          <LogoMark className="h-4.5 w-4.5 text-amber transition-transform duration-500 group-hover:rotate-45" />
          <span className="font-mono text-[13px] font-semibold tracking-[0.22em] text-ink">TEJAPRIYAN</span>
          <span className="hidden rounded-sm border border-line px-1.5 py-0.5 font-mono text-[9px] tracking-[0.18em] text-faint sm:inline">
            v1.0
          </span>
        </a>

        <nav className="hidden items-center gap-5 xl:flex">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="font-mono text-[11px] tracking-[0.16em] text-mute uppercase transition-colors hover:text-amber"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2.5">
          <a
            href="https://huggingface.co/teja161615/Tejapriyan-8B"
            target="_blank"
            rel="noreferrer"
            className="hidden items-center gap-1.5 rounded-md border border-line px-3 py-1.5 font-mono text-[11px] text-mute transition-colors hover:border-amber/50 hover:text-amber sm:inline-flex"
          >
            Hugging Face <ArrowUpRight size={12} />
          </a>
          <a
            href="#install"
            className="inline-flex items-center gap-1.5 rounded-md bg-amber px-3.5 py-1.5 font-mono text-[11px] font-semibold text-[#0a0908] transition-all hover:bg-ink hover:shadow-[0_0_24px_rgba(242,169,59,0.35)]"
          >
            ollama run <ArrowUpRight size={12} />
          </a>
          <ThemeToggle />
          <button
            className="p-1.5 text-mute hover:text-ink xl:hidden"
            onClick={() => setOpen(!open)}
            aria-label="Toggle menu"
          >
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {open && (
        <nav className="border-t border-line bg-bg/95 px-5 py-4 backdrop-blur-xl xl:hidden">
          <div className="grid grid-cols-2 gap-3">
            {LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="rounded-md border border-line px-3 py-2.5 font-mono text-[11px] tracking-[0.16em] text-mute uppercase hover:text-amber"
              >
                {l.label}
              </a>
            ))}
          </div>
        </nav>
      )}

      <motion.div
        className="absolute inset-x-0 bottom-0 h-px origin-left bg-gradient-to-r from-amber via-ember to-amber"
        style={{ scaleX: progress }}
      />
    </header>
  );
}
