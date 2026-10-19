import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { beamPoint } from "../src/geometry.ts";
const length = (v: number, bend: number) => {
  let sum = 0,
    previous = beamPoint(-3.7, v, 0, bend);
  for (let i = 1; i <= 800; i++) {
    const p = beamPoint(-3.7 + (i * 7.4) / 800, v, 0, bend);
    sum += Math.hypot(p[0] - previous[0], p[1] - previous[1]);
    previous = p;
  }
  return sum;
};
describe("prescribed bending geometry", () => {
  it("preserves the neutral centerline length during deep bending", () =>
    assert.ok(Math.abs(length(0, 1) - 7.4) < 0.002));
  it("stretches the outer face and shortens the inner face", () => {
    assert.ok(length(-0.12, 0.9) > 7.4);
    assert.ok(length(0.12, 0.9) < 7.4);
  });
  it("curves smoothly with symmetric ends and a fixed center", () => {
    const a = beamPoint(-3, 0.12, 0.6, 0.8),
      b = beamPoint(3, 0.12, 0.6, 0.8);
    assert.ok(Math.abs(a[0] + b[0]) < 1e-9);
    assert.ok(Math.abs(a[1] - b[1]) < 1e-9);
    assert.ok(b[1] > beamPoint(0, 0.12, 0.6, 0.8)[1] + 0.5);
    assert.equal(a[2], 0.6);
  });
});
