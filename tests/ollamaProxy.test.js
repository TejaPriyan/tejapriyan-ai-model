import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  isAllowedOrigin,
  isAllowedTejapriyanModel,
  startOllamaProxy,
  verifyBearerToken,
} from "../scripts/ollama-proxy.js";

describe("scripts/ollama-proxy.js authentication, path filtering, and CORS", () => {
  it("validates allowed origins and models strictly", () => {
    assert.equal(isAllowedOrigin("https://tejapriyan-ai-model.vercel.app"), true);
    assert.equal(isAllowedOrigin("https://tejapriyan.github.io"), true);
    assert.equal(isAllowedOrigin("http://localhost:5173"), true);
    assert.equal(isAllowedOrigin("https://evil.example"), false);

    assert.equal(isAllowedTejapriyanModel("tejapriyan"), true);
    assert.equal(isAllowedTejapriyanModel("tejapriyan:latest"), true);
    assert.equal(isAllowedTejapriyanModel("hf.co/teja161615/Tejapriyan-8B-GGUF"), true);
    assert.equal(isAllowedTejapriyanModel("llama3:latest"), false);

    assert.equal(verifyBearerToken("Bearer secret-123", "secret-123"), true);
    assert.equal(verifyBearerToken("Bearer wrong", "secret-123"), false);
    assert.equal(verifyBearerToken(undefined, "secret-123"), false);
  });

  it("enforces Bearer auth, filters /api/tags, restricts /api/chat model, and blocks /api/pull & /api/delete", async () => {
    const token = "test-tunnel-token-xyz";
    const proxy = await startOllamaProxy({
      port: 0,
      token,
      fetchImpl: async (url, init) => {
        if (url.endsWith("/api/tags")) {
          return new Response(
            JSON.stringify({
              models: [
                { name: "tejapriyan:latest" },
                { name: "private-internal-model:latest" },
              ],
            }),
            { status: 200, headers: { "Content-Type": "application/json" } }
          );
        }
        if (url.endsWith("/api/chat")) {
          const parsed = JSON.parse(init.body);
          return new Response(
            JSON.stringify({ message: { content: `ok:${parsed.model}` }, done: true }) + "\n",
            { status: 200, headers: { "Content-Type": "application/x-ndjson" } }
          );
        }
        return new Response("unexpected", { status: 500 });
      },
    });

    try {
      const base = `http://127.0.0.1:${proxy.port}`;

      // Unauthenticated request -> 401
      const unauth = await fetch(`${base}/api/tags`);
      assert.equal(unauth.status, 401);

      // Disallowed endpoints -> 403
      for (const [method, endpoint] of [
        ["POST", "/api/pull"],
        ["DELETE", "/api/delete"],
        ["POST", "/api/create"],
        ["POST", "/api/generate"],
        ["POST", "/v1/chat/completions"],
      ]) {
        const blocked = await fetch(`${base}${endpoint}`, {
          method,
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({ name: "anything" }),
        });
        assert.equal(blocked.status, 403, `Expected 403 for ${method} ${endpoint}`);
      }

      // Allowed GET /api/tags filters out unrelated models and reflects allowed CORS origin
      const tagsRes = await fetch(`${base}/api/tags`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Origin: "https://tejapriyan.github.io",
        },
      });
      assert.equal(tagsRes.status, 200);
      assert.equal(tagsRes.headers.get("access-control-allow-origin"), "https://tejapriyan.github.io");
      const tagsData = await tagsRes.json();
      assert.deepEqual(tagsData, { models: [{ name: "tejapriyan:latest" }] });

      // Disallowed origin does not receive Access-Control-Allow-Origin
      const evilOriginRes = await fetch(`${base}/api/tags`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Origin: "https://attacker.example",
        },
      });
      assert.equal(evilOriginRes.headers.get("access-control-allow-origin"), null);

      // Disallowed model on /api/chat -> 403
      const badModelRes = await fetch(`${base}/api/chat`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: "llama3", messages: [{ role: "user", content: "hi" }] }),
      });
      assert.equal(badModelRes.status, 403);

      // Allowed model on /api/chat -> 200 stream
      const chatRes = await fetch(`${base}/api/chat`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "tejapriyan",
          messages: [{ role: "user", content: "hi" }],
          stream: true,
        }),
      });
      assert.equal(chatRes.status, 200);
      const chatText = await chatRes.text();
      assert.ok(chatText.includes("ok:tejapriyan"));
    } finally {
      await proxy.close();
    }
  });
});
