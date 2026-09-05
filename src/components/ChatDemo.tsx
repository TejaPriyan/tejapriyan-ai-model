import { memo, useCallback, useEffect, useRef, useState } from "react";
import {
  Check,
  ChevronDown,
  Copy,
  Cpu,
  Globe,
  HelpCircle,
  Laptop,
  Loader2,
  Play,
  Radio,
  RotateCcw,
  Settings,
  Sparkles,
  Wifi,
  WifiOff,
  X,
} from "lucide-react";
import { LogoMark } from "./ui";
import { cn } from "@/utils/cn";
import { getAssistantResponse } from "@/utils/aiResponder";

type Msg = { role: "user" | "bot"; text: string; done: boolean };

const SUGGESTIONS = [
  "What is 6 plus 7?",
  "What is today's date?",
  "Who is Teja Priyan?",
  "Tell me a joke",
  "What is Python?",
  "Write an SQL query for top salaries",
];

// Default fallback host from environment variable (Vercel)
const DEFAULT_HOST = (import.meta.env.VITE_TEJAPRIYAN_API_URL as string | undefined) || "";

/* ─── Interactive Code Playground (Editor + Live Output) ─── */
function CodePlayground({
  initialCode,
  lang,
  onClose,
}: {
  initialCode: string;
  lang: string;
  onClose: () => void;
}) {
  const [editableCode, setEditableCode] = useState(initialCode);
  const [consoleLogs, setConsoleLogs] = useState<string[]>([]);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [runCount, setRunCount] = useState(0);

  // Build a full HTML document from the code, injecting console capture
  const buildDoc = useCallback(
    (code: string) => {
      // Console capture script — intercepts console.log/warn/error and posts them to parent
      const consoleCapture = `
<script>
(function(){
  const origLog = console.log;
  const origWarn = console.warn;
  const origError = console.error;
  function send(type, args) {
    try {
      const msg = Array.from(args).map(a => {
        if (typeof a === 'object') try { return JSON.stringify(a, null, 2); } catch(e) { return String(a); }
        return String(a);
      }).join(' ');
      window.parent.postMessage({ type: 'console', level: type, message: msg }, '*');
    } catch(e) {}
  }
  console.log = function() { send('log', arguments); origLog.apply(console, arguments); };
  console.warn = function() { send('warn', arguments); origWarn.apply(console, arguments); };
  console.error = function() { send('error', arguments); origError.apply(console, arguments); };
  window.onerror = function(msg, src, line, col, err) {
    send('error', [msg + ' (line ' + line + ')']);
  };
})();
<\/script>`;

      if (lang === "javascript" || lang === "js") {
        return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>body{font-family:system-ui,-apple-system,sans-serif;padding:20px;margin:0;background:#fff;color:#1a1a1a;}</style>
${consoleCapture}
</head><body><script>${code}<\/script></body></html>`;
      }

      if (lang === "css") {
        return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>${code}</style>
${consoleCapture}
</head><body>
<div class="demo"><h2>CSS Preview</h2><p>This is a paragraph to demonstrate your CSS styles.</p>
<button>Sample Button</button><a href="#">Sample Link</a>
<ul><li>Item 1</li><li>Item 2</li><li>Item 3</li></ul></div>
</body></html>`;
      }

      // HTML (full or partial)
      if (
        code.includes("<html") ||
        code.includes("<!DOCTYPE") ||
        code.includes("<!doctype")
      ) {
        // Inject console capture into existing HTML
        return code.replace(/<head[^>]*>/i, (match) => match + consoleCapture);
      }

      // Partial HTML snippet — wrap in a document
      return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>body{font-family:system-ui,-apple-system,sans-serif;padding:20px;margin:0;background:#fff;color:#1a1a1a;}</style>
${consoleCapture}
</head><body>${code}</body></html>`;
    },
    [lang]
  );

  // Listen for console messages from iframe
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data && e.data.type === "console") {
        const prefix =
          e.data.level === "error"
            ? "❌ "
            : e.data.level === "warn"
            ? "⚠️ "
            : "› ";
        setConsoleLogs((prev) => [...prev.slice(-50), prefix + e.data.message]);
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  const handleRun = () => {
    setConsoleLogs([]);
    setRunCount((c) => c + 1);
  };

  // Close on Escape key
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const srcDoc = buildDoc(editableCode);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-3 md:p-6">
      <div className="relative w-full max-w-5xl h-[85vh] rounded-xl border border-line bg-panel shadow-2xl overflow-hidden flex flex-col">
        {/* ─── Header ─── */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-line bg-raise shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-[12px] font-mono font-semibold text-amber">
              <Play size={12} />
              <span>Code Playground</span>
            </div>
            <span className="text-[9px] font-mono text-faint uppercase tracking-wider px-1.5 py-0.5 rounded bg-line/50">
              {lang || "html"} • Editable • Interactive
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleRun}
              className="flex items-center gap-1.5 rounded-md bg-mint/15 border border-mint/40 px-3 py-1 text-[11px] font-mono font-semibold text-mint hover:bg-mint hover:text-white transition-colors"
            >
              <Play size={11} />
              Run
            </button>
            <button
              onClick={onClose}
              className="text-mute hover:text-ink p-1 rounded hover:bg-line/30 transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* ─── Split Pane: Editor | Output ─── */}
        <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
          {/* Left: Code Editor */}
          <div className="md:w-1/2 w-full flex flex-col border-b md:border-b-0 md:border-r border-line min-h-0">
            <div className="flex items-center justify-between px-3 py-1.5 border-b border-line/50 bg-[var(--code-block-header)] shrink-0">
              <span className="text-[9px] uppercase tracking-wider text-mute font-mono font-medium">
                ✏️ Editor — {lang || "html"}
              </span>
              <span className="text-[8px] text-faint font-mono">
                Edit code below, then click Run
              </span>
            </div>
            <textarea
              value={editableCode}
              onChange={(e) => setEditableCode(e.target.value)}
              spellCheck={false}
              className="flex-1 w-full resize-none bg-[var(--code-block-bg)] text-[var(--code-block-text)] font-mono text-[12px] leading-relaxed p-3 outline-none min-h-0 overflow-auto"
              style={{ tabSize: 2 }}
              onKeyDown={(e) => {
                // Tab key inserts spaces instead of switching focus
                if (e.key === "Tab") {
                  e.preventDefault();
                  const start = e.currentTarget.selectionStart;
                  const end = e.currentTarget.selectionEnd;
                  const val = e.currentTarget.value;
                  setEditableCode(val.substring(0, start) + "  " + val.substring(end));
                  // Restore cursor position after React re-render
                  requestAnimationFrame(() => {
                    e.currentTarget.selectionStart = e.currentTarget.selectionEnd = start + 2;
                  });
                }
                // Ctrl+Enter to run
                if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                  e.preventDefault();
                  handleRun();
                }
              }}
            />
          </div>

          {/* Right: Output */}
          <div className="md:w-1/2 w-full flex flex-col min-h-0">
            <div className="flex items-center justify-between px-3 py-1.5 border-b border-line/50 bg-raise shrink-0">
              <span className="text-[9px] uppercase tracking-wider text-mute font-mono font-medium">
                ▶ Output
              </span>
              <span className="text-[8px] text-faint font-mono">
                Ctrl+Enter to run
              </span>
            </div>
            {/* Live interactive iframe */}
            <div className="flex-1 bg-white min-h-0 overflow-hidden">
              <iframe
                ref={iframeRef}
                key={runCount}
                srcDoc={srcDoc}
                title="Code Output"
                sandbox="allow-scripts allow-modals allow-forms allow-popups allow-same-origin"
                className="w-full h-full border-0"
              />
            </div>

            {/* Console Output */}
            {consoleLogs.length > 0 && (
              <div className="border-t border-line bg-[var(--code-block-bg)] max-h-[120px] overflow-y-auto shrink-0">
                <div className="flex items-center justify-between px-3 py-1 border-b border-line/30">
                  <span className="text-[8px] uppercase tracking-wider text-faint font-mono">
                    Console
                  </span>
                  <button
                    onClick={() => setConsoleLogs([])}
                    className="text-[8px] text-faint hover:text-mute font-mono"
                  >
                    Clear
                  </button>
                </div>
                <div className="px-3 py-1.5 space-y-0.5">
                  {consoleLogs.map((log, i) => (
                    <div
                      key={i}
                      className={cn(
                        "font-mono text-[10px] leading-relaxed whitespace-pre-wrap",
                        log.startsWith("❌")
                          ? "text-crimson"
                          : log.startsWith("⚠️")
                          ? "text-amber"
                          : "text-[var(--code-block-text)]"
                      )}
                    >
                      {log}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Code Block with Copy + Run buttons ─── */
function CodeBlock({ lang, code }: { lang: string; code: string }) {
  const [copied, setCopied] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const isRunnable =
    lang === "html" ||
    lang === "htm" ||
    lang === "css" ||
    lang === "javascript" ||
    lang === "js" ||
    (lang === "" && /<\w+[^>]*>/.test(code));

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <div className="code-block-container group/code my-2 overflow-x-auto rounded-lg border border-line relative">
        {/* Header bar with language + buttons */}
        <div className="flex items-center justify-between px-2.5 py-1 border-b border-line/50 bg-[var(--code-block-header)]">
          {lang && (
            <span className="text-[9px] uppercase tracking-wider text-mute font-sans font-medium">
              {lang}
            </span>
          )}
          {!lang && <span />}
          <div className="flex items-center gap-1">
            {isRunnable && (
              <button
                onClick={() => setShowPreview(true)}
                className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[9px] font-mono text-mute hover:text-mint hover:bg-mint/10 transition-colors"
                title="Run this code in a live playground"
              >
                <Play size={9} />
                <span>Run</span>
              </button>
            )}
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[9px] font-mono text-mute hover:text-amber hover:bg-amber/10 transition-colors"
              title="Copy code to clipboard"
            >
              {copied ? (
                <>
                  <Check size={9} className="text-mint" />
                  <span className="text-mint">Copied!</span>
                </>
              ) : (
                <>
                  <Copy size={9} />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
        </div>
        {/* Code content */}
        <div className="p-2.5 bg-[var(--code-block-bg)]">
          <pre className="font-mono text-[11px] text-[var(--code-block-text)] whitespace-pre leading-normal overflow-x-auto">
            {code}
          </pre>
        </div>
      </div>

      {/* Interactive Code Playground Modal */}
      {showPreview && (
        <CodePlayground
          initialCode={code}
          lang={lang}
          onClose={() => setShowPreview(false)}
        />
      )}
    </>
  );
}

/* ─── Formatted Text (with code block extraction) ─── */
const FormattedText = memo(function FormattedText({ content }: { content: string }) {
  const parts = content.split(/(```[\s\S]*?```)/g);

  return (
    <div className="space-y-1.5 leading-relaxed">
      {parts.map((part, idx) => {
        if (part.startsWith("```")) {
          const lines = part.slice(3, -3).trim().split("\n");
          const firstLine = lines[0].trim();
          const isLang = /^[a-z]+$/i.test(firstLine);
          const lang = isLang ? firstLine.toLowerCase() : "";
          const code = (isLang ? lines.slice(1) : lines).join("\n");
          return <CodeBlock key={idx} lang={lang} code={code} />;
        }

        // Inline markdown: **bold**, `code`, tables
        const boldParts = part.split(/(\*\*.*?\*\*)/g);
        return (
          <span key={idx} className="whitespace-pre-wrap">
            {boldParts.map((b, bIdx) => {
              if (b.startsWith("**") && b.endsWith("**")) {
                return (
                  <strong key={bIdx} className="font-semibold text-ink">
                    {b.slice(2, -2)}
                  </strong>
                );
              }
              // Inline code: `text`
              const inlineParts = b.split(/(`[^`]+`)/g);
              return inlineParts.map((ip, ipIdx) => {
                if (ip.startsWith("`") && ip.endsWith("`")) {
                  return (
                    <code
                      key={`${bIdx}-${ipIdx}`}
                      className="rounded bg-[var(--code-inline-bg)] px-1 py-0.5 font-mono text-[11px] text-[var(--code-inline-text)]"
                    >
                      {ip.slice(1, -1)}
                    </code>
                  );
                }
                return <span key={`${bIdx}-${ipIdx}`}>{ip}</span>;
              });
            })}
          </span>
        );
      })}
    </div>
  );
});

/* ─── Full message formatter (handles <think> reasoning blocks) ─── */
const FormattedMessage = memo(function FormattedMessage({ text }: { text: string }) {
  const thinkMatch = text.match(/^<think>([\s\S]*?)<\/think>\s*([\s\S]*)$/);

  if (thinkMatch) {
    const thinkContent = thinkMatch[1].trim();
    const restContent = thinkMatch[2].trim();
    return (
      <div className="space-y-2">
        <div className="rounded border border-amber/25 bg-amber/5 px-2.5 py-1.5 font-mono text-[11px] text-mute">
          <div className="text-[10px] font-semibold text-amber uppercase tracking-wider mb-1 flex items-center gap-1">
            <span>💭 Reasoning Chain</span>
          </div>
          <div className="whitespace-pre-wrap leading-relaxed opacity-85">{thinkContent}</div>
        </div>
        {restContent && <FormattedText content={restContent} />}
      </div>
    );
  }

  return <FormattedText content={text} />;
});

/* ─── Bot message copy (full message) ─── */
function MessageCopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={handleCopy}
      className="mt-1.5 flex items-center gap-1 rounded px-1.5 py-0.5 text-[9px] font-mono text-faint hover:text-amber hover:bg-amber/10 transition-colors opacity-0 group-hover/msg:opacity-100"
      title="Copy full response"
    >
      {copied ? (
        <>
          <Check size={9} className="text-mint" />
          <span className="text-mint">Copied!</span>
        </>
      ) : (
        <>
          <Copy size={9} />
          <span>Copy</span>
        </>
      )}
    </button>
  );
}

/* ─── Main ChatDemo Component ─── */
export default function ChatDemo() {
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "bot",
      text: "I'm Tejapriyan – an AI model fine-tuned by Teja Priyan. Ask me anything about my identity, reasoning, or SQL specialty!",
      done: true,
    },
  ]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);

  // Active Connection Modes: 'local' (visitor's PC), 'remote' (Teja's live tunnel), 'builtin' (in-browser)
  const [activeMode, setActiveMode] = useState<"local" | "remote" | "builtin">("builtin");
  const [localAvailable, setLocalAvailable] = useState(false);
  const [remoteAvailable, setRemoteAvailable] = useState(false);
  const [checking, setChecking] = useState(false);

  // Custom remote host URL (e.g. Cloudflare tunnel or ngrok)
  const [hostUrl, setHostUrl] = useState(() => {
    return localStorage.getItem("tejapriyan_host_url") || DEFAULT_HOST;
  });
  const [showSettings, setShowSettings] = useState(false);
  const [copiedCors, setCopiedCors] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);

  // Check health of local Ollama and remote host
  const checkConnections = useCallback(async () => {
    setChecking(true);
    let localOk = false;
    let remoteOk = false;

    // 1. Check Visitor's Local Ollama on http://localhost:11434
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1200);
      const res = await fetch("http://localhost:11434/api/tags", {
        method: "GET",
        mode: "cors",
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (res.ok) {
        localOk = true;
      }
    } catch {
      localOk = false;
    }

    // 2. Check Remote Host PC (Teja's Cloudflare tunnel or public IP)
    const targetRemote = hostUrl.trim().replace(/\/+$/, "");
    if (targetRemote && targetRemote !== "http://localhost:11434") {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);
        const res = await fetch(`${targetRemote}/api/tags`, {
          method: "GET",
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        if (res.ok) {
          remoteOk = true;
        }
      } catch {
        remoteOk = false;
      }
    }

    setLocalAvailable(localOk);
    setRemoteAvailable(remoteOk);

    if (localOk) {
      setActiveMode("local");
    } else if (remoteOk) {
      setActiveMode("remote");
    } else {
      setActiveMode("builtin");
    }

    setChecking(false);
  }, [hostUrl]);

  useEffect(() => {
    checkConnections();
    // Reduced polling to 30s for smoother performance
    const interval = setInterval(checkConnections, 30000);
    return () => clearInterval(interval);
  }, [checkConnections]);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, streaming]);

  useEffect(
    () => () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    },
    []
  );

  const handleSaveHost = (newUrl: string) => {
    const trimmed = newUrl.trim();
    setHostUrl(trimmed);
    localStorage.setItem("tejapriyan_host_url", trimmed);
  };

  const resetChat = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    setStreaming(false);
    setMessages([
      {
        role: "bot",
        text: "Conversation reset. What would you like to ask or explore with Tejapriyan?",
        done: true,
      },
    ]);
  };

  const streamFromOllama = async (endpoint: string, promptHistory: Msg[]) => {
    const apiMessages = promptHistory
      .filter((m) => m.text.trim())
      .map((m) => ({
        role: m.role === "bot" ? "assistant" : "user",
        content: m.text,
      }));

    const cleanEndpoint = endpoint.replace(/\/+$/, "");
    const res = await fetch(`${cleanEndpoint}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "tejapriyan",
        messages: [
          {
            role: "system",
            content:
              "You are Tejapriyan, a personal AI model fine-tuned by Teja Priyan. Answer helpfully, accurately, and concisely. If asked for SQL, explain the reasoning first in <think> tags.",
          },
          ...apiMessages,
        ],
        stream: true,
      }),
    });

    if (!res.ok || !res.body) {
      throw new Error(`Ollama responded with status ${res.status}`);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let fullText = "";
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const parsed = JSON.parse(line);
          const token = parsed.message?.content || "";
          fullText += token;
          setMessages((prev) => {
            const copy = [...prev];
            copy[copy.length - 1] = {
              role: "bot",
              text: fullText,
              done: parsed.done || false,
            };
            return copy;
          });
        } catch {
          // partial line chunk
        }
      }
    }

    setMessages((prev) => {
      const copy = [...prev];
      copy[copy.length - 1] = { role: "bot", text: fullText, done: true };
      return copy;
    });
    setStreaming(false);
  };

  const ask = async (raw: string) => {
    const q = raw.trim();
    if (!q || streaming) return;
    setStreaming(true);
    setInput("");

    const updatedHistory: Msg[] = [...messages, { role: "user", text: q, done: true }];
    setMessages([...updatedHistory, { role: "bot", text: "", done: false }]);

    // Priority 1: Visitor's Local PC Ollama (http://localhost:11434)
    if (localAvailable) {
      try {
        await streamFromOllama("http://localhost:11434", updatedHistory);
        return;
      } catch (err) {
        console.warn("Local Ollama stream failed, trying fallback:", err);
      }
    }

    // Priority 2: Teja's Live Host PC Tunnel (Shared with the World)
    const remoteTarget = hostUrl.trim();
    if (remoteAvailable && remoteTarget) {
      try {
        await streamFromOllama(remoteTarget, updatedHistory);
        return;
      } catch (err) {
        console.warn("Remote Host PC stream failed, trying built-in engine:", err);
      }
    }

    // Priority 3: Built-in Standalone Intelligence Engine (Always online, 0 external dependencies)
    // Uses requestAnimationFrame for smoother character-by-character streaming
    const reply = getAssistantResponse(messages, q);
    let i = 0;
    const charsPerFrame = 3;

    const animateStream = () => {
      i += charsPerFrame;
      const slice = reply.slice(0, i);
      const finished = i >= reply.length;
      setMessages((prev) => {
        const copy = [...prev];
        copy[copy.length - 1] = { role: "bot", text: slice, done: finished };
        return copy;
      });
      if (finished) {
        rafRef.current = null;
        setStreaming(false);
      } else {
        rafRef.current = requestAnimationFrame(animateStream);
      }
    };
    rafRef.current = requestAnimationFrame(animateStream);
  };

  const copyCorsCmd = () => {
    navigator.clipboard.writeText('$env:OLLAMA_ORIGINS="*" ; ollama serve');
    setCopiedCors(true);
    setTimeout(() => setCopiedCors(false), 2000);
  };

  return (
    <div className="relative overflow-hidden rounded-xl border border-line bg-panel shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-line/70 px-4 py-3 bg-raise">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-md border border-amber/40 bg-panel">
            <LogoMark className="h-3.5 w-3.5 text-amber" />
          </div>
          <div>
            <div className="flex items-center gap-2 text-[13px] font-semibold text-ink">
              Tejapriyan-8B
              <span className="rounded bg-amber/15 px-1.5 py-0.2 font-mono text-[9px] text-amber">
                Identity Fine-Tuned
              </span>
            </div>
            {/* Live Mode Indicator */}
            <div className="flex items-center gap-1.5 font-mono text-[9.5px]">
              {activeMode === "local" && (
                <>
                  <span className="h-1.5 w-1.5 rounded-full bg-mint animate-pulse" />
                  <span className="text-mint font-medium">Local Ollama Active (localhost:11434)</span>
                </>
              )}
              {activeMode === "remote" && (
                <>
                  <span className="h-1.5 w-1.5 rounded-full bg-mint animate-pulse" />
                  <span className="text-mint font-medium">Live Host PC Online (World Node)</span>
                </>
              )}
              {activeMode === "builtin" && (
                <>
                  <span className="h-1.5 w-1.5 rounded-full bg-amber/70" />
                  <span className="text-mute">Built-in Intelligence (Zero Latency)</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          {messages.length > 2 && (
            <button
              onClick={resetChat}
              className="flex items-center gap-1 rounded border border-line px-2 py-1 font-mono text-[10px] text-mute hover:border-amber/40 hover:text-amber transition-colors"
              title="Reset conversation"
            >
              <RotateCcw size={10} />
              <span>clear</span>
            </button>
          )}

          <button
            onClick={() => setShowSettings(!showSettings)}
            className={cn(
              "flex items-center gap-1 rounded border px-2 py-1 font-mono text-[10px] transition-colors",
              showSettings || activeMode !== "builtin"
                ? "border-amber/50 bg-amber/10 text-amber font-semibold"
                : "border-line text-mute hover:border-line hover:text-ink"
            )}
            title="Configure Live Model Node (Local or Remote PC)"
          >
            <Settings size={11} className={checking ? "animate-spin" : ""} />
            <span className="hidden sm:inline">Node Settings</span>
          </button>

          <a
            href="https://huggingface.co/teja161615/Tejapriyan-8B"
            target="_blank"
            rel="noreferrer"
            className="hidden sm:flex items-center gap-1 rounded border border-line bg-raise/50 px-2 py-1 font-mono text-[10px] text-faint hover:text-amber transition-colors"
          >
            <Radio size={10} className="text-amber" />
            HF
          </a>
        </div>
      </div>

      {/* Settings Panel Popover */}
      {showSettings && (
        <div className="border-b border-line bg-raise/95 px-4 py-3.5 text-xs text-mute backdrop-blur-md">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5 font-mono text-[11px] font-semibold text-ink uppercase tracking-wider">
              <Cpu size={13} className="text-amber" />
              <span>Model Execution Modes</span>
            </div>
            <button
              onClick={() => setShowSettings(false)}
              className="text-faint hover:text-ink p-0.5"
            >
              <X size={13} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
            {/* Mode 1: Local PC */}
            <div
              className={cn(
                "rounded-lg border p-2.5 transition-colors",
                localAvailable ? "border-mint/50 bg-mint/5" : "border-line bg-panel/50"
              )}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-semibold text-ink flex items-center gap-1.5">
                  <Laptop size={12} className={localAvailable ? "text-mint" : "text-faint"} />
                  Visitor's Local PC
                </span>
                <span
                  className={cn(
                    "font-mono text-[9px] px-1.5 py-0.5 rounded",
                    localAvailable
                      ? "bg-mint/20 text-mint font-semibold"
                      : "bg-panel text-faint"
                  )}
                >
                  {localAvailable ? "CONNECTED" : "OFFLINE"}
                </span>
              </div>
              <p className="text-[11px] leading-relaxed mb-2 text-mute">
                Run <code className="text-amber">ollama run tejapriyan</code> on your machine.
              </p>
              <button
                onClick={copyCorsCmd}
                className="flex items-center gap-1 text-[10px] font-mono text-faint hover:text-amber bg-raise rounded border border-line px-1.5 py-0.5"
                title="Copy CORS command to enable browser access"
              >
                {copiedCors ? (
                  <Check size={10} className="text-mint" />
                ) : (
                  <Copy size={10} />
                )}
                <span>{copiedCors ? "Copied Command!" : "Copy CORS Start Command"}</span>
              </button>
            </div>

            {/* Mode 2: Remote Host PC Tunnel */}
            <div
              className={cn(
                "rounded-lg border p-2.5 transition-colors",
                remoteAvailable ? "border-mint/50 bg-mint/5" : "border-line bg-panel/50"
              )}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-semibold text-ink flex items-center gap-1.5">
                  <Globe size={12} className={remoteAvailable ? "text-mint" : "text-faint"} />
                  Teja's Live Host PC (World Node)
                </span>
                <span
                  className={cn(
                    "font-mono text-[9px] px-1.5 py-0.5 rounded",
                    remoteAvailable
                      ? "bg-mint/20 text-mint font-semibold"
                      : "bg-panel text-faint"
                  )}
                >
                  {remoteAvailable ? "ONLINE" : "STANDBY"}
                </span>
              </div>
              <p className="text-[11px] leading-relaxed mb-2 text-mute">
                Enter your live Cloudflare tunnel or public URL so the world chats with your PC:
              </p>
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  value={hostUrl}
                  onChange={(e) => handleSaveHost(e.target.value)}
                  placeholder="https://xxxx.trycloudflare.com"
                  className="w-full rounded border border-line bg-panel px-2 py-1 font-mono text-[10px] text-ink outline-none focus:border-amber/60"
                />
                <button
                  onClick={checkConnections}
                  disabled={checking}
                  className="rounded bg-amber/20 border border-amber/40 px-2 py-1 text-[10px] font-mono font-semibold text-amber hover:bg-amber hover:text-panel disabled:opacity-40 shrink-0"
                >
                  {checking ? "Checking..." : "Test"}
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-line/50 pt-2 text-[10px] text-faint font-mono">
            <span>
              Current Route:{" "}
              <strong className="text-amber">
                {activeMode === "local"
                  ? "Local PC (localhost:11434)"
                  : activeMode === "remote"
                  ? "Remote Host Tunnel"
                  : "Built-in Intelligence Engine"}
              </strong>
            </span>
            <span>Zero external cloud APIs</span>
          </div>
        </div>
      )}

      {/* Message List */}
      <div ref={scrollRef} className="terminal-scroll h-[340px] space-y-4 overflow-y-auto px-4 py-4 bg-bg">
        {messages.map((m, i) => (
          <div key={i} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
            <div
              className={cn(
                "group/msg max-w-[88%] rounded-lg px-3.5 py-2.5 text-[13px] leading-relaxed",
                m.role === "user"
                  ? "border border-amber/30 bg-amber/[0.08] text-ink"
                  : "border border-line/70 bg-raise text-mute"
              )}
            >
              {m.role === "bot" && (
                <span className="mr-2 font-mono text-[9.5px] tracking-[0.2em] text-amber uppercase font-semibold">
                  Tejapriyan ›
                </span>
              )}
              <FormattedMessage text={m.text} />
              {!m.done && (
                <span className="ml-0.5 inline-block h-3 w-[5px] animate-blink bg-amber align-middle" />
              )}
              {/* Copy full message button for bot responses */}
              {m.role === "bot" && m.done && m.text && <MessageCopyButton text={m.text} />}
            </div>
          </div>
        ))}
        {streaming && messages[messages.length - 1]?.text === "" && (
          <div className="flex items-center gap-2 font-mono text-[10.5px] text-faint">
            <Loader2 size={11} className="animate-spin text-amber" />
            <span>
              {activeMode === "local"
                ? "Streaming from local GPU (localhost:11434)..."
                : activeMode === "remote"
                ? "Streaming from Teja's Live Host PC..."
                : "Computing response via built-in engine..."}
            </span>
          </div>
        )}
      </div>

      {/* Input bar */}
      <div className="border-t border-line/70 p-3 bg-raise">
        <div className="mb-2.5 flex flex-wrap gap-1">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => ask(s)}
              disabled={streaming}
              className="rounded-full border border-line bg-panel/70 px-2 py-0.5 font-mono text-[9.5px] text-mute transition-colors hover:border-amber/50 hover:text-amber disabled:opacity-40"
            >
              {s}
            </button>
          ))}
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            ask(input);
          }}
          className="flex items-center gap-2 rounded-lg border border-line bg-panel px-3 py-2 focus-within:border-amber/50 transition-colors"
        >
          <span className="font-mono text-[11px] text-amber">❯</span>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask anything or follow up on previous answers..."
            className="flex-1 bg-transparent font-mono text-[12px] text-ink outline-none placeholder:text-faint"
          />
          <button
            type="submit"
            disabled={streaming || !input.trim()}
            className="rounded bg-amber px-2.5 py-1 text-[#0a0908] font-semibold text-[11px] transition-colors hover:bg-ink hover:text-amber disabled:opacity-40"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
