#!/usr/bin/env node

import http from "node:http";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { Readable } from "node:stream";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);

export const DEFAULT_ALLOWED_ORIGINS = [
  "https://tejapriyan-ai-model.vercel.app",
  "https://tejapriyan.vercel.app",
  "https://tejapriyan.github.io",
];

const LOOPBACK_ORIGIN_RE = /^https?:\/\/(localhost|127\.0\.0\.1)(?::\d+)?$/i;
const TEJAPRIYAN_MODEL_RE = /^(?:(?:hf\.co\/)?teja161615\/)?tejapriyan(?:[-:][\w.-]+)?$/i;
const MAX_BODY_BYTES = 1024 * 1024;

export function parseAllowedOrigins(envValue = process.env.TEJAPRIYAN_ALLOWED_ORIGINS) {
  if (!envValue || !envValue.trim()) return [...DEFAULT_ALLOWED_ORIGINS];
  return envValue
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function isAllowedOrigin(origin, allowedOrigins = DEFAULT_ALLOWED_ORIGINS) {
  if (!origin || typeof origin !== "string") return false;
  if (LOOPBACK_ORIGIN_RE.test(origin)) return true;
  return allowedOrigins.includes(origin);
}

export function isAllowedTejapriyanModel(modelName) {
  return typeof modelName === "string" && TEJAPRIYAN_MODEL_RE.test(modelName.trim());
}

export function verifyBearerToken(authHeader, expectedToken) {
  if (typeof authHeader !== "string" || typeof expectedToken !== "string" || !expectedToken) {
    return false;
  }
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  if (!match) return false;
  const providedDigest = crypto.createHash("sha256").update(match[1].trim()).digest();
  const expectedDigest = crypto.createHash("sha256").update(expectedToken).digest();
  return crypto.timingSafeEqual(providedDigest, expectedDigest);
}

function writeJson(res, statusCode, payload, extraHeaders = {}) {
  const body = JSON.stringify(payload);
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "X-Content-Type-Options": "nosniff",
    "Cache-Control": "no-store",
    ...extraHeaders,
  });
  res.end(body);
}

async function readJsonBody(req, maxBytes = MAX_BODY_BYTES) {
  const chunks = [];
  let total = 0;
  for await (const chunk of req) {
    total += chunk.length;
    if (total > maxBytes) {
      const err = new Error("Payload too large");
      err.statusCode = 413;
      throw err;
    }
    chunks.push(chunk);
  }
  const raw = Buffer.concat(chunks).toString("utf8");
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      const err = new Error("Expected JSON object");
      err.statusCode = 400;
      throw err;
    }
    return parsed;
  } catch (cause) {
    if (cause.statusCode) throw cause;
    const err = new Error("Invalid JSON body");
    err.statusCode = 400;
    throw err;
  }
}

