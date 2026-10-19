/** End-to-end tests against the production build under a Pages project path. */
import { chromium } from "playwright";
import { createServer } from "node:http";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { resolve, extname } from "node:path";
import assert from "node:assert/strict";

const root = resolve("dist"),
  prefix = "/plastic-bending-visualizer/";
const types = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
};
const server = createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(
      new URL(req.url, "http://localhost").pathname,
    );
    if (!pathname.startsWith(prefix)) {
      res.writeHead(404).end();
      return;
    }
    const file = resolve(root, pathname.slice(prefix.length) || "index.html");
    if (!file.startsWith(root + "/")) {
      res.writeHead(403).end();
      return;
    }
    res.setHeader(
      "content-type",
      types[extname(file)] || "application/octet-stream",
    );
    res.end(await readFile(file));
  } catch {
    res.writeHead(404).end();
  }
});
await new Promise((done) => server.listen(0, "127.0.0.1", done));
const address = server.address(),
  url = `http://127.0.0.1:${address.port}${prefix}`;
await mkdir("verification", { recursive: true });
let browser;
const checks = [],
  errors = [];
const check = (message) => {
  checks.push(message);
  console.log("PASS", message);
};
try {
  browser = await chromium.launch({
    headless: true,
    executablePath: process.env.CHROMIUM_EXECUTABLE || undefined,
    args: [
      "--no-sandbox",
      "--disable-dev-shm-usage",
      "--use-angle=swiftshader",
      "--enable-unsafe-swiftshader",
      "--no-zygote",
      ...(process.env.CHROMIUM_SINGLE_PROCESS ? ["--single-process"] : []),
    ],
  });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1100 },
  });
  const page = await context.newPage();
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (msg) => {
    if (
      msg.type() === "error" &&
      /Shader|WebGLProgram|THREE|TypeError|ReferenceError/.test(msg.text())
    )
      errors.push(msg.text());
  });
  await page.goto(url, { waitUntil: "networkidle" });
  await page.getByRole("heading", { name: "Under pressure." }).waitFor();
  await page.screenshot({ path: "verification/desktop.png", fullPage: true });
  assert.equal(await page.locator("canvas").count(), 2);
  check("production app loads at GitHub Pages project path");
  await page.getByRole("button", { name: /Before the bend/ }).click();
  await page.getByRole("button", { name: /Under stress/ }).click();
  assert.equal(
    await page
      .getByRole("button", { name: "Strain", exact: true })
      .getAttribute("aria-pressed"),
    "true",
  );
  await page.getByRole("button", { name: /Turning white/ }).click();
  await page
    .getByText("Whitening retained", { exact: true })
    .waitFor({ timeout: 12000 });
  check("guided mechanical stress and whitening stages drive the model");
  await page.screenshot({
    path: "verification/whitening.png",
    fullPage: false,
  });
  await page.getByRole("button", { name: "Release bend" }).click();
  await page.waitForTimeout(2200);
  await page.getByText("Whitening retained", { exact: true }).waitFor();
  check("release preserves irreversible whitening");
  await page.getByRole("button", { name: "Reset to fresh specimen" }).click();
  await page.getByText("Undeformed", { exact: true }).waitFor();
  await page.getByRole("button", { name: "Pause simulation" }).click();
  await page.getByLabel("Bending amount", { exact: true }).focus();
  await page.getByLabel("Bending amount", { exact: true }).press("End");
  await page.waitForTimeout(300);
  await page.getByText("Undeformed", { exact: true }).waitFor();
  await page.getByRole("button", { name: "Resume simulation" }).click();
  await page
    .getByText("Whitening retained", { exact: true })
    .waitFor({ timeout: 12000 });
  check("range input, pause and resume change actual simulation state");
  await page.getByLabel("Material", { exact: true }).selectOption("tpe");
  await page.getByLabel("Bending amount", { exact: true }).focus();
  await page.getByLabel("Bending amount", { exact: true }).press("End");
  await page.waitForTimeout(2200);
  assert.equal(
    await page.getByText("Whitening retained", { exact: true }).count(),
    0,
  );
  await page.getByRole("button", { name: "Release bend" }).click();
  await page
    .getByText("Undeformed", { exact: true })
    .waitFor({ timeout: 12000 });
  check("flexible material bends and recovers without illustrated whitening");
  await page.getByLabel("Material", { exact: true }).selectOption("ps");
  await page.getByRole("button", { name: /Feeling the heat/ }).click();
  assert.equal(
    await page
      .getByRole("button", { name: "Thermal", exact: true })
      .getAttribute("aria-pressed"),
    "true",
  );
  await page
    .getByText("Warming", { exact: true })
    .last()
    .waitFor({ timeout: 12000 });
  await page.screenshot({ path: "verification/thermal.png", fullPage: false });
  await page.getByRole("button", { name: "Light on", exact: true }).click();
  assert.equal(
    await page
      .getByRole("button", { name: "Light off", exact: true })
      .getAttribute("aria-pressed"),
    "false",
  );
  await page.getByRole("button", { name: "Expand microscopic view" }).click();
  await page.getByRole("dialog", { name: "Microscopic world" }).waitFor();
  await page.getByLabel("Bending amount ·", { exact: false }).focus();
  await page.getByRole("button", { name: "Close microscopic view" }).click();
  check("thermal overlay, light toggle and expanded microscopic view operate");
  await page.getByRole("button", { name: "Quarter speed slow motion" }).click();
  assert.equal(
    await page
      .getByRole("button", { name: "Quarter speed slow motion" })
      .getAttribute("aria-pressed"),
    "true",
  );
  await page.getByRole("button", { name: "Replay bending cycle" }).click();
  check("slow-motion and replay controls activate");
  // Actual pointer events on the specimen, rather than synthetic React handlers.
  await page.getByRole("button", { name: "Reset to fresh specimen" }).click();
  const rect = await page.locator(".specimen-interaction").boundingBox();
  await page.mouse.move(rect.x + rect.width / 2, rect.y + rect.height * 0.7);
  await page.mouse.down();
  await page.mouse.move(
    rect.x + rect.width / 2,
    rect.y + rect.height * 0.7 - 190,
    { steps: 12 },
  );
  await page.mouse.up();
  assert.ok(
    Number(
      await page.getByLabel("Bending amount", { exact: true }).inputValue(),
    ) > 50,
  );
  check("direct dragging genuinely controls bending");
  for (const width of [390, 768]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.waitForTimeout(150);
    assert.ok(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    );
    await page.screenshot({
      path: `verification/layout-${width}.png`,
      fullPage: true,
    });
  }
  check("mobile and tablet layouts do not overflow horizontally");
  const mobile = await browser.newContext({
    viewport: { width: 390, height: 844 },
    reducedMotion: "reduce",
  });
  const fallback = await mobile.newPage();
  await fallback.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type, ...rest) {
      if (String(type).includes("webgl")) return null;
      return original.call(this, type, ...rest);
    };
  });
  await fallback.goto(url, { waitUntil: "networkidle" });
  await fallback.getByText("2D accessible view · WebGL unavailable").waitFor();
  await fallback.getByRole("button", { name: /Turning white/ }).click();
  await fallback
    .getByText("Whitening retained", { exact: true })
    .waitFor({ timeout: 12000 });
  assert.ok((await fallback.locator("[data-cavity]").count()) > 0);
  await fallback.getByRole("button", { name: "Light on", exact: true }).click();
  assert.equal(await fallback.locator("[data-light]").count(), 0);
  await fallback.screenshot({
    path: "verification/fallback-mobile.png",
    fullPage: true,
  });
  check("WebGL fallback remains interactive with reduced motion");
  assert.deepEqual(errors, []);
  check("no application exceptions or shader compilation errors");
  await writeFile(
    "verification/browser-results.json",
    JSON.stringify({ checks, errors }, null, 2),
  );
} finally {
  await browser?.close();
  await new Promise((done) => server.close(done));
}
