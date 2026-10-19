/** Dimensionless storytelling model. Parameters are animation choices, never material constants. */
export type MaterialId = "pp" | "ps" | "tpe";
export const materials = {
  pp: {
    name: "Polypropylene",
    short: "PP",
    family: "Semi-crystalline thermoplastic",
    description:
      "A PP-like response: local cavities and changes around crystalline regions can scatter light. Strong bends may leave a white mark and a permanent set.",
    susceptibility: 1,
    set: 0.25,
    loss: 0.42,
    mechanism: "Cavities & rearrangement",
  },
  ps: {
    name: "Polystyrene",
    short: "PS",
    family: "Glassy thermoplastic",
    description:
      "A PS-like response: crazes can form with tiny voids bridged by polymer fibrils. Actual polystyrene may crack or break; fracture is outside this exhibit.",
    susceptibility: 1.35,
    set: 0.15,
    loss: 0.32,
    mechanism: "Voids & craze fibrils",
  },
  tpe: {
    name: "Flexible elastomer",
    short: "TPE",
    family: "Thermoplastic elastomer",
    description:
      "An idealized flexible TPE: chains rearrange and recover with little visible whitening in the illustrated range. Real TPE formulations can also develop damage.",
    susceptibility: 0,
    set: 0,
    loss: 0.22,
    mechanism: "Mostly recoverable rearrangement",
  },
} as const;
export interface Simulation {
  bend: number;
  residual: number;
  damage: number;
  heat: number;
  dissipated: number;
  structural: number;
  elapsed: number;
}
export type View = "material" | "strain" | "thermal";
export const clamp = (n: number, min = 0, max = 1) =>
  Math.max(min, Math.min(max, n));
export function createState(): Simulation {
  return {
    bend: 0,
    residual: 0,
    damage: 0,
    heat: 0,
    dissipated: 0,
    structural: 0,
    elapsed: 0,
  };
}
export function step(
  s: Simulation,
  target: number,
  id: string,
  speed: number,
  dt: number,
): Simulation {
  if (dt <= 0) return s;
  const p = materials[id as MaterialId] ?? materials.pp;
  const duration = Math.min(dt, 0.05);
  const goal = Math.max(clamp(target), s.residual);
  const delta =
    Math.sign(goal - s.bend) *
    Math.min(Math.abs(goal - s.bend), duration * 0.55 * clamp(speed, 0.2, 3));
  const bend = clamp(s.bend + delta);
  // Irreversible history, in arbitrary exhibit coordinates, not a strain threshold.
  const damage = Math.max(
    s.damage,
    clamp(((bend - 0.48) / 0.52) * p.susceptibility),
  );
  const residual = Math.max(s.residual, damage * p.set);
  const workLoss =
    Math.abs(delta) *
    (p.loss + 0.45 * damage + (0.15 * Math.abs(delta)) / duration);
  const structural = s.structural + Math.max(0, damage - s.damage) * 0.24;
  return {
    bend,
    damage,
    residual,
    heat: clamp(s.heat * Math.exp(-duration * 0.14) + workLoss * 0.82),
    dissipated: s.dissipated + workLoss,
    structural,
    elapsed: s.elapsed + duration,
  };
}
export function elasticEnergy(s: Simulation) {
  return 0.5 * Math.pow(Math.max(0, s.bend - s.residual), 2);
}
