/** Beam coordinates for the exhibit. s is distance along the neutral centerline.
 * Positive v is the inner (compressed) face of this upward-curving bend.
 * This is a prescribed shape, not a force or finite-element solution.
 */
export function createBeamMapper(bend: number) {
  const xs = new Float64Array(161),
    ys = new Float64Array(161),
    angles = new Float64Array(161);
  for (let j = 0; j <= 160; j++)
    angles[j] = bend * 1.43 * Math.tanh((((j - 80) * 7.4) / 160) * 0.8);
  for (let j = 81; j <= 160; j++) {
    const angle = (angles[j] + angles[j - 1]) / 2;
    xs[j] = xs[j - 1] + (Math.cos(angle) * 7.4) / 160;
    ys[j] = ys[j - 1] + (Math.sin(angle) * 7.4) / 160;
  }
  for (let j = 0; j < 80; j++) {
    xs[j] = -xs[160 - j];
    ys[j] = ys[160 - j];
  }
  return (s: number, v: number, z: number): [number, number, number] => {
    const index = Math.max(0, Math.min(160, ((s + 3.7) / 7.4) * 160));
    const i = Math.min(159, Math.floor(index)),
      f = index - i;
    const angle = angles[i] * (1 - f) + angles[i + 1] * f;
    return [
      xs[i] * (1 - f) + xs[i + 1] * f - v * Math.sin(angle),
      ys[i] * (1 - f) + ys[i + 1] * f + v * Math.cos(angle) - 0.45,
      z,
    ];
  };
}
export function beamPoint(
  s: number,
  v: number,
  z: number,
  bend: number,
): [number, number, number] {
  return createBeamMapper(bend)(s, v, z);
}
