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

  // Build a full HTML document from the code, injecting console capture
  const buildDoc = useCallback(
    (code: string, currentLang: string) => {
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
    send('error', [msg + (line ? ' (line ' + line + ')' : '')]);
  };
})();
<\/script>`;

      // ─── 1. JAVASCRIPT EXECUTION ───
      if (currentLang === "javascript") {
        return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      padding: 16px;
      margin: 0;
      background: #ffffff;
      color: #18181b;
      line-height: 1.5;
    }
    #app, #root, #game, #canvas { margin-bottom: 12px; }
    .status-pill {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 3px 8px;
      background: #ecfdf5;
      color: #059669;
      font-family: ui-monospace, monospace;
      font-size: 11px;
      border-radius: 9999px;
      border: 1px solid #a7f3d0;
      font-weight: 500;
      margin-bottom: 12px;
    }
    .runtime-err {
      margin-top: 14px;
      padding: 12px 14px;
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: 8px;
      color: #dc2626;
      font-family: ui-monospace, monospace;
      font-size: 12px;
      white-space: pre-wrap;
    }
    button {
      cursor: pointer;
      padding: 6px 14px;
      background: #f59e0b;
      color: #000;
      border: none;
      border-radius: 6px;
      font-weight: 600;
      font-size: 13px;
      transition: opacity 0.15s;
    }
    button:hover { opacity: 0.9; }
    input {
      padding: 6px 10px;
      border: 1px solid #d4d4d8;
      border-radius: 6px;
      font-size: 13px;
      margin-right: 6px;
    }
  </style>
  ${consoleCapture}
</head>
<body>
  <div class="status-pill">⚡ JavaScript Runner Active</div>
  <div id="app"></div>
  <div id="root"></div>
  <div id="game"></div>
  <script>
    (function() {
      try {
        ${code}
      } catch (err) {
        console.error(err.message || String(err));
        var errBox = document.createElement('div');
        errBox.className = 'runtime-err';
        errBox.innerHTML = '<strong>❌ Script Error:</strong> ' + (err.message || String(err));
        document.body.appendChild(errBox);
      }
    })();
  <\/script>
</body>
</html>`;
      }

      // ─── 2. PYTHON EXECUTION (SKULPT IN-BROWSER) ───
      if (currentLang === "python") {
        return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <script src="https://cdn.jsdelivr.net/npm/skulpt@1.2.0/dist/skulpt.min.js"><\/script>
  <script src="https://cdn.jsdelivr.net/npm/skulpt@1.2.0/dist/skulpt-stdlib.js"><\/script>
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      padding: 16px;
      margin: 0;
      background: #ffffff;
      color: #18181b;
    }
    .py-status {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-family: sans-serif;
      font-size: 11px;
      font-weight: 600;
      color: #4338ca;
      background: #e0e7ff;
      border: 1px solid #c7d2fe;
      padding: 3px 8px;
      border-radius: 9999px;
      margin-bottom: 12px;
    }
    #py-output {
      background: #09090b;
      color: #f4f4f5;
      padding: 14px;
      border-radius: 8px;
      font-size: 13px;
      line-height: 1.6;
      white-space: pre-wrap;
      word-break: break-word;
      min-height: 90px;
      border: 1px solid #27272a;
    }
    .py-err { color: #f87171; font-weight: bold; }
  </style>
  ${consoleCapture}
</head>
<body>
  <div class="py-status">🐍 Python Live Runner</div>
  <pre id="py-output"></pre>
  <script>
    var outBox = document.getElementById("py-output");
    function outf(text) {
      outBox.textContent += text;
      console.log(text.replace(/\\n$/, ''));
    }
    function builtinRead(x) {
      if (typeof Sk === 'undefined' || Sk.builtinFiles === undefined || Sk.builtinFiles["files"][x] === undefined) {
        throw "File not found: '" + x + "'";
      }
      return Sk.builtinFiles["files"][x];
    }
    if (typeof Sk !== 'undefined') {
      Sk.configure({
        output: outf,
        read: builtinRead,
        inputfun: function(prompt) {
          return window.prompt(prompt || "Enter Python input:");
        },
        inputfunTakesPrompt: true
      });
      Sk.misceval.asyncToPromise(function() {
        return Sk.importMainWithBody("<stdin>", false, ${JSON.stringify(code)}, true);
      }).catch(function(err) {
        outBox.innerHTML += '<span class="py-err">\\n❌ Python Error: ' + err.toString() + '</span>';
        console.error(err.toString());
      });
    } else {
      outBox.textContent = "Connecting to Python engine...\\nIf running offline, connect to internet for Skulpt Python engine.";
    }
  <\/script>
</body>
</html>`;
      }

      // ─── 3. CSS PREVIEW ───
      if (currentLang === "css") {
        return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; padding: 20px; margin: 0; background: #fff; color: #1a1a1a; }
    .demo-box { max-width: 600px; margin: 0 auto; }
    ${code}
  </style>
  ${consoleCapture}
</head>
<body>
  <div class="demo-box">
    <h2>CSS Live Preview</h2>
    <p>This is a paragraph demonstrating your custom CSS styles in real time.</p>
    <button>Sample Button</button>
    <a href="#" style="margin-left: 10px;">Sample Link</a>
    <div style="margin-top: 16px; padding: 12px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <h4>Card Container</h4>
      <p>Inner card content with custom styling applied above.</p>
    </div>
  </div>
</body>
</html>`;
      }

      // ─── 4. HTML (FULL OR PARTIAL) ───
      if (
        code.includes("<html") ||
        code.includes("<!DOCTYPE") ||
        code.includes("<!doctype")
      ) {
        if (/<head[^>]*>/i.test(code)) {
          return code.replace(/<head[^>]*>/i, (match) => match + consoleCapture);
        }
        return consoleCapture + code;
      }

      // Partial HTML snippet — wrap in a clean document
      return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      padding: 16px;
      margin: 0;
      background: #ffffff;
      color: #18181b;
      line-height: 1.5;
    }
    button {
      cursor: pointer;
      padding: 6px 14px;
      background: #f59e0b;
      color: #000;
      border: none;
      border-radius: 6px;
      font-weight: 600;
      font-size: 13px;
    }
    input {
      padding: 6px 10px;
      border: 1px solid #d4d4d8;
      border-radius: 6px;
      font-size: 13px;
      margin-right: 6px;
    }
  </style>
  ${consoleCapture}
</head>
<body>
  ${code}
</body>
</html>`;
    },
    []
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

            {/* Live interactive iframe — no sandbox restriction so alert/prompt/games work */}
            <div className="flex-1 bg-white min-h-0 overflow-hidden">
              <iframe
                ref={iframeRef}
                key={runCount}
                srcDoc={srcDoc}
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

    const cleanEndpoint = endpoint.replace(/\/+$/, "");
    const res = await fetch(`${cleanEndpoint}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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
