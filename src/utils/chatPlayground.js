const LOCALHOST_SUFFIX = ".localhost";

/**
 * Escapes closing `</script` sequences in inline JavaScript so user/AI code
 * cannot break out of a `<script>` element inside generated `srcDoc` HTML.
 */
export function escapeInlineScriptTag(code) {
  return String(code).replace(/<\/(script)/gi, "<\\/$1");
}

/**
 * Escapes closing `</style` sequences in inline CSS so user/AI styles
 * cannot break out of a `<style>` element inside generated `srcDoc` HTML.
 */
export function escapeInlineStyleTag(code) {
  return String(code).replace(/<\/(style)/gi, "\\3c/$1");
}

/**
 * Validates `postMessage` events coming from the sandboxed CodePlayground iframe.
 * Requires exact window reference match and an opaque `"null"` origin produced
 * by `sandbox="allow-scripts allow-modals"` (without `allow-same-origin`).
 */
export function isTrustedIframeMessage(event, expectedWindow) {
  if (!event || !expectedWindow) return false;
  if (event.source !== expectedWindow) return false;
  return event.origin === "null";
}

/**
 * Checks whether an Ollama `/api/tags` payload includes a Tejapriyan model.
 */
export function hasTejapriyanModel(data) {
  if (!data || typeof data !== "object") return false;
  const models = data.models;
  if (!Array.isArray(models)) return false;
  return models.some((entry) => {
    if (!entry || typeof entry !== "object") return false;
    const name = typeof entry.name === "string" ? entry.name : "";
    const model = typeof entry.model === "string" ? entry.model : "";
    const combined = `${name} ${model}`.toLowerCase();
    return /(?:^|\/|\s)tejapriyan(?::|$|\s|-)|teja161615/.test(combined);
  });
}

/**
 * Consumes an Ollama NDJSON ReadableStream body and flushes any trailing line
 * remaining in the buffer when the stream ends without a trailing newline.
 */
export async function consumeOllamaNdjsonStream(body, onParsedLine) {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  const handleLine = (line) => {
    const trimmed = line.trim();
    if (!trimmed) return;
    try {
      const parsed = JSON.parse(trimmed);
      onParsedLine(parsed);
    } catch {
      // Ignore malformed/partial JSON line
    }
  };

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      handleLine(line);
    }
  }

  buffer += decoder.decode();
  if (buffer.trim()) {
    for (const line of buffer.split("\n")) {
      handleLine(line);
    }
  }
}

export function isLoopbackHostname(hostname) {
  const h = String(hostname ?? "").toLowerCase();
  return (
    h === "localhost" ||
    h === "127.0.0.1" ||
    h === "[::1]" ||
    h === "::1" ||
    h.endsWith(LOCALHOST_SUFFIX)
  );
}

export function isLoopbackEndpoint(raw) {
  try {
    const parsed = new URL(String(raw ?? ""));
    return isLoopbackHostname(parsed.hostname);
  } catch {
    return false;
  }
}

export function sanitizeEndpointUrl(raw) {
  const trimmed = String(raw ?? "").trim().replace(/\/+$/, "");
  if (!trimmed) return "";
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return "";
    }
    return (parsed.origin + parsed.pathname).replace(/\/+$/, "");
  } catch {
    return "";
  }
}

/**
 * Queries only the granular `loopback-network` permission (never legacy
 * `local-network-access`), falling back to `prompt` if unsupported.
 */
export async function queryLoopbackPermissionSafe(permissionsObj) {
  if (!permissionsObj || typeof permissionsObj.query !== "function") {
    return "prompt";
  }
  try {
    const status = await permissionsObj.query({ name: "loopback-network" });
    return status?.state ?? "prompt";
  } catch {
    return "prompt";
  }
}

export function shouldAutoCheckLocal({ protocol, hostname, loopbackPermission }) {
  if (protocol === "http:" && isLoopbackHostname(hostname)) {
    return true;
  }
  if (protocol === "https:" && loopbackPermission === "granted") {
    return true;
  }
  return false;
}

/**
 * Builds the HTML `srcDoc` document for the sandboxed CodePlayground iframe.
 */
export function buildPlaygroundHtml(code, currentLang) {
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
  window.onerror = function(msg, src, line) {
    send('error', [msg + (line ? ' (line ' + line + ')' : '')]);
  };
})();
<\/script>`;

  if (currentLang === "javascript") {
    const safeJs = escapeInlineScriptTag(code);
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
        ${safeJs}
      } catch (err) {
        var errText = err && err.message ? err.message : String(err);
        console.error(errText);
        var errBox = document.createElement('div');
        errBox.className = 'runtime-err';
        var errLabel = document.createElement('strong');
        errLabel.textContent = '❌ Script Error: ';
        errBox.appendChild(errLabel);
        errBox.appendChild(document.createTextNode(errText));
        document.body.appendChild(errBox);
      }
    })();
  <\/script>
</body>
</html>`;
  }

  if (currentLang === "python") {
    const serializedPython = JSON.stringify(code).replace(/</g, "\\u003c");
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
      outBox.appendChild(document.createTextNode(text));
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
        return Sk.importMainWithBody("<stdin>", false, ${serializedPython}, true);
      }).catch(function(err) {
        var errSpan = document.createElement('span');
        errSpan.className = 'py-err';
        errSpan.textContent = '\\n❌ Python Error: ' + String(err);
        outBox.appendChild(errSpan);
        console.error(String(err));
      });
    } else {
      outBox.textContent = "Connecting to Python engine...\\nIf running offline, connect to internet for Skulpt Python engine.";
    }
  <\/script>
</body>
</html>`;
  }

  if (currentLang === "css") {
    const safeCss = escapeInlineStyleTag(code);
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; padding: 20px; margin: 0; background: #fff; color: #1a1a1a; }
    .demo-box { max-width: 600px; margin: 0 auto; }
    ${safeCss}
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

  if (/<html\b|<!doctype\b/i.test(code)) {
    if (/<head[^>]*>/i.test(code)) {
      return code.replace(/<head[^>]*>/i, (match) => match + consoleCapture);
    }
    return consoleCapture + code;
  }

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
}
