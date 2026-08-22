import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC = path.join(__dirname, "public");
const PORT = process.env.PORT || 3000;
const HOST = "0.0.0.0";

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".json": "application/json; charset=utf-8",
  ".pdf": "application/pdf",
  ".woff2": "font/woff2",
  ".txt": "text/plain; charset=utf-8",
};

function safePath(urlPath) {
  const decoded = decodeURIComponent(urlPath.split("?")[0]);
  let p = path.normalize(path.join(PUBLIC, decoded));
  if (!p.startsWith(PUBLIC)) return null;
  return p;
}

const server = http.createServer((req, res) => {
  const url = req.url || "/";
  const filePath = safePath(url);

  // Static asset
  if (filePath && filePath !== PUBLIC) {
    try {
      const stat = fs.statSync(filePath);
      if (stat.isFile()) {
        const ext = path.extname(filePath).toLowerCase();
        res.writeHead(200, {
          "Content-Type": MIME[ext] || "application/octet-stream",
          "Cache-Control": "no-cache",
        });
        fs.createReadStream(filePath).pipe(res);
        return;
      }
    } catch {
      /* fall through to SPA */
    }
  }

  // SPA fallback — serve index.html for any route
  try {
    const html = fs.readFileSync(path.join(PUBLIC, "index.html"));
    res.writeHead(200, {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-cache",
    });
    res.end(html);
  } catch {
    res.writeHead(500);
    res.end("Internal error");
  }
});

server.listen(PORT, HOST, () => {
  console.log(`G4Gate clone running at http://localhost:${PORT}`);
});
