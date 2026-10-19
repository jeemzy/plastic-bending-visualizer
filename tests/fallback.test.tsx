import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";
import { BeamFallback, MicroFallback } from "../src/FallbackViews";
import { createState } from "../src/model";
const initial = createState();
describe("responsive non-WebGL views", () => {
  it("shows distinct outer-tension and inner-compression faces in strain mode", () => {
    const output = renderToStaticMarkup(
      <BeamFallback sim={{ ...initial, bend: 0.8 }} view="strain" />,
    );
    assert.match(output, /data-face="tension"/);
    assert.match(output, /data-face="compression"/);
  });
  it("changes the specimen geometry when bent", () => {
    const a = renderToStaticMarkup(
      <BeamFallback sim={initial} view="material" />,
    );
    const b = renderToStaticMarkup(
      <BeamFallback sim={{ ...initial, bend: 0.9 }} view="material" />,
    );
    assert.notEqual(a, b);
  });
  it("retains a white structural mark after release", () => {
    const a = renderToStaticMarkup(
      <BeamFallback sim={initial} view="material" />,
    );
    const b = renderToStaticMarkup(
      <BeamFallback sim={{ ...initial, damage: 1 }} view="material" />,
    );
    assert.notEqual(a, b);
  });
  it("changes thermal appearance with dissipative warming", () => {
    const a = renderToStaticMarkup(
      <BeamFallback sim={initial} view="thermal" />,
    );
    const b = renderToStaticMarkup(
      <BeamFallback sim={{ ...initial, heat: 0.8 }} view="thermal" />,
    );
    assert.notEqual(a, b);
  });
  it("shows cavities only in damaged structure", () => {
    const clean = renderToStaticMarkup(
      <MicroFallback sim={initial} light={false} ps={false} />,
    );
    const damaged = renderToStaticMarkup(
      <MicroFallback
        sim={{ ...initial, damage: 1 }}
        light={false}
        ps={false}
      />,
    );
    assert.doesNotMatch(clean, /data-cavity/);
    assert.match(damaged, /data-cavity/);
  });
  it("light toggle removes rays while preserving structure", () => {
    const a = renderToStaticMarkup(
      <MicroFallback sim={initial} light={false} ps={false} />,
    );
    const b = renderToStaticMarkup(
      <MicroFallback sim={initial} light ps={false} />,
    );
    assert.doesNotMatch(a, /data-light/);
    assert.match(b, /data-light/);
  });
  it("only the PS schematic adds craze fibrils", () => {
    const sim = { ...initial, damage: 1 };
    assert.doesNotMatch(
      renderToStaticMarkup(
        <MicroFallback sim={sim} light={false} ps={false} />,
      ),
      /data-fibril/,
    );
    assert.match(
      renderToStaticMarkup(<MicroFallback sim={sim} light={false} ps />),
      /data-fibril/,
    );
  });
});
