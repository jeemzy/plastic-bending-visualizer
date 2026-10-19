import { useEffect, useRef, useState } from "react";
import {
  ArrowUpRight,
  ArrowRight,
  MoveUp,
  RotateCcw,
  Play,
  Pause,
  Scan,
  Maximize2,
  X,
  Layers3,
  Thermometer,
  Activity,
  ChevronDown,
  Info,
  Sparkles,
  MousePointer2,
  Sun,
  Atom,
  Check,
  ExternalLink,
} from "lucide-react";
import { createState, step, materials, elasticEnergy } from "./model";
import type { MaterialId, View } from "./model";
import { Specimen } from "./Specimen";
import type { VisualState } from "./Specimen";
import { Microstructure } from "./Microstructure";
const sourceUrl = import.meta.env.VITE_SOURCE_URL as string | undefined;
const chapters = [
  {
    title: "Before the bend",
    label: "An invisible tangle",
    text: "Long polymer chains interweave. Their arrangement and any crystalline regions help determine how the plastic responds.",
    bend: 0,
    icon: Atom,
  },
  {
    title: "Under stress",
    label: "One bend. Two responses.",
    text: "The outside stretches in tension. The inside shortens in compression. Chains and surrounding structures rearrange.",
    bend: 0.43,
    icon: Activity,
  },
  {
    title: "Turning white",
    label: "The material changes. Light scatters.",
    text: "In susceptible plastics, cavities, crazes or other structural changes scatter visible light. A cloudy white region appears.",
    bend: 0.86,
    icon: Sun,
  },
  {
    title: "Feeling the heat",
    label: "Your work goes somewhere.",
    text: "Some work is stored elastically or in changed structure. Viscoelastic and plastic processes dissipate some as heat.",
    bend: 0.98,
    icon: Thermometer,
  },
];
function App() {
  const [material, setMaterial] = useState<MaterialId>("pp");
  const [view, setView] = useState<View>("material");
  const [target, setTarget] = useState(0.32);
  const [speed, setSpeed] = useState(1);
  const [paused, setPaused] = useState(false);
  const [slow, setSlow] = useState(false);
  const [light, setLight] = useState(true);
  const [stage, setStage] = useState<number | null>(null);
  const [reading, setReading] = useState(() => ({
    ...createState(),
    bend: 0.32,
  }));
  const [reduced, setReduced] = useState(
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const [microOpen, setMicroOpen] = useState(false);
  const live = useRef<VisualState>({
    sim: { ...createState(), bend: 0.32 },
    view: "material",
    paused: false,
    reduced,
    light: true,
    ps: false,
  });
  const controls = useRef({ target, speed, material, paused, slow });
  const replay = useRef<number | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  controls.current = { target, speed, material, paused, slow };
  live.current = {
    ...live.current,
    view,
    paused,
    reduced,
    light,
    ps: material === "ps",
  };
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const fn = () => setReduced(query.matches);
    query.addEventListener("change", fn);
    return () => query.removeEventListener("change", fn);
  }, []);
  useEffect(() => {
    let frame = 0;
    let last = 0;
    let lastUi = 0;
    const animate = (now: number) => {
      frame = requestAnimationFrame(animate);
      if (!last) last = now;
      const raw = Math.min((now - last) / 1000, 0.05);
      last = now;
      const c = controls.current;
      if (!c.paused && !document.hidden) {
        const dt = raw * (c.slow ? 0.25 : 1);
        let goal = c.target;
        if (replay.current !== null) {
          replay.current += dt;
          const t = replay.current;
          goal =
            t < 1
              ? 0
              : t < 3.6
                ? Math.min(1, (t - 1) / 1.8)
                : t < 5.8
                  ? 0
                  : 0.95;
          if (t > 8) {
            replay.current = null;
            setTarget(0.95);
          }
        }
        live.current.sim = step(
          live.current.sim,
          goal,
          c.material,
          c.speed,
          dt,
        );
      }
      if (now - lastUi > 90) {
        setReading({ ...live.current.sim });
        lastUi = now;
      }
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, []);
  const reset = (bend = 0) => {
    replay.current = null;
    live.current.sim = createState();
    setReading(createState());
    setTarget(bend);
    setPaused(false);
  };
  const chooseMaterial = (id: MaterialId) => {
    setMaterial(id);
    reset(stage === null ? 0.32 : chapters[stage].bend);
  };
  const bend = (value: number) => {
    replay.current = null;
    setStage(null);
    setTarget(value);
  };
  const selectStage = (index: number) => {
    setStage(index);
    reset(chapters[index].bend);
    setView(index === 1 ? "strain" : index === 3 ? "thermal" : "material");
    setLight(true);
  };
  const runReplay = () => {
    reset();
    setStage(null);
    replay.current = 0;
  };
  useEffect(() => {
    if (microOpen) dialog.current?.showModal();
    else dialog.current?.close();
  }, [microOpen]);
  const p = materials[material];
  const hasDamage = reading.damage > 0.07;
  const heatLabel =
    reading.heat > 0.45
      ? "Warm"
      : reading.heat > 0.12
        ? "Warming"
        : "Near ambient";
  const elastic = elasticEnergy(reading);
  const total = elastic + reading.dissipated + reading.structural;
  const fractions =
    total > 0
      ? [
          elastic / total,
          reading.structural / total,
          reading.dissipated / total,
        ]
      : [0, 0, 0];
  const active =
    stage === null
      ? view === "thermal" && reading.heat > 0.12
        ? 3
        : hasDamage
          ? 2
          : reading.bend > 0.1
            ? 1
            : 0
      : stage;
  const chapter = chapters[active];
  return (
    <>
      <a href="#experiment" className="skip-link">
        Skip to experiment
      </a>
      <header className="site-header">
        <a className="brand" href="#" aria-label="Matter Lab home">
          <span className="brand-symbol">
            m<span>·</span>
          </span>
          <span>
            MATTER<span className="brand-light">LAB</span>
          </span>
        </a>
        <nav aria-label="Main navigation">
          <a className="current" href="#experiment">
            The experiment
          </a>
          <a href="#science">
            The science <ArrowUpRight size={13} />
          </a>
        </nav>
        <span className="exhibit-number">
          INTERACTIVE EXHIBIT <span>001</span>
        </span>
      </header>
      <main>
        <section className="intro">
          <div>
            <div className="eyebrow">
              <span className="status-dot" /> A CLOSER LOOK AT EVERYDAY
              MATERIALS
            </div>
            <h1>
              Under <em>pressure.</em>
            </h1>
          </div>
          <div className="intro-copy">
            <p>A small bend. A surprising transformation.</p>
            <span>
              Discover why plastic turns white and warms up.
              <br />
              The answer is hidden on the inside.
            </span>
          </div>
        </section>
        <section
          id="experiment"
          className="exhibit"
          aria-label="Interactive plastic bending experiment"
        >
          <div className="experiment-main">
            <div className="macro-panel">
              <div className="panel-top">
                <div className="panel-title">
                  <span className="tiny-square" /> THE SPECIMEN{" "}
                  <span className="subtle">/ {p.short}</span>
                </div>
                <span className="live-label">
                  <span className="status-dot" />
                  {paused ? "PAUSED" : "LIVE SIMULATION"}
                </span>
              </div>
              <div
                className="view-tabs"
                role="group"
                aria-label="Visualization mode"
              >
                {(
                  [
                    { id: "material", label: "Material", icon: Layers3 },
                    { id: "strain", label: "Strain", icon: Activity },
                    { id: "thermal", label: "Thermal", icon: Scan },
                  ] as const
                ).map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    aria-pressed={view === id}
                    className={view === id ? "selected" : ""}
                    onClick={() => setView(id)}
                  >
                    <Icon size={14} />
                    {label}
                  </button>
                ))}
              </div>
              <Specimen live={live} onBend={bend} />
              <div className="specimen-label label-left">
                <span className="annotation-line" />
                {view === "thermal"
                  ? heatLabel
                  : view === "strain"
                    ? "Outer surface · tension"
                    : hasDamage
                      ? "Stress-whitened region"
                      : "Translucent polymer"}
                <small>
                  {view === "thermal"
                    ? "Relative thermal signal"
                    : view === "strain"
                      ? "Chains and structure stretch"
                      : hasDamage
                        ? "Light scatters at changed structure"
                        : "Bend to reveal what’s inside"}
                </small>
              </div>
              {view === "strain" && (
                <div className="compression-label">
                  Inner surface · compression
                </div>
              )}
              {view === "thermal" && (
                <div className="thermal-scale">
                  <span>Cooler</span>
                  <i />
                  <span>Warmer</span>
                </div>
              )}
              <div className="canvas-bottom">
                <span>
                  <MousePointer2 size={13} /> Drag upward to bend
                </span>
                <span className="model-scale">
                  QUALITATIVE MODEL <Info size={12} />
                </span>
              </div>
              <div className="sample-marker">
                01 <span>/ MACRO SCALE</span>
              </div>
            </div>
            <aside
              className="insight-panel"
              aria-label="Synchronized microscopic view and observations"
            >
              <div className="micro-header">
                <div>
                  <span className="eyebrow">BENEATH THE SURFACE</span>
                  <h2>A different world.</h2>
                </div>
                <button
                  className="icon-button"
                  aria-label="Expand microscopic view"
                  onClick={() => setMicroOpen(true)}
                >
                  <Maximize2 size={16} />
                </button>
              </div>
              <div className="micro-container">
                <Microstructure live={live} />
                <div className="micro-tag">
                  <span className="status-dot" /> TENSION-SIDE CUTAWAY
                </div>
                <span className="micro-not-scale">
                  CONCEPTUAL · NOT TO SCALE
                </span>
              </div>
              <div className="micro-key">
                <span>
                  <i className="chain-dot" />
                  Polymer chains
                </span>
                <span>
                  <i className="void-dot" />
                  {material === "ps" ? "Crazes & fibrils" : "Microvoids"}
                </span>
                <button
                  aria-pressed={light}
                  onClick={() => setLight(!light)}
                  className={light ? "light-on" : ""}
                >
                  <Sun size={13} />
                  {light ? "Light on" : "Light off"}
                </button>
              </div>
              <div className="insight-caption" aria-live="polite">
                <span className="caption-number">
                  {String(active + 1).padStart(2, "0")}
                </span>
                <div>
                  <h3>{chapter.label}</h3>
                  <p>{chapter.text}</p>
                </div>
              </div>
              <div className="observations">
                <div>
                  <span>APPEARANCE</span>
                  <strong>
                    {hasDamage
                      ? "Whitening retained"
                      : reading.bend > 0.2
                        ? "Deforming"
                        : "Undeformed"}
                  </strong>
                </div>
                <div>
                  <span>THERMAL RESPONSE</span>
                  <strong className={reading.heat > 0.12 ? "warm" : ""}>
                    <i />
                    {heatLabel}
                  </strong>
                </div>
              </div>
            </aside>
          </div>
          <div className="control-deck">
            <div className="bend-control">
              <label htmlFor="bend">
                Bending amount{" "}
                <span>
                  {Math.round(target * 100)}
                  <small>/100</small>
                </span>
              </label>
              <input
                id="bend"
                aria-label="Bending amount"
                type="range"
                min="0"
                max="100"
                value={Math.round(target * 100)}
                style={{ "--fill": `${target * 100}%` } as React.CSSProperties}
                onChange={(e) => bend(Number(e.target.value) / 100)}
              />
              <div className="range-labels">
                <span>Relaxed</span>
                <span>Deep bend</span>
              </div>
            </div>
            <div className="control-divider" />
            <div className="material-control">
              <label htmlFor="material">Material</label>
              <div className="select-wrap">
                <select
                  id="material"
                  value={material}
                  onChange={(e) => chooseMaterial(e.target.value as MaterialId)}
                >
                  {Object.entries(materials).map(([id, m]) => (
                    <option value={id} key={id}>
                      {m.name} · {m.short}
                    </option>
                  ))}
                </select>
                <ChevronDown size={14} />
              </div>
              <span>Representative behavior</span>
            </div>
            <div className="speed-control">
              <label htmlFor="speed">
                Bending speed{" "}
                <span>
                  {speed === 0.4 ? "Gentle" : speed === 2 ? "Quick" : "Normal"}
                </span>
              </label>
              <input
                id="speed"
                type="range"
                min="0"
                max="2"
                step="1"
                value={speed === 0.4 ? 0 : speed === 2 ? 2 : 1}
                onChange={(e) => setSpeed([0.4, 1, 2][Number(e.target.value)])}
              />
              <div className="range-labels">
                <span>Slow</span>
                <span>Fast</span>
              </div>
            </div>
            <div className="transport">
              <div>
                <button
                  className="icon-button"
                  aria-label="Reset to fresh specimen"
                  title="Fresh specimen"
                  onClick={() => {
                    reset();
                    setStage(null);
                  }}
                >
                  <Sparkles size={17} />
                </button>
                <button
                  className="icon-button"
                  aria-label={paused ? "Resume simulation" : "Pause simulation"}
                  onClick={() => setPaused(!paused)}
                >
                  {paused ? <Play size={17} /> : <Pause size={17} />}
                </button>
                <button
                  className="icon-button"
                  aria-label="Replay bending cycle"
                  onClick={runReplay}
                >
                  <RotateCcw size={17} />
                </button>
                <button
                  className={`speed-button ${slow ? "active" : ""}`}
                  aria-label="Quarter speed slow motion"
                  aria-pressed={slow}
                  onClick={() => setSlow(!slow)}
                >
                  ¼×
                </button>
              </div>
              <button className="release-button" onClick={() => bend(0)}>
                Release bend <ArrowRight size={13} />
              </button>
            </div>
          </div>
        </section>
        <section className="journey" aria-label="Guided learning journey">
          <div className="section-heading">
            <span className="eyebrow">FOLLOW THE TRANSFORMATION</span>
            <button
              className={stage === null ? "free active" : "free"}
              aria-pressed={stage === null}
              onClick={() => setStage(null)}
            >
              <Sparkles size={13} />
              Free exploration <ArrowUpRight size={13} />
            </button>
          </div>
          <div className="chapter-grid">
            {chapters.map((c, i) => (
              <button
                key={c.title}
                className={`chapter ${stage === i ? "active" : ""}`}
                onClick={() => selectStage(i)}
                aria-pressed={stage === i}
              >
                <span className="chapter-top">
                  <span className="chapter-number">0{i + 1}</span>
                  <c.icon size={17} />
                </span>
                <strong>{c.title}</strong>
                <span className="chapter-description">
                  {
                    [
                      "Start with the structure",
                      "Stretch. Compress. Rearrange.",
                      "See how light changes",
                      "Follow the energy",
                    ][i]
                  }
                </span>
                <ArrowRight className="chapter-arrow" size={17} />
              </button>
            ))}
          </div>
        </section>
        <section id="science" className="science">
          <div className="science-intro">
            <span className="eyebrow">THE SCIENCE, SIMPLIFIED</span>
            <h2>
              It’s not just
              <br />
              <em>a change of color.</em>
            </h2>
            <p>
              A white mark and a warmer bend reveal two different consequences
              of deformation.
            </p>
            <button
              className="text-button"
              onClick={() => {
                reset();
                setStage(null);
                setView("material");
                document.getElementById("experiment")?.scrollIntoView({
                  behavior: reduced ? "instant" : "smooth",
                });
              }}
            >
              Start with a fresh specimen <RotateCcw size={14} />
            </button>
          </div>
          <div className="science-details">
            <article className="science-card">
              <span className="card-index">01 / STRUCTURE → LIGHT</span>
              <h3>White is scattered light.</h3>
              <p>
                Microvoids, crazes and other changes create optical
                irregularities. They redirect light, so the bent region can look
                cloudy. Whitening is a structural response, not a white pigment.
              </p>
              <div
                className="scattering-diagram"
                aria-label={
                  hasDamage
                    ? "Conceptual light is scattered by damaged structure"
                    : "Conceptual light travels through the material"
                }
              >
                <span>LIGHT IN</span>
                <svg viewBox="0 0 320 70">
                  <defs>
                    <linearGradient id="light-grad">
                      <stop stopColor="#dbe8ab" stopOpacity="0" />
                      <stop offset="1" stopColor="#dbe8ab" />
                    </linearGradient>
                  </defs>
                  {[18, 35, 52].map((y) => (
                    <path
                      key={y}
                      d={`M0 ${y} H130`}
                      stroke="url(#light-grad)"
                    />
                  ))}
                  <rect
                    x="130"
                    y="5"
                    width="55"
                    height="60"
                    rx="5"
                    fill={hasDamage ? "#cdd6b055" : "#8cb79733"}
                    stroke="#91b58a"
                  />
                  {[18, 35, 52].map((y, i) => (
                    <path
                      key={y}
                      d={`M185 ${y} L320 ${hasDamage ? (i === 0 ? 0 : i === 1 ? 35 : 70) : y}`}
                      stroke="#dbe8ab"
                      opacity=".7"
                    />
                  ))}
                  {hasDamage &&
                    [20, 35, 50].map((y, i) => (
                      <ellipse
                        key={y}
                        cx={148 + i * 9}
                        cy={y}
                        rx="3"
                        ry="6"
                        fill="#dfe6cf"
                      />
                    ))}
                </svg>
                <span>{hasDamage ? "SCATTERED" : "TRANSMITTED"}</span>
              </div>
            </article>
            <article className="science-card energy-card">
              <span className="card-index">02 / WORK → ENERGY</span>
              <h3>Not all work becomes heat.</h3>
              <p>
                Loading stores recoverable elastic energy and can change the
                material’s structure. Dissipative processes turn part of the
                work into thermal energy.
              </p>
              <div
                className="energy-bar"
                aria-label="Illustrative energy ledger, not measured fractions"
              >
                {fractions.map((v, i) => (
                  <span key={i} style={{ width: `${v * 100}%` }} />
                ))}
              </div>
              <div className="energy-key">
                <span>
                  <i />
                  Elastic
                </span>
                <span>
                  <i />
                  Structural
                </span>
                <span>
                  <i />
                  Dissipated
                </span>
              </div>
              <small>
                Illustrative ledger · includes accumulated dissipation, even
                after cooling. Elastic energy can return on release.
              </small>
            </article>
            <article className="preset-card">
              <span className="preset-badge">{p.short}</span>
              <div>
                <h3>{p.family}</h3>
                <p>{p.description}</p>
              </div>
            </article>
          </div>
        </section>
        <section className="takeaway">
          <span className="takeaway-icon">
            <Check size={23} />
          </span>
          <div>
            <span className="eyebrow">TAKE THIS WITH YOU</span>
            <p>
              A bend changes structure. Structure changes light.
              <br />
              Dissipating work can make the material warm.
            </p>
          </div>
          <MoveUp size={24} />
        </section>
        <section className="accuracy">
          <details>
            <summary>
              <span>
                <Info size={16} />A model for understanding. Not a prediction.
              </span>
              <ChevronDown size={16} />
            </summary>
            <div className="accuracy-body">
              <p>
                This is a qualitative educational model, not finite-element
                analysis, molecular dynamics or an optical solver. The bend
                amount is an exhibit control, not measured strain. Geometry,
                chain motion, defect size, apparent opacity, cooling and energy
                proportions are authored illustrations.
              </p>
              <p>
                Presets show representative behavior families, not calibrated
                material samples. Formulation, crystallinity, processing,
                temperature, loading rate and thermal conditions matter. Not
                every plastic whitens; not every white region contains the same
                defects. Chains are entangled, not necessarily chemically
                crosslinked. The PS preset omits fracture.
              </p>
              <p>
                The thermal colors show relative dissipative warming, not a
                temperature prediction. Real deformation can initially cool
                through reversible thermoelastic effects; immediate temperature
                change is not always positive. This simplified model omits that
                effect. Heat represents energy transfer, not a substance or
                macroscopic chain friction.
              </p>
              <p>
                Energy bars are a dimensionless illustrative ledger of current
                elastic energy, structural work and accumulated dissipation.
                They do not measure material-specific fractions or solve a
                complete loading/unloading energy balance. Reset creates a fresh
                specimen; releasing cannot erase the model’s irreversible
                whitening.
              </p>
              <div className="sources">
                <a
                  href="https://doi.org/10.1002/polb.22020"
                  target="_blank"
                  rel="noreferrer"
                >
                  Stress whitening in polypropylene · research{" "}
                  <ExternalLink size={12} />
                </a>
                <a
                  href="https://doi.org/10.1016/S0020-7683(99)00107-9"
                  target="_blank"
                  rel="noreferrer"
                >
                  Temperature changes in thermoplastics · research{" "}
                  <ExternalLink size={12} />
                </a>
                <a
                  href="https://www.unsw.edu.au/science/our-schools/materials/engage-with-us/high-school-students-and-teachers/online-tutorials/polymers/properties-and-deformation/crazing-and-shear-banding"
                  target="_blank"
                  rel="noreferrer"
                >
                  Crazing & shear banding · UNSW <ExternalLink size={12} />
                </a>
              </div>
            </div>
          </details>
        </section>
      </main>
      <footer>
        <a className="brand" href="#">
          <span className="brand-symbol">
            m<span>·</span>
          </span>
          <span>
            MATTER<span className="brand-light">LAB</span>
          </span>
        </a>
        <span>Everyday things. Extraordinary physics.</span>
        {sourceUrl ? (
          <a href={sourceUrl} target="_blank" rel="noreferrer">
            Explore the source <ArrowUpRight size={13} />
          </a>
        ) : (
          <a href="#science">
            Understand the science <ArrowUpRight size={13} />
          </a>
        )}
      </footer>
      <dialog
        aria-label="Microscopic world"
        ref={dialog}
        onCancel={() => setMicroOpen(false)}
        onClose={() => setMicroOpen(false)}
        className="micro-dialog"
      >
        <div className="dialog-top">
          <div>
            <span className="eyebrow">INSIDE THE BEND</span>
            <h2>The microscopic world.</h2>
          </div>
          <button
            className="icon-button"
            aria-label="Close microscopic view"
            onClick={() => setMicroOpen(false)}
          >
            <X size={20} />
          </button>
        </div>
        {microOpen && <Microstructure live={live} large />}
        <div className="dialog-caption">
          <span>{p.mechanism}</span>
          <p>
            {hasDamage
              ? "Optical irregularities scatter light. The cavities are schematic and enormously exaggerated."
              : "Tangled chains rearrange as the material deforms. Use the slider to reveal the changes."}
          </p>
          <label htmlFor="micro-bend">
            Bending amount · {Math.round(target * 100)}/100
          </label>
          <input
            id="micro-bend"
            type="range"
            min="0"
            max="100"
            value={Math.round(target * 100)}
            onChange={(e) => bend(Number(e.target.value) / 100)}
          />
          <small>
            Conceptual geometry · not molecular dynamics · not to scale
          </small>
        </div>
      </dialog>
    </>
  );
}
export default App;
