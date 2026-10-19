import type { Simulation, View } from "./model";
import { useId } from "react";
import { createBeamMapper } from "./geometry";

export function BeamFallback({ sim, view }: { sim: Simulation; view: View }) {
  const id = useId();
  const map = createBeamMapper(sim.bend);
  const path = (v: number) =>
    Array.from({ length: 81 }, (_, i) => {
      const p = map(((i - 40) * 7.4) / 80, v, 0);
      return `${i === 0 ? "M" : "L"}${(250 + p[0] * 45).toFixed(2)} ${(170 - (p[1] + 0.45) * 45).toFixed(2)}`;
    }).join(" ");
  const center =
    view === "thermal"
      ? `hsl(${220 - sim.heat * 180} 75% 65%)`
      : view === "strain"
        ? "#e7b09a"
        : `hsl(${195 - sim.damage * 40} ${28 - sim.damage * 16}% ${60 + sim.damage * 35}%)`;
  return (
    <div className="fallback">
      <svg viewBox="0 0 500 240" aria-label="2D plastic specimen">
        <defs>
          <linearGradient id={id}>
            <stop stopColor={view === "thermal" ? "#304c94" : "#78aebd"} />
            <stop offset=".5" stopColor={center} />
            <stop
              offset="1"
              stopColor={view === "thermal" ? "#304c94" : "#78aebd"}
            />
          </linearGradient>
        </defs>
        <path
          d={path(0)}
          fill="none"
          stroke={`url(#${id})`}
          strokeWidth="18"
          strokeLinecap="round"
        />
        {view === "strain" &&
          (["tension", "compression"] as const).map((face, i) => (
            <path
              key={face}
              data-face={face}
              d={path(i === 0 ? -0.19 : 0.19)}
              fill="none"
              stroke={
                i === 0
                  ? `hsl(18 ${20 + sim.bend * 50}% ${65 + sim.bend * 10}%)`
                  : `hsl(190 ${20 + sim.bend * 45}% ${65 + sim.bend * 10}%)`
              }
              strokeWidth="4"
            />
          ))}
      </svg>
      <span>2D accessible view · WebGL unavailable</span>
    </div>
  );
}
export function MicroFallback({
  sim,
  light,
  ps,
}: {
  sim: Simulation;
  light: boolean;
  ps: boolean;
}) {
  return (
    <svg
      viewBox="0 0 500 250"
      className="fallback-chains"
      aria-label="2D conceptual microscopic view"
    >
      <g
        transform={`translate(${-sim.bend * 35} ${sim.bend * 15}) scale(${1 + sim.bend * 0.14} ${1 - sim.bend * 0.12})`}
      >
        {Array.from({ length: 14 }, (_, i) => {
          const shift = Math.sign(i - 6.5) * sim.damage * 12;
          return (
            <path
              key={i}
              d={`M20 ${30 + i * 14} C160 ${150 - i * 6 + shift} 100 ${-60 + i * 30 + shift} 250 ${30 + i * 14 + shift} S380 ${180 - i * 8} 480 ${30 + i * 14}`}
              stroke={i % 2 ? "#b8d3a0" : "#7eaa95"}
              strokeWidth="2"
              fill="none"
            />
          );
        })}
        {sim.damage > 0.02 &&
          Array.from({ length: 5 }, (_, i) => (
            <ellipse
              data-cavity="true"
              key={i}
              cx={200 + i * 24}
              cy={108 + Math.sin(i * 3) * 28}
              rx={sim.damage * 6}
              ry={sim.damage * (ps ? 20 : 9)}
              fill="#e3f0df"
              fillOpacity=".7"
            />
          ))}
        {ps &&
          sim.damage > 0.05 &&
          Array.from({ length: 5 }, (_, i) => (
            <path
              data-fibril="true"
              key={i}
              d={`M${248 + i * 2} ${101 - sim.damage * 13} V${101 + sim.damage * 13}`}
              stroke="#ffffff"
              strokeWidth=".8"
            />
          ))}
      </g>
      {light &&
        Array.from({ length: 5 }, (_, i) => (
          <path
            data-light="true"
            key={i}
            d={`M0 ${105 + i * 10} H250 L500 ${105 + i * 10 + (i - 2) * sim.damage * 45}`}
            stroke="#e8e7b5"
            strokeWidth="1"
            strokeDasharray="5 5"
            opacity=".65"
          />
        ))}
      <text x="10" y="240" fontSize="10" fill="#a9b7a1">
        2D conceptual view · not to scale
      </text>
    </svg>
  );
}
