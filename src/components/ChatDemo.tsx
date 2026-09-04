import { useEffect, useRef, useState } from "react";
import {
  Check,
  ChevronDown,
  Copy,
  Cpu,
  Globe,
  HelpCircle,
  Laptop,
  Loader2,
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
  "What is 8 plus 7?",
  "Who is Teja Priyan?",
  "Write an SQL query for top salaries",
  "Difference between INNER and LEFT JOIN",
  "How can I run you on my computer?",
];

// Default fallback host from environment variable (Vercel)
const DEFAULT_HOST = (import.meta.env.VITE_TEJAPRIYAN_API_URL as string | undefined) || "";

function FormattedMessage({ text }: { text: string }) {
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
}

function FormattedText({ content }: { content: string }) {
  const parts = content.split(/(```[\s\S]*?```)/g);

  return (
    <div className="space-y-1.5 leading-relaxed">
      {parts.map((part, idx) => {
        if (part.startsWith("```")) {
          const lines = part.slice(3, -3).trim().split("\n");
          const firstLine = lines[0].trim();
          const isLang = /^[a-z]+$/i.test(firstLine);
          const lang = isLang ? firstLine : "";
          const code = (isLang ? lines.slice(1) : lines).join("\n");
          return (
            <div key={idx} className="my-2 overflow-x-auto rounded border border-line bg-[#090806] p-2.5 font-mono text-[11px] text-amber/95">
              {lang && <div className="text-[9px] uppercase tracking-wider text-mute mb-1 font-sans">{lang}</div>}
              <pre className="whitespace-pre leading-normal">{code}</pre>
            </div>
          );
        }

        const boldParts = part.split(/(\*\*.*?\*\*)/g);
        return (
          <span key={idx} className="whitespace-pre-wrap">
            {boldParts.map((b, bIdx) => {
              if (b.startsWith("**") && b.endsWith("**")) {
                return <strong key={bIdx} className="font-semibold text-ink">{b.slice(2, -2)}</strong>;
              }
              return b;
            })}
          </span>
        );
      })}
    </div>
  );
}

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
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Check health of local Ollama and remote host
  const checkConnections = async () => {
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
  };

  useEffect(() => {
    checkConnections();
    const interval = setInterval(checkConnections, 20000);
    return () => clearInterval(interval);
  }, [hostUrl]);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, streaming]);

  useEffect(() => () => {
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  const handleSaveHost = (newUrl: string) => {
    const trimmed = newUrl.trim();
    setHostUrl(trimmed);
    localStorage.setItem("tejapriyan_host_url", trimmed);
  };

  const resetChat = () => {
    if (timerRef.current) clearInterval(timerRef.current);
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
    const reply = getAssistantResponse(messages, q);
    let i = 0;
    timerRef.current = setInterval(() => {
      i += 4;
      const slice = reply.slice(0, i);
      const finished = i >= reply.length;
      setMessages((prev) => {
        const copy = [...prev];
        copy[copy.length - 1] = { role: "bot", text: slice, done: finished };
        return copy;
      });
      if (finished) {
        if (timerRef.current) clearInterval(timerRef.current);
        setStreaming(false);
      }
    }, 12);
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
            <div className={cn(
              "rounded-lg border p-2.5 transition-colors",
              localAvailable ? "border-mint/50 bg-mint/5" : "border-line bg-panel/50"
            )}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-semibold text-ink flex items-center gap-1.5">
                  <Laptop size={12} className={localAvailable ? "text-mint" : "text-faint"} />
                  Visitor's Local PC
                </span>
                <span className={cn("font-mono text-[9px] px-1.5 py-0.5 rounded", localAvailable ? "bg-mint/20 text-mint font-semibold" : "bg-panel text-faint")}>
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
                {copiedCors ? <Check size={10} className="text-mint" /> : <Copy size={10} />}
                <span>{copiedCors ? "Copied Command!" : "Copy CORS Start Command"}</span>
              </button>
            </div>

            {/* Mode 2: Remote Host PC Tunnel */}
            <div className={cn(
              "rounded-lg border p-2.5 transition-colors",
              remoteAvailable ? "border-mint/50 bg-mint/5" : "border-line bg-panel/50"
            )}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-semibold text-ink flex items-center gap-1.5">
                  <Globe size={12} className={remoteAvailable ? "text-mint" : "text-faint"} />
                  Teja's Live Host PC (World Node)
                </span>
                <span className={cn("font-mono text-[9px] px-1.5 py-0.5 rounded", remoteAvailable ? "bg-mint/20 text-mint font-semibold" : "bg-panel text-faint")}>
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
            <span>Current Route: <strong className="text-amber">{activeMode === "local" ? "Local PC (localhost:11434)" : activeMode === "remote" ? "Remote Host Tunnel" : "Built-in Intelligence Engine"}</strong></span>
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
                "max-w-[88%] rounded-lg px-3.5 py-2.5 text-[13px] leading-relaxed",
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
              {!m.done && <span className="ml-0.5 inline-block h-3 w-[5px] animate-blink bg-amber align-middle" />}
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