export function createOllamaProxyHandler(options = {}) {
  const upstreamUrl = String(options.upstreamUrl || "http://127.0.0.1:11434").replace(/\/+$/, "");
  const token = String(options.token || "");
  const allowedOrigins = options.allowedOrigins || parseAllowedOrigins();
  const maxBodyBytes = options.maxBodyBytes || MAX_BODY_BYTES;
  const fetchImpl = options.fetchImpl || fetch;

  return async (req, res) => {
    const origin = req.headers.origin;
    const corsHeaders = {
      Vary: "Origin",
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "no-store",
    };

    if (origin && isAllowedOrigin(origin, allowedOrigins)) {
      corsHeaders["Access-Control-Allow-Origin"] = origin;
    }

    if (req.method === "OPTIONS") {
      res.writeHead(204, {
        ...corsHeaders,
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Max-Age": "600",
      });
      res.end();
      return;
    }

    if (!verifyBearerToken(req.headers.authorization, token)) {
      writeJson(
        res,
        401,
        { error: "Unauthorized: valid Bearer token required" },
        { ...corsHeaders, "WWW-Authenticate": "Bearer" }
      );
      return;
    }

    let pathname = "/";
    try {
      pathname = new URL(req.url || "/", "http://127.0.0.1").pathname;
    } catch {
      writeJson(res, 400, { error: "Invalid request URL" }, corsHeaders);
      return;
    }

    if (req.method === "GET" && pathname === "/api/tags") {
      try {
        const upstreamRes = await fetchImpl(`${upstreamUrl}/api/tags`, { method: "GET" });
        if (!upstreamRes.ok) {
          writeJson(
            res,
            502,
            { error: `Upstream Ollama returned HTTP ${upstreamRes.status}` },
            corsHeaders
          );
          return;
        }
        const data = await upstreamRes.json();
        const models = Array.isArray(data?.models)
          ? data.models.filter((m) =>
              isAllowedTejapriyanModel(m?.name || m?.model || "")
            )
          : [];
        writeJson(res, 200, { models }, corsHeaders);
      } catch (err) {
        writeJson(res, 502, { error: `Upstream error: ${err.message}` }, corsHeaders);
      }
      return;
    }

    if (req.method === "POST" && pathname === "/api/chat") {
      let body;
      try {
        body = await readJsonBody(req, maxBodyBytes);
      } catch (err) {
        writeJson(res, err.statusCode || 400, { error: err.message }, corsHeaders);
        return;
      }

      if (!isAllowedTejapriyanModel(body.model)) {
        writeJson(
          res,
          403,
          { error: "Only the tejapriyan model is permitted via this proxy" },
          corsHeaders
        );
        return;
      }

      if (!Array.isArray(body.messages)) {
        writeJson(res, 400, { error: "messages array is required" }, corsHeaders);
        return;
      }

      const forwardBody = {
        model: body.model.trim(),
        messages: body.messages,
        stream: body.stream !== false,
      };
      if (body.options && typeof body.options === "object" && !Array.isArray(body.options)) {
        forwardBody.options = body.options;
      }

      const abortController = new AbortController();
      res.on("close", () => {
        if (!res.writableFinished) abortController.abort();
      });

      try {
        const upstreamRes = await fetchImpl(`${upstreamUrl}/api/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(forwardBody),
          signal: abortController.signal,
        });

        res.writeHead(upstreamRes.status, {
          ...corsHeaders,
          "Content-Type":
            upstreamRes.headers.get("content-type") || "application/x-ndjson; charset=utf-8",
        });

        if (!upstreamRes.body) {
          res.end();
          return;
        }

        const nodeStream =
          typeof upstreamRes.body.getReader === "function"
            ? Readable.fromWeb(upstreamRes.body)
            : upstreamRes.body;
        nodeStream.on("error", () => {
          if (!res.writableEnded) res.end();
        });
        nodeStream.pipe(res);
      } catch (err) {
        if (!res.headersSent) {
          writeJson(res, 502, { error: `Upstream error: ${err.message}` }, corsHeaders);
        } else if (!res.writableEnded) {
          res.end();
        }
      }
      return;
    }

    writeJson(
      res,
      403,
      { error: "Endpoint not permitted via tunnel proxy" },
      corsHeaders
    );
  };
}

export async function startOllamaProxy(options = {}) {
  const token =
    options.token ||
    process.env.TEJAPRIYAN_TUNNEL_TOKEN ||
    crypto.randomBytes(24).toString("base64url");
  const port = Number(options.port ?? process.env.TEJAPRIYAN_PROXY_PORT ?? 11435);
  const host = "127.0.0.1";
  const handler = createOllamaProxyHandler({ ...options, token });
  const server = http.createServer(handler);

  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, host, resolve);
  });

  const address = server.address();
  const actualPort = typeof address === "object" && address ? address.port : port;
  return {
    server,
    host,
    port: actualPort,
    token,
    close: () => new Promise((resolve) => server.close(() => resolve())),
  };
}

const isEntryPoint = (() => {
  if (!process.argv[1]) return false;
  try {
    return fs.realpathSync(process.argv[1]) === fs.realpathSync(__filename);
  } catch {
    return path.resolve(process.argv[1]) === path.resolve(__filename);
  }
})();

if (isEntryPoint) {
  const { port, token, close } = await startOllamaProxy();
  console.log(`TEJAPRIYAN_PROXY_READY port=${port}`);
  console.log(`TEJAPRIYAN_PROXY_TOKEN=${token}`);
  const shutdown = async () => {
    await close();
    process.exit(0);
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}
