# Under Pressure — design and implementation brief

An accessible interactive science exhibit for non-specialists, with a premium dark gallery aesthetic and sage accents. A large manipulable Three.js plastic beam and a synchronized molecular cutaway share a single qualitative state model. Four guided chapters introduce structure, stress, whitening, and heat; free exploration keeps all controls available.

## Architecture

React + TypeScript + Vite, imperative Three.js renderers with cleanup and responsive sizing. `model.ts` owns history-dependent bend, residual set, irreversible whitening, dissipated work and cooling. `Specimen.tsx` owns a procedurally deformed physical material mesh. `Microstructure.tsx` owns tangled chain curves, schematic voids and animated light rays. `App.tsx` owns controls and journey. CSS supplies responsive layout and reduced-motion support. No remote assets, backend or secrets.

## Scientific scope

Visual parameters are authored storytelling choices, not measured constants. Presets are representative behavior families, not predictions for every formulation. Energy indicators have no physical units or measured fractions. No force, strain, temperature or defect-size predictions. Microscopic chains, voids, fibrils and light paths are conceptual and not to scale. Not all whitening has the same mechanism. Heat is energy dissipation; reversible thermoelastic temperature changes are omitted and explicitly acknowledged.

## Verification and deployment

Test recovery, history, residual set, stationary cooling, speed effects, pause, reset and numerical boundedness before integration. Build and typecheck; inspect browser screenshots and interactions at desktop and narrow widths, plus WebGL fallback. Static relative Vite base supports GitHub Pages project paths. GitHub Actions runs tests and build before Pages upload/deploy. A new public repository must be created without overwriting any existing one.

## Execution sequence

1. Write model invariants as failing tests, implement model, run suite.
2. Implement macro and micro views and responsive exhibit controls, build.
3. Inspect actual browser experience and repair observed failures.
4. Document usage, limitations and sources; commit all source.
5. Create repository, publish, enable Pages and verify live UI if available permissions permit.

User explicitly authorized autonomous creative decisions, implementation, public source creation and GitHub Pages publishing. Routine design and plan approval pauses are waived by that instruction.
