import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

describe("Repository hygiene, security, and packaging invariants", () => {
  it("uses relative favicon paths in index.html matching vite base ./", () => {
    const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
    assert.ok(html.includes('href="./favicon.ico"'));
    assert.ok(html.includes('href="./favicon-32x32.png"'));
    assert.ok(html.includes('href="./favicon.svg"'));
    assert.ok(html.includes('href="./apple-touch-icon.png"'));
    assert.ok(!html.includes('href="/favicon'));
    assert.ok(!html.includes('href="/apple-touch-icon.png"'));
  });

  it("keeps public/google*.html and removes duplicate root google87bb3bc53ec346d2.html & packaging/Modelfile", () => {
    assert.equal(fs.existsSync(path.join(root, "public/google2af4e1ed3191321d.html")), true);
    assert.equal(fs.existsSync(path.join(root, "public/google87bb3bc53ec346d2.html")), true);
    assert.equal(fs.existsSync(path.join(root, "Modelfile")), true);
    assert.equal(fs.existsSync(path.join(root, "google87bb3bc53ec346d2.html")), false);
    assert.equal(fs.existsSync(path.join(root, "packaging/Modelfile")), false);
  });

  it("removes unbacked reproducible via eval/ claim in ModelCard.tsx", () => {
    const modelCard = fs.readFileSync(path.join(root, "src/components/ModelCard.tsx"), "utf8");
    assert.ok(!modelCard.includes("reproducible via eval/"));
  });

  it("sandboxes CodePlayground iframe without allow-same-origin and avoids background localhost polling", () => {
    const chatDemo = fs.readFileSync(path.join(root, "src/components/ChatDemo.tsx"), "utf8");
    assert.ok(chatDemo.includes('sandbox="allow-scripts allow-modals"'));
    assert.ok(!chatDemo.includes("allow-same-origin"));
    assert.ok(!chatDemo.includes("setInterval(checkConnections"));
  });

  it("configures package.json files allowlist and test script", () => {
    const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
    assert.equal(pkg.scripts.test, "node --test");
    assert.ok(Array.isArray(pkg.files));
    assert.ok(pkg.files.includes("bin"));
    assert.ok(pkg.files.includes("Modelfile"));
    assert.ok(!pkg.files.includes("src"));
    assert.ok(!pkg.files.includes("share-live-model.ps1"));
  });

  it("secures share-live-model scripts without OLLAMA_ORIGINS=* or raw 11434 tunnel", () => {
    const ps1 = fs.readFileSync(path.join(root, "share-live-model.ps1"), "utf8");
    const bat = fs.readFileSync(path.join(root, "share-live-model.bat"), "utf8");
    assert.ok(!ps1.includes("OLLAMA_ORIGINS"));
    assert.ok(!bat.includes("OLLAMA_ORIGINS"));
    assert.ok(!ps1.includes("11434"));
    assert.ok(!bat.includes("11434"));
    assert.ok(ps1.includes("D5C1D82031DA6253DCDCFF64C944CD0FE063016EDEB2E4FD088075FC9BD52D0A"));
    assert.ok(ps1.includes("ollama-proxy.js"));
  });
});
