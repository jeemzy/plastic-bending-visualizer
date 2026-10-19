import { build } from "esbuild";
import { readFile, mkdir, writeFile } from "node:fs/promises";
const result = await build({
  entryPoints: ["src/main.tsx"],
  bundle: true,
  minify: true,
  format: "iife",
  write: false,
  outdir: "standalone",
  jsx: "automatic",
  loader: { ".woff2": "dataurl" },
  define: {
    "process.env.NODE_ENV": '"production"',
    "import.meta.env.VITE_SOURCE_URL": "undefined",
  },
});
const js = result.outputFiles.find((f) => f.path.endsWith(".js")).text;
const css = result.outputFiles.find((f) => f.path.endsWith(".css")).text;
const favicon = await readFile("public/favicon.svg", "utf8");
const notices = await readFile("public/THIRD_PARTY_NOTICES.txt", "utf8");
const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#111613"><title>Under Pressure — Matter Lab</title><link rel="icon" href="data:image/svg+xml,${encodeURIComponent(favicon)}"><style>${css.replace(/@import[^;]+;/g, "")}</style></head><body><div id="root"></div><script>${js.replaceAll("</script", "<\\/script")}</script></body><!--${notices.replaceAll("-->", "-- >")}--></html>`;
await mkdir("standalone", { recursive: true });
await writeFile("standalone/under-pressure.html", html);
console.log(
  "Created standalone/under-pressure.html — all code and visuals bundled; open in a modern browser.",
);
