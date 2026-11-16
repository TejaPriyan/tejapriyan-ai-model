import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  buildPlaygroundHtml,
  consumeOllamaNdjsonStream,
  escapeInlineScriptTag,
  escapeInlineStyleTag,
  hasTejapriyanModel,
  isLoopbackEndpoint,
  isTrustedIframeMessage,
  queryLoopbackPermissionSafe,
  sanitizeEndpointUrl,
  shouldAutoCheckLocal,
} from "../src/utils/chatPlayground.js";

describe("CodePlayground HTML/XSS hardening", () => {
  it("escapes </script> case-insensitively in inline JS", () => {
    const escaped = escapeInlineScriptTag('const x = "</script><SCRIPT>alert(1)</SCRIPT>";');
    assert.ok(!/<\/script/i.test(escaped));
    assert.ok(escaped.includes("<\\/script"));
    assert.ok(escaped.includes("<\\/SCRIPT"));
  });

  it("escapes </style> case-insensitively in inline CSS", () => {
    const escaped = escapeInlineStyleTag("body { content: '</style></STYLE>'; }");
    assert.ok(!/<\/style/i.test(escaped));
  });

  it("builds JS and Python playground documents without innerHTML or unescaped script tags", () => {
    const jsDoc = buildPlaygroundHtml('const s = "</script><img src=x onerror=alert(1)>";', "javascript");
    assert.ok(!jsDoc.includes("innerHTML"));
    assert.ok(jsDoc.includes("textContent"));
    assert.ok(jsDoc.includes("createTextNode"));
    // Only the two intentional closing script tags (consoleCapture + runner) should exist
    assert.equal(jsDoc.match(/<\/script>/gi)?.length, 2);

    const pyDoc = buildPlaygroundHtml('print("</script><svg onload=alert(1)>")', "python");
    assert.ok(!pyDoc.includes("innerHTML"));
    assert.ok(pyDoc.includes("textContent"));
    assert.ok(pyDoc.includes("\\u003c/script>"));
    assert.ok(pyDoc.includes("'\\n❌ Python Error: '"));
    // 4 closing script tags: consoleCapture, skulpt.min.js, skulpt-stdlib.js, py runner
    assert.equal(pyDoc.match(/<\/script>/gi)?.length, 4);

    const cssDoc = buildPlaygroundHtml("body { color: red; } </style><script>alert(1)</script>", "css");
    assert.equal(cssDoc.match(/<\/style>/gi)?.length, 1);

    const htmlDoc = buildPlaygroundHtml("<!DOCTYPE html><HTML><HEAD><title>$&</title></HEAD><body>hi</body></HTML>", "html");
    assert.ok(htmlDoc.includes("window.parent.postMessage"));
    assert.ok(htmlDoc.includes("<title>$&</title>"));
  });

  it("validates postMessage sender window AND opaque null origin", () => {
    const iframeWin = { name: "sandbox-frame" };
    const otherWin = { name: "other-frame" };

    assert.equal(
      isTrustedIframeMessage({ source: iframeWin, origin: "null" }, iframeWin),
      true
    );
    assert.equal(
      isTrustedIframeMessage({ source: otherWin, origin: "null" }, iframeWin),
      false
    );
    assert.equal(
      isTrustedIframeMessage({ source: iframeWin, origin: "https://evil.example" }, iframeWin),
      false
    );
    assert.equal(
      isTrustedIframeMessage({ source: iframeWin, origin: "null" }, null),
      false
    );
  });
});

describe("Ollama model verification & NDJSON streaming", () => {
  it("verifies tejapriyan exists in /api/tags response", () => {
    assert.equal(hasTejapriyanModel({ models: [{ name: "tejapriyan:latest" }] }), true);
    assert.equal(
      hasTejapriyanModel({ models: [{ model: "hf.co/teja161615/Tejapriyan-8B-GGUF:Q4_K_M" }] }),
      true
    );
    assert.equal(hasTejapriyanModel({ models: [{ name: "llama3:latest" }] }), false);
    assert.equal(hasTejapriyanModel({ models: [] }), false);
    assert.equal(hasTejapriyanModel(null), false);
  });

  it("flushes trailing NDJSON line without newline and split UTF-8 bytes", async () => {
    const encoder = new TextEncoder();
    const part1 = encoder.encode('{"message":{"content":"Hello "},"done":false}\n{"message":{"content":"');
    const boltBytes = encoder.encode("⚡"); // 3-byte UTF-8 char
    const part2 = new Uint8Array([
      ...boltBytes.slice(0, 2),
    ]);
    const part3 = new Uint8Array([
      ...boltBytes.slice(2),
      ...encoder.encode('"},"done":true}'), // NO trailing newline!
    ]);

    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(part1);
        controller.enqueue(part2);
        controller.enqueue(part3);
        controller.close();
      },
    });

    const tokens = [];
    let lastDone = false;
    await consumeOllamaNdjsonStream(stream, (chunk) => {
      if (chunk.message?.content) tokens.push(chunk.message.content);
      lastDone = Boolean(chunk.done);
    });

    assert.equal(tokens.join(""), "Hello ⚡");
    assert.equal(lastDone, true);
  });
});

describe("URL sanitization & LNA auto-probe policy", () => {
  it("sanitizes endpoints and rejects unsafe schemes", () => {
    assert.equal(
      sanitizeEndpointUrl("https://demo.trycloudflare.com///"),
      "https://demo.trycloudflare.com"
    );
    assert.equal(sanitizeEndpointUrl("javascript:alert(1)"), "");
    assert.equal(sanitizeEndpointUrl("file:///etc/passwd"), "");
    assert.equal(isLoopbackEndpoint("http://localhost:11434"), true);
    assert.equal(isLoopbackEndpoint("http://127.0.0.1:11435"), true);
    assert.equal(isLoopbackEndpoint("https://demo.trycloudflare.com"), false);
  });

  it("only queries granular loopback-network permission and avoids HTTPS background probing unless granted", async () => {
    const queriedNames = [];
    const mockPermissions = {
      async query(desc) {
        queriedNames.push(desc.name);
        return { state: "prompt" };
      },
    };
    const state = await queryLoopbackPermissionSafe(mockPermissions);
    assert.equal(state, "prompt");
    assert.deepEqual(queriedNames, ["loopback-network"]);

    const throwingPerms = {
      async query() {
        throw new TypeError("Unknown permission name");
      },
    };
    assert.equal(await queryLoopbackPermissionSafe(throwingPerms), "prompt");

    assert.equal(
      shouldAutoCheckLocal({ protocol: "https:", hostname: "tejapriyan-ai-model.vercel.app", loopbackPermission: "prompt" }),
      false
    );
    assert.equal(
      shouldAutoCheckLocal({ protocol: "https:", hostname: "tejapriyan-ai-model.vercel.app", loopbackPermission: "denied" }),
      false
    );
    assert.equal(
      shouldAutoCheckLocal({ protocol: "https:", hostname: "tejapriyan-ai-model.vercel.app", loopbackPermission: "granted" }),
      true
    );
    assert.equal(
      shouldAutoCheckLocal({ protocol: "http:", hostname: "localhost", loopbackPermission: "prompt" }),
      true
    );
  });
});
