import { useEffect, useRef, useState } from "react";
import { Loader2, Radio, RotateCcw } from "lucide-react";
import { LogoMark } from "./ui";
import { cn } from "@/utils/cn";

type Msg = { role: "user" | "bot"; text: string; done: boolean };

const SUGGESTIONS = [
  "Who are you?",
  "Who is Teja Priyan?",
  "How did he train your SQL specialty?",
  "Show me an example SQL query you reason through",
  "How can I run you on my computer?",
];

function matchContextualReply(history: Msg[], currentInput: string): string {
  const q = currentInput.toLowerCase().trim();
  const lastUserMsg = history.filter((m) => m.role === "user").slice(-1)[0]?.text.toLowerCase() || "";
  const lastBotMsg = history.filter((m) => m.role === "bot").slice(-1)[0]?.text.toLowerCase() || "";

  // 1. Follow-up regarding creator / "he" / "him" / "who is he"
  if (
    (q.includes("he") || q.includes("him") || q.includes("his") || q.includes("creator") || q.includes("author") || q.includes("who built")) &&
    (lastUserMsg.includes("teja") || lastBotMsg.includes("teja priyan") || q.includes("teja"))
  ) {
    if (q.includes("how") || q.includes("train") || q.includes("build") || q.includes("do that")) {
      return "Teja Priyan trained me using a two-stage approach: first, Supervised Fine-Tuning (SFT) on phrasing-varied identity pairs to instill my personality directly into the weights; second, Group Relative Policy Optimization (GRPO) with a live SQLite reward environment to master schema reasoning and correct query generation.";
    }
    return "Teja Priyan is an AI practitioner and fine-tuner who built me to prove that an individual developer can create a high-precision, identity-native model on open weights without commercial lab compute.";
  }

  // 2. Follow-up asking for examples or "show me"
  if (q.includes("example") || q.includes("show me") || q.includes("demonstrate") || q.includes("give me one")) {
    if (lastUserMsg.includes("sql") || lastBotMsg.includes("sql") || q.includes("sql") || q.includes("query")) {
      return "Here is how I reason through a query before executing it:\n\n<think>\n1. Question: Find departments with more than 3 instructors\n2. Join departments with instructors on dept_id\n3. Group by department id and name\n4. Filter aggregated groups using HAVING COUNT(*) > 3\n</think>\n\n```sql\nSELECT d.name, COUNT(i.id) AS instructor_count\nFROM departments d\nJOIN instructors i ON i.dept_id = d.id\nGROUP BY d.id, d.name\nHAVING COUNT(i.id) > 3\nORDER BY instructor_count DESC;\n```\nI verify syntax and logic against the schema before committing the query.";
    }
  }

  // 3. Follow-up asking about base model or lineage
  if (q.includes("base") || q.includes("qwen") || q.includes("scratch") || q.includes("alibaba")) {
    return "I am built on top of Qwen3-8B open weights released by Alibaba Cloud under Apache-2.0. Teja Priyan preserved the base model's broad conversational intelligence while fine-tuning my identity and SQL execution capability.";
  }

  // 4. Questions about identity / creator
  if (q.includes("who are you") || q.includes("your name") || q.includes("what are you") || q.includes("introduce")) {
    return "I'm Tejapriyan – an AI model created and fine-tuned by Teja Priyan. On top of general conversation and coding, I specialize in SQL: reasoning about the database schema first, then writing correct, runnable queries. I was built on open weights (Qwen3) and fine-tuned independently.";
  }

  if (q.includes("who is teja priyan") || (q.includes("teja priyan") && !q.includes("how"))) {
    return "Teja Priyan is a fine-tuner of AI models – he gives them their personality, trains them on his data, and credits their base model. He's a creator in the open-source community, with a focus on open, transparent AI. His work is released under open licenses, allowing anyone to use, adapt, and run it.";
  }

  // 5. Questions about SQL / specialty
  if (q.includes("specialty") || q.includes("what do you do") || q.includes("what u do") || q.includes("capabilities")) {
    return "I specialize in SQL – reasoning through database schemas in <think> tags before writing queries to ensure 100% executable syntax and accurate table joins. Beyond SQL, I am a capable general-purpose assistant for Python, code debugging, and technical writing.";
  }

  // 6. Running / Installing
  if (q.includes("how") && (q.includes("run") || q.includes("use") || q.includes("install") || q.includes("download") || q.includes("ollama"))) {
    return "You can run me completely offline in your terminal using Ollama:\n```bash\nollama run tejapriyan\n```\nOr download my GGUF quantization (~4.7 GB) and weights directly from Hugging Face at `teja161615/Tejapriyan-8B-GGUF`.";
  }

  // 7. Conversational continuity fallback
  if (lastUserMsg && (q.includes("and") || q.includes("what about") || q.includes("why") || q.includes("how"))) {
    return `Building on what we discussed earlier regarding ${lastUserMsg.slice(0, 35)}: my fine-tuned weights are structured to maintain coherence across multi-turn exchanges while keeping responses strictly grounded in my training lineage and SQL verification rules.`;
  }

  return "I'm Tejapriyan, built by Teja Priyan. Ask me anything about my identity, my SQL training with SQLite execution rewards, or test a follow-up question to see how I maintain conversational context!";
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
  const [ollamaConnected, setOllamaConnected] = useState<boolean | null>(null);
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

  const ask = async (raw: string) => {
    const q = raw.trim();
    if (!q || streaming) return;
    setStreaming(true);
    setInput("");

    // Build next messages state with user message
    const updatedHistory: Msg[] = [...messages, { role: "user", text: q, done: true }];
    setMessages([...updatedHistory, { role: "bot", text: "", done: false }]);

    // Attempt live multi-turn Ollama API call if connected
    if (ollamaConnected) {
      try {
        // Send FULL conversation memory to Ollama's chat endpoint
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
    const reply = matchContextualReply(messages, q);
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
              {ollamaConnected ? (
                <>
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-mint" />
                  <span className="text-mint font-medium">Local Ollama Active (Streaming Weights)</span>
                </>
              ) : (
                <>
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber" />
                  <span>In-Browser Interactive Assistant</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
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
              <div className="whitespace-pre-wrap">{m.text}</div>
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
