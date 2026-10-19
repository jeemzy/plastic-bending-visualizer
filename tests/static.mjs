import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import { resolve, dirname } from "node:path";
import assert from "node:assert/strict";
const prefix = "/plastic-bending-visualizer/",
  root = resolve("dist");
const html = await readFile(root + "/index.html", "utf8");
const assets = [...html.matchAll(/(?:src|href)="([^"]+)"/g)]
  .map((m) => m[1])
  .filter((p) => p.startsWith("./"));
assert.ok(assets.length >= 3);
for (const asset of assets)
  assert.ok((await readFile(resolve(root, asset))).length > 0);
const cssPath = assets.find((a) => a.endsWith(".css"));
const css = await readFile(resolve(root, cssPath), "utf8");
const fonts = [...css.matchAll(/url\(([^)]+\.woff2)\)/g)].map((m) =>
  m[1].replaceAll('"', "").replaceAll("'", ""),
);
assert.ok(fonts.length >= 2);
for (const font of fonts)
  assert.ok((await readFile(resolve(root, dirname(cssPath), font))).length > 0);
const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, "http://localhost");
    if (!url.pathname.startsWith(prefix)) throw Error();
    const path = resolve(
      root,
      url.pathname.slice(prefix.length) || "index.html",
    );
    if (!path.startsWith(root + "/")) throw Error();
    res.end(await readFile(path));
  } catch {
    res.writeHead(404).end();
  }
});
await new Promise((done) => server.listen(0, "127.0.0.1", done));
try {
  const port = server.address().port;
  for (const asset of ["index.html", ...assets]) {
    const response = await fetch(`http://127.0.0.1:${port}${prefix}${asset}`);
    assert.equal(response.status, 200);
    assert.ok((await response.arrayBuffer()).byteLength > 0);
  }
  console.log(
    `PASS: production index, ${assets.length} referenced assets and ${fonts.length} fonts resolve under a Pages project path and return HTTP 200.`,
  );
} finally {
  await new Promise((done) => server.close(done));
}
