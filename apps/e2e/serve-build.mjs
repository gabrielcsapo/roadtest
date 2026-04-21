/**
 * Builds the roadtest static UI from the example app, then serves it on port 4173.
 * Used by Playwright's webServer config for the "build" project.
 */
import { execSync } from "child_process";
import { createServer } from "http";
import { createReadStream, existsSync, statSync } from "fs";
import { extname, join, dirname, resolve } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const EXAMPLE_DIR = resolve(__dirname, "../example");
const DIST_DIR = join(EXAMPLE_DIR, "dist");
const PORT = 4173;

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

// Step 1: Build the static site
console.log("[serve-build] Running roadtest --build…");
execSync("pnpm exec roadtest --build", {
  cwd: EXAMPLE_DIR,
  stdio: "inherit",
});
console.log("[serve-build] Build complete.");

// Step 2: Serve the static output.
// All unknown paths fall back to index.html (SPA hash routing).
createServer((req, res) => {
  let urlPath = (req.url ?? "/").split("?")[0].split("#")[0];
  if (urlPath === "" || urlPath === "/") urlPath = "/index.html";

  let filePath = join(DIST_DIR, urlPath);

  if (!existsSync(filePath) || statSync(filePath).isDirectory()) {
    filePath = join(DIST_DIR, "index.html");
  }

  const contentType = MIME[extname(filePath)] ?? "text/plain";
  res.setHeader("Content-Type", contentType);
  res.setHeader("Cache-Control", "no-cache");

  const stream = createReadStream(filePath);
  stream.on("error", () => {
    res.statusCode = 404;
    res.end("Not found");
  });
  stream.pipe(res);
}).listen(PORT, () => {
  console.log(`[serve-build] Serving static build at http://localhost:${PORT}`);
});
