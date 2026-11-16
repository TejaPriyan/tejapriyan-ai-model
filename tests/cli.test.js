import { describe, it } from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import {
  EXPECTED_GGUF_SHA256,
  EXPECTED_GGUF_SIZE,
  ROOT_DIR,
  buildModelfileContent,
  buildOllamaModel,
  checkOllamaServer,
  consumeNdjsonStream,
  downloadGguf,
  getWebDashboardGuidance,
  hasTejapriyanModel,
  launchWebDashboard,
  resolveLocalViteBin,
  verifyFileSha256,
} from "../bin/cli.js";

describe("bin/cli.js GGUF download & SHA-256 verification", () => {
  it("downloads and verifies SHA-256 cleanly and leaves no .part file", async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "tejapriyan-cli-ok-"));
    try {
      const payload = Buffer.from("GGUF_TEST_BINARY_PAYLOAD_123456");
      const sha256 = crypto.createHash("sha256").update(payload).digest("hex");
      const targetPath = path.join(tmpDir, "folder with spaces", "tejapriyan-q4_k_m.gguf");

      const ok = await downloadGguf(targetPath, {
        url: "https://example.test/model.gguf",
        expectedSize: payload.length,
        expectedSha256: sha256,
        fetchImpl: async () =>
          new Response(payload, {
            status: 200,
            headers: { "content-length": String(payload.length) },
          }),
      });

      assert.equal(ok, true);
      assert.equal(fs.existsSync(targetPath), true);
      assert.equal(fs.existsSync(`${targetPath}.part`), false);
      assert.deepEqual(fs.readFileSync(targetPath), payload);

      const verified = await verifyFileSha256(targetPath, sha256, payload.length);
      assert.equal(verified.valid, true);
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it("cleans partial files on checksum mismatch and stream failure", async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "tejapriyan-cli-fail-"));
    try {
      const payload = Buffer.from("corrupted-bytes");
      const targetPath = path.join(tmpDir, "tejapriyan-q4_k_m.gguf");

      const okMismatch = await downloadGguf(targetPath, {
        url: "https://example.test/bad.gguf",
        expectedSize: payload.length,
        expectedSha256: "0".repeat(64),
        fetchImpl: async () => new Response(payload, { status: 200 }),
      });

      assert.equal(okMismatch, false);
      assert.equal(fs.existsSync(targetPath), false);
      assert.equal(fs.existsSync(`${targetPath}.part`), false);

      const failingStream = new ReadableStream({
        start(controller) {
          controller.enqueue(new Uint8Array([1, 2, 3]));
          controller.error(new Error("Simulated network reset"));
        },
      });
      const okError = await downloadGguf(targetPath, {
        url: "https://example.test/reset.gguf",
        expectedSize: 100,
        expectedSha256: "0".repeat(64),
        fetchImpl: async () => new Response(failingStream, { status: 200 }),
      });

      assert.equal(okError, false);
      assert.equal(fs.existsSync(targetPath), false);
      assert.equal(fs.existsSync(`${targetPath}.part`), false);
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it("pins expected GGUF size and SHA-256 constants", () => {
    assert.equal(EXPECTED_GGUF_SIZE, 4683073536);
    assert.match(EXPECTED_GGUF_SHA256, /^[a-f0-9]{64}$/);
  });
});

describe("bin/cli.js Ollama checks, streaming, Modelfile, and --web", () => {
  it("verifies tejapriyan in checkOllamaServer", async () => {
    assert.equal(hasTejapriyanModel({ models: [{ name: "tejapriyan:latest" }] }), true);
    assert.equal(hasTejapriyanModel({ models: [{ name: "qwen3:8b" }] }), false);

    const noModel = await checkOllamaServer("http://127.0.0.1:11434", async () =>
      new Response(JSON.stringify({ models: [{ name: "llama3:latest" }] }), { status: 200 })
    );
    assert.deepEqual(noModel, { online: true, hasModel: false, models: ["llama3:latest"] });

    const withModel = await checkOllamaServer("http://127.0.0.1:11434", async () =>
      new Response(JSON.stringify({ models: [{ name: "tejapriyan:latest" }] }), { status: 200 })
    );
    assert.deepEqual(withModel, { online: true, hasModel: true, models: ["tejapriyan:latest"] });
  });

  it("flushes trailing NDJSON buffer without newline in CLI stream consumer", async () => {
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode('{"message":{"content":"Hi "}}\n{"message":{"content":"there"}}'));
        controller.close();
      },
    });
    const chunks = [];
    await consumeNdjsonStream(stream, (c) => chunks.push(c));
    assert.equal(chunks.join(""), "Hi there");
  });

  it("invokes ollama create without shell:true even when path has spaces", async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "Teja Priyan Space Test-"));
    try {
      const ggufPath = path.join(tmpDir, "tejapriyan-q4_k_m.gguf");
      fs.writeFileSync(ggufPath, "dummy");
      let capturedCall = null;
      const ok = await buildOllamaModel(ggufPath, (cmd, args, opts) => {
        capturedCall = { cmd, args, opts };
        return { status: 0 };
      });
      assert.equal(ok, true);
      assert.equal(capturedCall.cmd, "ollama");
      assert.deepEqual(capturedCall.args, ["create", "tejapriyan", "-f", path.join(tmpDir, "Modelfile")]);
      assert.equal(capturedCall.opts.shell, undefined);
      assert.ok(buildModelfileContent(ggufPath).includes('FROM "'));
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it("provides clear guidance when --web runs without vite (e.g. via npx)", () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "tejapriyan-npx-"));
    try {
      assert.equal(resolveLocalViteBin(tmpDir), null);
      const res = launchWebDashboard({ rootDir: tmpDir });
      assert.equal(res.launched, false);
      const guidance = getWebDashboardGuidance();
      assert.ok(guidance.includes("vite"));
      assert.ok(guidance.includes("https://tejapriyan-ai-model.vercel.app"));
      assert.ok(guidance.includes("npm install && npm run dev"));
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it("runs --help and --version cleanly via Node without DEP0190 warnings", () => {
    const help = spawnSync(process.execPath, [path.join(ROOT_DIR, "bin", "cli.js"), "--help"], {
      encoding: "utf8",
    });
    assert.equal(help.status, 0);
    assert.ok(help.stdout.includes("Tejapriyan AI"));

    const version = spawnSync(process.execPath, [path.join(ROOT_DIR, "bin", "cli.js"), "--version"], {
      encoding: "utf8",
    });
    assert.equal(version.status, 0);
    assert.match(version.stdout, /tejapriyan version \d+\.\d+\.\d+/);
  });

  it("does not use shell:true or wildcard OLLAMA_ORIGINS in bin/cli.js", () => {
    const source = fs.readFileSync(path.join(ROOT_DIR, "bin", "cli.js"), "utf8");
    assert.ok(!/\bshell\s*:/.test(source));
    assert.ok(!source.includes('OLLAMA_ORIGINS: "*"'));
  });
});
