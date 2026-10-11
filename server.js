import http from "node:http";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = fileURLToPath(new URL(".", import.meta.url));
const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".svg": "image/svg+xml",
};
const server = http.createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(
      new URL(req.url, "http://localhost").pathname,
    );
    if (
      pathname.split("/").some((part) => part.startsWith(".")) ||
      pathname.includes("\\")
    )
      throw Error("Forbidden");
    const vendorFiles = {
      "/vendor/chess.js": "node_modules/chess.js/dist/esm/chess.js",
      "/vendor/tween.js": "node_modules/@tweenjs/tween.js/dist/tween.esm.js",
      "/vendor/perfect-freehand.js":
        "node_modules/perfect-freehand/dist/esm/index.mjs",
    };
    const vendorFile = Object.hasOwn(vendorFiles, pathname)
      ? vendorFiles[pathname]
      : null;
    const target = vendorFile
      ? path.join(root, vendorFile)
      : path.resolve(root, "." + (pathname === "/" ? "/index.html" : pathname));
    const relative = path.relative(root, target);
    // Serve only application assets, never configuration, dependencies, or arbitrary repository files.
    if (
      !vendorFile &&
      (relative.startsWith("..") ||
        (!["index.html", "styles.css"].includes(relative) &&
          !/^src\/[^/]+\.js$/.test(relative)))
    )
      throw Error("Forbidden");
    const data = await readFile(target);
    res.writeHead(200, {
      "Content-Type": types[path.extname(target)] || "application/octet-stream",
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "no-cache",
    });
    res.end(req.method === "HEAD" ? undefined : data);
  } catch {
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Not found");
  }
});
server.listen(Number(process.env.PORT || 4949), "0.0.0.0", () =>
  console.log(`Papayu GameHub running on port ${server.address().port}`),
);
