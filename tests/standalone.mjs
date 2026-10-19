import { Window } from "happy-dom";
import { readFile } from "node:fs/promises";
import assert from "node:assert/strict";
const html = await readFile("standalone/under-pressure.html", "utf8");
assert.doesNotMatch(html, /<script[^>]+src=/);
assert.doesNotMatch(html, /@import/);
assert.match(html, /data:font\/woff2;base64/);
const script = html.match(/<script>([\s\S]*)<\/script>/)?.[1];
assert.ok(script);
const window = new Window({
  url: "file:///under-pressure.html",
  settings: {
    enableJavaScriptEvaluation: true,
    disableCSSFileLoading: true,
    disableJavaScriptFileLoading: true,
  },
});
try {
  window.document.body.innerHTML = '<div id="root"></div>';
  window.eval(script);
  await new Promise((done) => setTimeout(done, 300));
  assert.match(window.document.body.textContent, /Under pressure/);
  assert.match(window.document.body.textContent, /2D accessible view/);
  const stage = [...window.document.querySelectorAll("button")].find((b) =>
    b.textContent.includes("Turning white"),
  );
  assert.ok(stage);
  stage.click();
  await new Promise((done) => setTimeout(done, 2400));
  assert.match(window.document.body.textContent, /Whitening retained/);
  assert.ok(window.document.querySelectorAll("[data-cavity]").length > 0);
  console.log(
    "PASS: self-contained application boots from bundled HTML and responds to its guided whitening stage in a virtual DOM. No visual browser claim is made.",
  );
} finally {
  await window.happyDOM.close();
}
