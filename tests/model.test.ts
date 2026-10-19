import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createState, step, materials } from "../src/model.ts";
function drive(target: number, material = "pp", speed = 1, seconds = 4) {
  let s = createState();
  for (let i = 0; i < seconds * 60; i++)
    s = step(s, target, material, speed, 1 / 60);
  return s;
}
describe("qualitative material history", () => {
  it("recovers a gentle bend without permanent whitening", () => {
    let s = drive(0.2);
    for (let i = 0; i < 300; i++) s = step(s, 0, "pp", 1, 1 / 60);
    assert.ok(s.bend < 0.001);
    assert.equal(s.damage, 0);
    assert.equal(s.residual, 0);
  });
  it("retains whitening and set after a severe susceptible bend", () => {
    let s = drive(1);
    assert.ok(s.damage > 0.5);
    for (let i = 0; i < 300; i++) s = step(s, 0, "pp", 1, 1 / 60);
    assert.ok(s.damage > 0.5);
    assert.ok(s.bend > 0.05 && s.bend < 0.4);
  });
  it("illustrative elastomer recovers without void damage", () => {
    let s = drive(1, "tpe");
    for (let i = 0; i < 300; i++) s = step(s, 0, "tpe", 1, 1 / 60);
    assert.equal(s.damage, 0);
    assert.equal(s.residual, 0);
    assert.ok(s.bend < 0.001);
  });
  it("dissipates energy while deforming then cools at fixed bend", () => {
    let s = drive(0.95);
    assert.ok(s.dissipated > 0);
    const h = s.heat;
    for (let i = 0; i < 600; i++) s = step(s, 0.95, "pp", 1, 1 / 60);
    assert.ok(s.heat < h);
    assert.ok(s.heat >= 0);
  });
  it("faster loading gives more retained warmth at arrival", () => {
    const slow = drive(0.9, "pp", 0.3, 3);
    const fast = drive(0.9, "pp", 2, 0.5);
    assert.ok(fast.heat > slow.heat);
  });
  it("zero time pauses all state and reset clears history", () => {
    const s = drive(1);
    assert.deepEqual(step(s, 0, "pp", 1, 0), s);
    assert.deepEqual(createState(), {
      bend: 0,
      residual: 0,
      damage: 0,
      heat: 0,
      dissipated: 0,
      structural: 0,
      elapsed: 0,
    });
  });
  it("is bounded and stable under repeated cycles", () => {
    let s = createState();
    for (let i = 0; i < 9000; i++)
      s = step(s, i % 120 < 60 ? 1 : 0, "pp", 2, 1 / 60);
    for (const v of Object.values(s)) assert.ok(Number.isFinite(v));
    assert.ok(s.bend <= 1);
    assert.ok(s.heat <= 1);
    assert.ok(s.damage <= 1);
  });
  it("presets have distinct representative descriptions", () => {
    assert.deepEqual(Object.keys(materials), ["pp", "ps", "tpe"]);
    assert.equal(
      new Set(Object.values(materials).map((m) => m.description)).size,
      3,
    );
  });
});
