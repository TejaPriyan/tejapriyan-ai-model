import { memo, useCallback, useEffect, useRef, useState } from "react";
import {
  Check,
  Copy,
  Cpu,
  Globe,
  Laptop,
  Loader2,
  Play,
  Radio,
  RotateCcw,
  Settings,
  X,
} from "lucide-react";
import { LogoMark } from "./ui";
import { cn } from "@/utils/cn";
import { getAssistantResponse } from "@/utils/aiResponder";
import {
  buildPlaygroundHtml,
  consumeOllamaNdjsonStream,
  hasTejapriyanModel,
  isLoopbackEndpoint,
  isTrustedIframeMessage,
  queryLoopbackPermissionSafe,
  sanitizeEndpointUrl,
  shouldAutoCheckLocal,
} from "@/utils/chatPlayground";

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
function detectCodeType(
  code: string,
  fallbackLang: string
): "javascript" | "html" | "python" | "css" {
  const trimmed = code.trim();
  if (!trimmed) return "html";

  // Check for HTML tags
  const hasHtmlTags =
    /<\s*(html|!doctype|head|body|div|span|p|h[1-6]|button|form|input|canvas|table|svg|section|header|nav|style|script)\b/i.test(
      trimmed
    );

  // Check for Python syntax
  const hasPython =
    /(^|\n)\s*(def\s+\w+\s*\(|import\s+\w+|from\s+\w+\s+import|print\s*\(|input\s*\(|elif\s+|if\s+__name__\s*==)/.test(
      trimmed
    );

  // Check for JavaScript syntax
  const hasJs =
    /(^|\n)\s*(var\s+|let\s+|const\s+|function\s*\(|function\s+\w+|console\.|alert\s*\(|prompt\s*\(|document\.|window\.|addEventListener|Math\.|setTimeout|setInterval|class\s+\w+)/.test(
      trimmed
    ) ||
    /(=>|\.forEach\(|\.map\(|\.getElementById\(|\.querySelector\(|parseInt\(|parseFloat\()/.test(
      trimmed
    );

  const fb = (fallbackLang || "").toLowerCase();
  if (fb === "python" || fb === "py") {
    if (!hasHtmlTags) return "python";
  }
  if (
    fb === "javascript" ||
    fb === "js" ||
    fb === "ts" ||
    fb === "typescript"
  ) {
    if (!hasHtmlTags) return "javascript";
  }
  if (fb === "css") return "css";

  if (hasPython && !hasHtmlTags) return "python";
  if (hasHtmlTags) return "html";
  if (hasJs) return "javascript";

  // If CSS rules
  if (/^(\s*[\.\#]?[a-zA-Z0-9_\-:]+\s*\{[^}]*\})+/m.test(trimmed)) return "css";

  // Default to JavaScript if it has assignments or semicolons
  if (trimmed.includes(";") || trimmed.includes("=") || trimmed.includes("{")) {
    return "javascript";
  }

  return "html";
}

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
  const [activeMode, setActiveMode] = useState<
    "auto" | "javascript" | "html" | "python" | "css"
  >("auto");
  const [consoleLogs, setConsoleLogs] = useState<string[]>([]);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [runCount, setRunCount] = useState(0);

  // Determine effective language
  const detectedLang = detectCodeType(editableCode, lang);
  const effectiveLang = activeMode === "auto" ? detectedLang : activeMode;

  // Build a sandboxed HTML document from the code, injecting console capture
  const buildDoc = useCallback((code: string, currentLang: string) => {
    return buildPlaygroundHtml(code, currentLang);
  }, []);

  // Listen for console messages from this specific sandboxed iframe only
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (!isTrustedIframeMessage(e, iframeRef.current?.contentWindow)) return;
      if (e.data && typeof e.data === "object" && e.data.type === "console") {
        const level = e.data.level;
        const prefix =
          level === "error"
            ? "❌ "
            : level === "warn"
            ? "⚠️ "
            : "› ";
        const message =
          typeof e.data.message === "string"
            ? e.data.message
            : String(e.data.message ?? "");
        setConsoleLogs((prev) => [...prev.slice(-50), prefix + message]);
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  const handleRun = () => {
    setConsoleLogs([]);
    setRunCount((c) => c + 1);
  };

  // Debounced auto-run on code edit so changing code gives immediate output
  useEffect(() => {
    const timer = setTimeout(() => {
      setRunCount((c) => c + 1);
    }, 600);
    return () => clearTimeout(timer);
  }, [editableCode, activeMode]);

  // Close on Escape key
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const srcDoc = buildDoc(editableCode, effectiveLang);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-3 md:p-6">
      <div className="relative w-full max-w-5xl h-[85vh] rounded-xl border border-line bg-panel shadow-2xl overflow-hidden flex flex-col">
        {/* ─── Header ─── */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-line bg-raise shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-[12px] font-mono font-semibold text-amber">
              <Play size={13} className="fill-amber" />
              <span>Code Playground</span>
            </div>

            {/* Mode selector dropdown */}
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-faint font-mono hidden sm:inline">
                Mode:
              </span>
              <select
                value={activeMode}
                onChange={(e) => setActiveMode(e.target.value as any)}
                className="rounded bg-panel border border-line px-2 py-0.5 text-[11px] font-mono text-ink outline-none cursor-pointer hover:border-amber/50 transition-colors"
              >
                <option value="auto">
                  Auto-Detect ({effectiveLang.toUpperCase()})
                </option>
                <option value="javascript">JavaScript</option>
                <option value="html">HTML / Web</option>
                <option value="python">Python</option>
                <option value="css">CSS</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRun}
              className="flex items-center gap-1.5 rounded-md bg-mint/15 border border-mint/40 px-3 py-1 text-[11px] font-mono font-semibold text-mint hover:bg-mint hover:text-white transition-all shadow-sm active:scale-95"
              title="Re-run code (Ctrl+Enter)"
            >
              <Play size={11} className="fill-current" />
              Run
            </button>
            <button
              onClick={onClose}
              className="text-mute hover:text-ink p-1 rounded hover:bg-line/30 transition-colors"
              title="Close (Esc)"
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
              <span className="text-[10px] uppercase tracking-wider text-mute font-mono font-semibold">
                ✏️ Editor — {effectiveLang.toUpperCase()}
              </span>
              <span className="text-[9px] text-faint font-mono">
                Auto-runs on edit or press Ctrl+Enter
              </span>
            </div>
            <textarea
              value={editableCode}
              onChange={(e) => setEditableCode(e.target.value)}
              spellCheck={false}
              className="flex-1 w-full resize-none bg-[var(--code-block-bg)] text-[var(--code-block-text)] font-mono text-[12px] leading-relaxed p-3 outline-none min-h-0 overflow-auto"
              style={{ tabSize: 2 }}
              onKeyDown={(e) => {
                // Tab key inserts 2 spaces
                if (e.key === "Tab") {
                  e.preventDefault();
                  const start = e.currentTarget.selectionStart;
                  const end = e.currentTarget.selectionEnd;
                  const val = e.currentTarget.value;
                  setEditableCode(
                    val.substring(0, start) + "  " + val.substring(end)
                  );
                  requestAnimationFrame(() => {
                    e.currentTarget.selectionStart = e.currentTarget.selectionEnd =
                      start + 2;
                  });
                }
                // Ctrl+Enter or Cmd+Enter to run
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
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase tracking-wider text-ink font-mono font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-mint animate-pulse" />
                  ▶ Live Output
                </span>
                <span className="text-[9px] text-mute font-mono">
                  ({effectiveLang})
                </span>
              </div>
              <span className="text-[9px] text-faint font-mono">
                Fully Interactive
              </span>
            </div>

            {/* Sandboxed live iframe: scripts + modals allowed in an isolated opaque origin */}
            <div className="flex-1 bg-white min-h-0 overflow-hidden">
              <iframe
                ref={iframeRef}
                key={runCount}
                srcDoc={srcDoc}
                sandbox="allow-scripts allow-modals"
                title="Code Output"
                className="w-full h-full border-0"
              />
            </div>

            {/* Console Output Panel */}
            {consoleLogs.length > 0 && (
              <div className="border-t border-line bg-[var(--code-block-bg)] max-h-[130px] overflow-y-auto shrink-0">
                <div className="flex items-center justify-between px-3 py-1 border-b border-line/30 bg-[var(--code-block-header)]">
                  <span className="text-[9px] uppercase tracking-wider text-faint font-mono font-medium">
                    Console Logs ({consoleLogs.length})
                  </span>
                  <button
                    onClick={() => setConsoleLogs([])}
                    className="text-[9px] text-faint hover:text-mute font-mono"
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

/* ─── Code Block with Copy + Run buttons (Always present for ALL code) ─── */
function CodeBlock({ lang, code }: { lang: string; code: string }) {
  const [copied, setCopied] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <div className="code-block-container group/code my-2.5 overflow-x-auto rounded-lg border border-line relative shadow-sm">
        {/* Header bar with language + Run & Copy buttons for every code */}
        <div className="flex items-center justify-between px-3 py-1.5 border-b border-line/50 bg-[var(--code-block-header)]">
          <span className="text-[10px] uppercase tracking-wider text-mute font-mono font-semibold">
            {lang || "code"}
          </span>
          <div className="flex items-center gap-1.5">
            {/* Run button — unconditionally rendered for EVERY code block */}
            <button
              onClick={() => setShowPreview(true)}
              className="flex items-center gap-1 rounded bg-mint/10 border border-mint/30 px-2 py-0.5 text-[10px] font-mono font-medium text-mint hover:bg-mint hover:text-white transition-colors"
              title="Run and interact with this code live"
            >
              <Play size={10} className="fill-current" />
              <span>Run</span>
            </button>
            {/* Copy button — unconditionally rendered for EVERY code block */}
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 rounded bg-amber/10 border border-amber/30 px-2 py-0.5 text-[10px] font-mono font-medium text-amber hover:bg-amber hover:text-[#0a0908] transition-colors"
              title="Copy code to clipboard"
            >
              {copied ? (
                <>
                  <Check size={10} className="text-mint" />
                  <span className="text-mint">Copied!</span>
                </>
              ) : (
                <>
                  <Copy size={10} />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
        </div>
        {/* Code content */}
        <div className="p-3 bg-[var(--code-block-bg)]">
          <pre className="font-mono text-[11px] text-[var(--code-block-text)] whitespace-pre leading-relaxed overflow-x-auto">
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

  // Custom remote host URL (e.g. Cloudflare tunnel proxy) and optional Bearer token
  const [hostUrl, setHostUrl] = useState(() => {
    try {
      return localStorage.getItem("tejapriyan_host_url") || DEFAULT_HOST;
    } catch {
      return DEFAULT_HOST;
    }
  });
  const [hostToken, setHostToken] = useState(() => {
    try {
      return sessionStorage.getItem("tejapriyan_host_token") || "";
    } catch {
      return "";
    }
  });
  const [localStatus, setLocalStatus] = useState<
    "idle" | "connected" | "missing-model" | "offline" | "permission-prompt" | "permission-denied"
  >("idle");
  const [remoteStatus, setRemoteStatus] = useState<
    "idle" | "connected" | "missing-model" | "unauthorized" | "offline" | "invalid-url"
  >("idle");
  const [showSettings, setShowSettings] = useState(false);
  const [copiedCors, setCopiedCors] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const localAvailableRef = useRef(false);
  const remoteAvailableRef = useRef(false);

  // Check health of local Ollama and/or remote host; verifies tejapriyan exists in /api/tags
  const checkConnections = useCallback(
    async ({
      includeLocal = false,
      includeRemote = true,
    }: { includeLocal?: boolean; includeRemote?: boolean } = {}) => {
      setChecking(true);
      let localOk = localAvailableRef.current;
      let remoteOk = remoteAvailableRef.current;
      const isHttpsPage =
        typeof window !== "undefined" && window.location.protocol === "https:";

      // 1. Check Visitor's Local Ollama on http://localhost:11434 when requested or permitted
      if (includeLocal) {
        const lnaState = await queryLoopbackPermissionSafe(
          typeof navigator !== "undefined" ? navigator.permissions : undefined
        );
        if (isHttpsPage && lnaState === "denied") {
          localOk = false;
          setLocalStatus("permission-denied");
        } else {
          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 1500);
            const fetchInit: RequestInit & { targetAddressSpace?: "loopback" } = {
              method: "GET",
              mode: "cors",
              signal: controller.signal,
            };
            if (isHttpsPage) {
              fetchInit.targetAddressSpace = "loopback";
            }
            const res = await fetch("http://localhost:11434/api/tags", fetchInit);
            clearTimeout(timeoutId);
            if (res.ok) {
              const data = await res.json().catch(() => null);
              if (hasTejapriyanModel(data)) {
                localOk = true;
                setLocalStatus("connected");
              } else {
                localOk = false;
                setLocalStatus("missing-model");
              }
            } else {
              localOk = false;
              setLocalStatus("offline");
            }
          } catch {
            localOk = false;
            setLocalStatus("offline");
          }
        }
      }

      // 2. Check Remote Host PC (authenticated tunnel proxy or configured endpoint)
      if (includeRemote) {
        const rawRemote = hostUrl.trim();
        if (!rawRemote) {
          remoteOk = false;
          setRemoteStatus("idle");
        } else {
          const targetRemote = sanitizeEndpointUrl(rawRemote);
          if (!targetRemote) {
            remoteOk = false;
            setRemoteStatus("invalid-url");
          } else if (targetRemote === "http://localhost:11434") {
            remoteOk = false;
            setRemoteStatus("idle");
          } else {
            try {
              const controller = new AbortController();
              const timeoutId = setTimeout(() => controller.abort(), 2500);
              const headers: Record<string, string> = {};
              if (hostToken.trim()) {
                headers.Authorization = `Bearer ${hostToken.trim()}`;
              }
              const fetchInit: RequestInit & { targetAddressSpace?: "loopback" } = {
                method: "GET",
                headers,
                signal: controller.signal,
              };
              if (isHttpsPage && isLoopbackEndpoint(targetRemote)) {
                fetchInit.targetAddressSpace = "loopback";
              }
              const res = await fetch(`${targetRemote}/api/tags`, fetchInit);
              clearTimeout(timeoutId);
              if (res.status === 401 || res.status === 403) {
                remoteOk = false;
                setRemoteStatus("unauthorized");
              } else if (res.ok) {
                const data = await res.json().catch(() => null);
                if (hasTejapriyanModel(data)) {
                  remoteOk = true;
                  setRemoteStatus("connected");
                } else {
                  remoteOk = false;
                  setRemoteStatus("missing-model");
                }
              } else {
                remoteOk = false;
                setRemoteStatus("offline");
              }
            } catch {
              remoteOk = false;
              setRemoteStatus("offline");
            }
          }
        }
      }

      localAvailableRef.current = localOk;
      remoteAvailableRef.current = remoteOk;
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
    },
    [hostUrl, hostToken]
  );

  // Initial connection check once on mount: no 30s background polling on HTTPS origins
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const lnaState = await queryLoopbackPermissionSafe(
        typeof navigator !== "undefined" ? navigator.permissions : undefined
      );
      if (cancelled) return;
      const protocol = typeof window !== "undefined" ? window.location.protocol : "https:";
      const hostname = typeof window !== "undefined" ? window.location.hostname : "";
      const autoLocal = shouldAutoCheckLocal({
        protocol,
        hostname,
        loopbackPermission: lnaState,
      });

      if (!autoLocal && protocol === "https:") {
        setLocalStatus(lnaState === "denied" ? "permission-denied" : "permission-prompt");
      }

      const hasInitialRemote = Boolean(hostUrl.trim());
      if (autoLocal || hasInitialRemote) {
        await checkConnections({ includeLocal: autoLocal, includeRemote: hasInitialRemote });
      }
    })();
    return () => {
      cancelled = true;
    };
    // Run only once on mount so typing in Node Settings does not trigger probes per keystroke
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    try {
      localStorage.setItem("tejapriyan_host_url", trimmed);
    } catch {
      // ignore storage errors
    }
  };

  const handleSaveToken = (newToken: string) => {
    const trimmed = newToken.trim();
    setHostToken(trimmed);
    try {
      if (trimmed) {
        sessionStorage.setItem("tejapriyan_host_token", trimmed);
      } else {
        sessionStorage.removeItem("tejapriyan_host_token");
      }
    } catch {
      // ignore storage errors
    }
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
    const now = new Date();
    const dayNames = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    const monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    const dayName = dayNames[now.getDay()];
    const monthName = monthNames[now.getMonth()];
    const dateNum = now.getDate();
    const yearNum = now.getFullYear();
    const currentDateStr = `${dayName}, ${monthName} ${dateNum}, ${yearNum}`;
    const currentTimeStr = now.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });

    const apiMessages = promptHistory
      .filter((m) => m.text.trim())
      .map((m, idx, arr) => {
        let content = m.text;
        // If this is the latest user message and asks for date/time, attach real-time clock context
        if (idx === arr.length - 1 && m.role === "user") {
          const lower = m.text.toLowerCase();
          if (
            lower.includes("date") ||
            lower.includes("time") ||
            lower.includes("today") ||
            lower.includes("year")
          ) {
            content = `${m.text}\n[System Clock Context: Today's real-world date is ${currentDateStr}, and local time is ${currentTimeStr}]`;
          }
        }
        return {
          role: m.role === "bot" ? "assistant" : "user",
          content,
        };
      });

    const cleanEndpoint = sanitizeEndpointUrl(endpoint);
    if (!cleanEndpoint) {
      throw new Error("Invalid Ollama endpoint URL");
    }

    const isHttpsPage =
      typeof window !== "undefined" && window.location.protocol === "https:";
    const isLoopback = isLoopbackEndpoint(cleanEndpoint);
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (!isLoopback && hostToken.trim()) {
      headers.Authorization = `Bearer ${hostToken.trim()}`;
    }

    const fetchInit: RequestInit & { targetAddressSpace?: "loopback" } = {
      method: "POST",
      headers,
      body: JSON.stringify({
        model: "tejapriyan",
        messages: [
          {
            role: "system",
            content: `You are Tejapriyan, a personal AI model created and fine-tuned by Teja Priyan.
Today's actual real-world date is ${currentDateStr} (Year ${yearNum}).
The current local time is ${currentTimeStr}.
When asked about today's date, day, month, year, or time, always answer with this real-world date (${currentDateStr}).
Answer helpfully, accurately, and concisely. When writing code, provide complete, runnable code in markdown code blocks. If asked for SQL, explain the reasoning first in <think> tags.`,
          },
          ...apiMessages,
        ],
        stream: true,
      }),
    };
    if (isHttpsPage && isLoopback) {
      fetchInit.targetAddressSpace = "loopback";
    }

    const res = await fetch(`${cleanEndpoint}/api/chat`, fetchInit);

    if (!res.ok || !res.body) {
      throw new Error(`Ollama responded with status ${res.status}`);
    }

    let fullText = "";
    await consumeOllamaNdjsonStream(res.body, (parsed) => {
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
    });

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
    const origin =
      typeof window !== "undefined" && window.location.origin
        ? window.location.origin
        : "https://tejapriyan-ai-model.vercel.app";
    navigator.clipboard.writeText(`$env:OLLAMA_ORIGINS="${origin}" ; ollama serve`);
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
                  <span className="text-mute">Scripted demo (not model inference)</span>
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
                      : localStatus === "missing-model"
                      ? "bg-amber/20 text-amber font-semibold"
                      : "bg-panel text-faint"
                  )}
                >
                  {localAvailable
                    ? "CONNECTED"
                    : localStatus === "missing-model"
                    ? "MODEL MISSING"
                    : localStatus === "permission-denied"
                    ? "BLOCKED"
                    : localStatus === "permission-prompt"
                    ? "ON REQUEST"
                    : "OFFLINE"}
                </span>
              </div>
              <p className="text-[11px] leading-relaxed mb-2 text-mute">
                Run <code className="text-amber">ollama run tejapriyan</code> on your machine. (Need setup?{" "}
                <a
                  href="#install"
                  onClick={() => setShowSettings(false)}
                  className="text-amber underline hover:text-amber/80"
                >
                  See install steps
                </a>
                )
              </p>
              {localStatus === "missing-model" && (
                <p className="text-[10px] font-mono text-amber mb-2">
                  Ollama is running, but the <code>tejapriyan</code> model was not found in <code>/api/tags</code>.
                </p>
              )}
              {localStatus === "permission-denied" && (
                <p className="text-[10px] font-mono text-crimson mb-2">
                  Loopback network permission is denied in browser Site settings. Allow it and click Check Local.
                </p>
              )}
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  onClick={() => checkConnections({ includeLocal: true, includeRemote: false })}
                  disabled={checking}
                  className="rounded bg-amber/20 border border-amber/40 px-2 py-0.5 text-[10px] font-mono font-semibold text-amber hover:bg-amber hover:text-panel disabled:opacity-40"
                >
                  {checking ? "Checking..." : "Check Local"}
                </button>
                <button
                  onClick={copyCorsCmd}
                  className="flex items-center gap-1 text-[10px] font-mono text-faint hover:text-amber bg-raise rounded border border-line px-1.5 py-0.5"
                  title="Copy origin-scoped CORS start command"
                >
                  {copiedCors ? (
                    <Check size={10} className="text-mint" />
                  ) : (
                    <Copy size={10} />
                  )}
                  <span>{copiedCors ? "Copied Command!" : "Copy CORS Start Command"}</span>
                </button>
              </div>
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
                      : remoteStatus === "unauthorized"
                      ? "bg-amber/20 text-amber font-semibold"
                      : "bg-panel text-faint"
                  )}
                >
                  {remoteAvailable
                    ? "ONLINE"
                    : remoteStatus === "unauthorized"
                    ? "TOKEN REQUIRED"
                    : remoteStatus === "missing-model"
                    ? "MODEL MISSING"
                    : "STANDBY"}
                </span>
              </div>
              <p className="text-[11px] leading-relaxed mb-2 text-mute">
                Enter your authenticated tunnel URL and token from <code className="text-amber">share-live-model</code>:
              </p>
              <div className="space-y-1.5">
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    value={hostUrl}
                    onChange={(e) => handleSaveHost(e.target.value)}
                    placeholder="https://xxxx.trycloudflare.com"
                    className="w-full rounded border border-line bg-panel px-2 py-1 font-mono text-[10px] text-ink outline-none focus:border-amber/60"
                  />
                  <button
                    onClick={() => checkConnections({ includeLocal: false, includeRemote: true })}
                    disabled={checking}
                    className="rounded bg-amber/20 border border-amber/40 px-2 py-1 text-[10px] font-mono font-semibold text-amber hover:bg-amber hover:text-panel disabled:opacity-40 shrink-0"
                  >
                    {checking ? "Checking..." : "Test"}
                  </button>
                </div>
                <input
                  type="password"
                  value={hostToken}
                  onChange={(e) => handleSaveToken(e.target.value)}
                  placeholder="Bearer access token (printed by share-live-model)"
                  className="w-full rounded border border-line bg-panel px-2 py-1 font-mono text-[10px] text-ink outline-none focus:border-amber/60"
                />
                {remoteStatus === "unauthorized" && (
                  <p className="text-[10px] font-mono text-amber">
                    Authentication required — enter the Bearer token printed by share-live-model.
                  </p>
                )}
                {remoteStatus === "invalid-url" && (
                  <p className="text-[10px] font-mono text-crimson">
                    Enter a valid http:// or https:// endpoint URL.
                  </p>
                )}
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
                  : "Scripted demonstration"}
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
                ? "Streaming from local Ollama (localhost:11434)..."
                : activeMode === "remote"
                ? "Streaming from Teja's Live Host PC..."
                : "Preparing a scripted example..."}
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
