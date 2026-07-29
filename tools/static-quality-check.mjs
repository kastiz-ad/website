import { readdir, readFile } from "node:fs/promises";
import { join, relative } from "node:path";

const root = new URL("..", import.meta.url).pathname.replace(/^\/(.:)/, "$1");
const skip = new Set([".git", "node_modules", "logo-preview-black.png", "alpha03-preview.png"]);
const hits = [];

async function walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (skip.has(entry.name)) continue;
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      await walk(path);
    } else if (/\.(js|mjs|html|css|md|json|yml|yaml)$/.test(entry.name)) {
      const text = await readFile(path, "utf8");
      const name = relative(root, path).replaceAll("\\", "/");
      const deployable = /\.(js|mjs|html|css)$/.test(entry.name);
      if (/functions\/api\/v1\/.*\.js$/.test(name) && /console\.(log|warn|error)/.test(text) && !name.endsWith("_lib/logger.js")) {
        hits.push(`backend raw console logging: ${name}`);
      }
      if (/AIza[0-9A-Za-z_-]{20,}|sk_(live|test)_[0-9A-Za-z_-]+|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/.test(text)) {
        hits.push(`possible secret pattern: ${name}`);
      }
      if (deployable && /Production-ready|All APIs are connected|Basically connected|Almost live|Ready enough|Should work/.test(text) && !/tests\/|PRODUCTION_READINESS_REPORT\.md|tools\/static-quality-check\.mjs/.test(name)) {
        hits.push(`forbidden production claim: ${name}`);
      }
    }
  }
}

await walk(root);
if (hits.length) {
  console.error(hits.join("\n"));
  process.exitCode = 1;
} else {
  console.log("Static quality check passed.");
}
