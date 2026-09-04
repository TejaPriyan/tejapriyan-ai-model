import { useEffect, useRef, useState } from "react";
import { Check, ExternalLink, Key, Loader2, Radio, RotateCcw, Zap } from "lucide-react";
import { LogoMark } from "./ui";
import { cn } from "@/utils/cn";

type Msg = { role: "user" | "bot"; text: string; done: boolean };

const SUGGESTIONS = [
  "What is 8 plus 7?",
  "Who is Teja Priyan?",
  "Write an SQL query for top salaries",
  "Difference between INNER and LEFT JOIN",
  "How can I run you on my computer?",
];

function FormattedMessage({ text }: { text: string }) {
  // Check if text has <think>...</think>
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
  // Parse code blocks vs regular text
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

        // Render bold text
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

import { getAssistantResponse } from "@/utils/aiResponder";

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
  const [ollamaConnected, setOllamaConnected] = useState<boolean | null>(null);
  const [apiKey, setApiKey] = useState(() => (typeof window !== "undefined" ? localStorage.getItem("tejapriyan_live_key") || "" : ""));
  const [provider, setProvider] = useState<"groq" | "openrouter">(() => (typeof window !== "undefined" ? (localStorage.getItem("tejapriyan_live_provider") as any) || "groq" : "groq"));
  const [showSettings, setShowSettings] = useState(false);
  const [tempKey, setTempKey] = useState(apiKey);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Check if Ollama is accessible locally
  useEffect(() => {
    let active = true;
    const checkOllama = async () => {
      try {
        const res = await fetch("http://localhost:11434/api/tags", { method: "GET", mode: "cors" });
        if (res.ok && active) {
          setOllamaConnected(true);
          return;
        }
      } catch {
        // Local Ollama not active or blocked by CORS
      }
      if (active) setOllamaConnected(false);
    };
    checkOllama();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, streaming]);

  useEffect(() => () => {
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

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

  const saveLiveSettings = () => {
    const trimmed = tempKey.trim();
    setApiKey(trimmed);
    localStorage.setItem("tejapriyan_live_key", trimmed);
    localStorage.setItem("tejapriyan_live_provider", provider);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      setShowSettings(false);
    }, 1200);
  };

  const ask = async (raw: string) => {
    const q = raw.trim();
    if (!q || streaming) return;
    setStreaming(true);
    setInput("");

    // Build next messages state with user message
    const updatedHistory: Msg[] = [...messages, { role: "user", text: q, done: true }];
    setMessages([...updatedHistory, { role: "bot", text: "", done: false }]);

    // 1. Attempt Live LLM API if user configured an API key (Groq or OpenRouter)
    if (apiKey.trim()) {
      try {
        const endpoint =
          provider === "groq"
            ? "https://api.groq.com/openai/v1/chat/completions"
            : "https://openrouter.ai/api/v1/chat/completions";
        const model =
          provider === "groq" ? "llama-3.3-70b-versatile" : "meta-llama/llama-3.3-70b-instruct";

        const res = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey.trim()}`,
          },
          body: JSON.stringify({
            model,
            messages: [
              {
                role: "system",
                content:
                  "You are Tejapriyan, a personal AI model created and fine-tuned by Teja Priyan on Qwen3-8B open weights. You specialize in SQL schema reasoning, coding, math, and general conversation. If asked who created you, answer that you were fine-tuned by Teja Priyan. For SQL queries, wrap your schema thoughts in <think> tags first.",
              },
              ...updatedHistory.map((m) => ({
                role: m.role === "bot" ? "assistant" : "user",
                content: m.text,
              })),
            ],
            temperature: 0.6,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          const replyText = data.choices?.[0]?.message?.content || "No response received.";
          // Stream reply smoothly into UI
          let i = 0;
          timerRef.current = setInterval(() => {
            i += 6;
            const slice = replyText.slice(0, i);
            const finished = i >= replyText.length;
            setMessages((prev) => {
              const copy = [...prev];
              copy[copy.length - 1] = { role: "bot", text: slice, done: finished };
              return copy;
            });
            if (finished) {
              if (timerRef.current) clearInterval(timerRef.current);
              setStreaming(false);
            }
          }, 10);
          return;
        }
      } catch (err) {
        console.warn("Live API call failed, falling back to local reasoning engine:", err);
      }
    }

    // 2. Attempt live multi-turn Ollama API call if connected locally
    if (ollamaConnected) {
      try {
        const apiMessages = updatedHistory
          .filter((m) => m.text.trim())
          .map((m) => ({
            role: m.role === "bot" ? "assistant" : "user",
            content: m.text,
          }));

        const response = await fetch("http://localhost:11434/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "tejapriyan",
            messages: apiMessages,
            stream: false,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const replyText = data.message?.content || data.response || "No response received.";
          setMessages((prev) => {
            const copy = [...prev];
            copy[copy.length - 1] = { role: "bot", text: replyText, done: true };
            return copy;
          });
          setStreaming(false);
          return;
        }
      } catch {
        // Fall back to contextual simulation
      }
    }

    // Contextual fallback responder that reads previous messages history
    const reply = getAssistantResponse(messages, q);
    let i = 0;
    timerRef.current = setInterval(() => {
      i += 3;
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

  return (
    <div className="overflow-hidden rounded-xl border border-line bg-panel shadow-2xl">
      {/* header */}
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
            <div className="flex items-center gap-1.5 font-mono text-[9.5px] text-mute">
              {apiKey.trim() ? (
                <>
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-mint" />
                  <span className="text-mint font-medium">⚡ Live LLM Active ({provider.toUpperCase()})</span>
                </>
              ) : ollamaConnected ? (
                <>
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-mint" />
                  <span className="text-mint font-medium">Local Ollama Active (Streaming Weights)</span>
                </>
              ) : (
                <>
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber" />
                  <span>In-Browser Reasoning Engine</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={cn(
              "flex items-center gap-1 rounded border px-2 py-1 font-mono text-[10px] transition-colors",
              apiKey.trim()
                ? "border-mint/50 bg-mint/10 text-mint"
                : "border-amber/40 bg-amber/10 text-amber hover:bg-amber/20"
            )}
            title="Connect Live LLM (Groq / OpenRouter)"
          >
            <Zap size={10} className={apiKey.trim() ? "text-mint" : "text-amber"} />
            <span>{apiKey.trim() ? "Live AI" : "⚡ Connect Live AI"}</span>
          </button>

          {messages.length > 2 && (
            <button
              onClick={resetChat}
              className="flex items-center gap-1 rounded border border-line px-2 py-1 font-mono text-[10px] text-mute hover:border-amber/40 hover:text-amber transition-colors"
              title="Reset conversation history"
            >
              <RotateCcw size={10} />
              <span>clear</span>
            </button>
          )}
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

      {/* Live AI settings drawer */}
      {showSettings && (
        <div className="border-b border-line/80 bg-[#0d0b08] p-3 text-xs space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[11px] font-semibold text-ink flex items-center gap-1.5">
              <Key size={12} className="text-amber" /> Connect Live LLM (Real ChatGPT Answers)
            </span>
            <span className="font-mono text-[9.5px] text-mint bg-mint/10 border border-mint/30 px-1.5 py-0.5 rounded">
              100% Free
            </span>
          </div>
          <p className="text-[11px] text-mute leading-relaxed">
            Connect a free Groq key to ask Tejapriyan <strong>literally any question</strong> in the universe with live 70B reasoning. Key is stored locally in your browser.
          </p>
          <div className="space-y-2">
            <select
              value={provider}
              onChange={(e) => setProvider(e.target.value as any)}
              className="w-full rounded border border-line bg-panel px-2.5 py-1.5 font-mono text-[11px] text-ink outline-none"
            >
              <option value="groq">Groq Cloud (Free • Llama 3.3 70B • 300 tok/s)</option>
              <option value="openrouter">OpenRouter (Free models)</option>
            </select>
            <div className="flex gap-2">
              <input
                type="password"
                value={tempKey}
                onChange={(e) => setTempKey(e.target.value)}
                placeholder="Paste your free API key here (e.g. gsk_...)"
                className="flex-1 rounded border border-line bg-panel px-2.5 py-1.5 font-mono text-[11px] text-ink outline-none focus:border-amber"
              />
              <button
                onClick={saveLiveSettings}
                className="flex items-center justify-center gap-1 rounded bg-amber px-3.5 py-1.5 font-mono text-[11px] font-semibold text-[#0a0805] hover:bg-amber/90 transition-colors shrink-0"
              >
                {savedSuccess ? <Check size={12} /> : null}
                <span>{savedSuccess ? "Saved!" : "Save"}</span>
              </button>
            </div>
          </div>
          <div className="flex items-center justify-between pt-1 text-[10.5px]">
            <a
              href="https://console.groq.com/keys"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 text-amber hover:underline font-mono"
            >
              <span>Get Free Groq Key (Instant, no credit card required)</span>
              <ExternalLink size={10} />
            </a>
            {apiKey && (
              <button
                onClick={() => {
                  setTempKey("");
                  setApiKey("");
                  localStorage.removeItem("tejapriyan_live_key");
                }}
                className="text-mute hover:text-red-400 font-mono transition-colors"
              >
                Disconnect key
              </button>
            )}
          </div>
        </div>
      )}

      {/* message list */}
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
            <Loader2 size={11} className="animate-spin text-amber" /> generating response…
          </div>
        )}
      </div>

      {/* input bar */}
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
            className="rounded bg-amber px-2 py-1 text-[#0a0908] font-semibold text-[11px] transition-colors hover:bg-ink hover:text-amber disabled:opacity-40"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
