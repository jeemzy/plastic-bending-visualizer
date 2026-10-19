# Verification and delivery status

Authoring date: 19 October 2026.

## Completed checks

- `npm test`: **19 passing tests** — eight material-model tests, three bending-geometry tests, seven rendered SVG tests and one integrated React DOM test covering multiple control sequences.
- `npm run typecheck`: passed with strict TypeScript options.
- `npm run build`: passed. Production JavaScript is split into application and Three.js chunks; fonts are self-hosted.
- `npm run test:static`: passed. The production index, its four referenced assets and two font files resolve under a GitHub Pages project path. The index and directly referenced assets were served locally and returned HTTP 200.
- `npm run test:standalone`: passed. The complete HTML file contains embedded scripts, styles and fonts with no external script imports. Its bundled production code booted in a virtual DOM, switched to a guided whitening stage and produced the corresponding cavities and retained whitening.
- Independent read-only code review completed. Corrections: per-chain phases now use uniforms instead of inconsistent cached shader source; context restoration clears fallback overlays; the 2D strain view distinguishes tension and compression with bend-dependent colors and uses the tested beam coordinates. The strain-view regression test failed before the fix and passes afterward.

The integrated DOM check exercised guided chapters, preset switching, release/reset, irreversible damage, flexible-material recovery, thermal selection, stationary cooling, pause/resume, light toggle, slow motion and replay. A virtual DOM does **not** verify visual appearance, actual GPU rendering, pointer gestures, native focus behavior or screen-reader operation.

## Browser checks blocked in this environment

Both the cloud browser state request and its reset timed out. Standard Chromium download returned an HTML "Site Unavailable" response rather than a browser archive. An alternative packaged Chromium executable downloaded successfully and reported its version, but the runtime terminated the browser at launch with `SIGTRAP` before any page could open. A minimal standalone browser launch failed the same way.

Consequently **desktop/mobile screenshots, live 3D GPU rendering, shader compilation, dragging and native-dialog behavior have not been visually verified**. Responsive CSS is implemented, including wrapping controls at narrow widths; it has not been inspected in a rendered browser. Do not interpret the passing DOM tests or build as visual sign-off.

`tests/browser.mjs` contains the browser checks for a normal development environment and CI. GitHub Actions is configured to run them before deployment. Those CI runs have not occurred.

## Publishing status

**Not published. No remote repository was created, committed to or pushed. No live website or source-repository URL is claimed.**

The connected GitHub account was accessible. The suggested `jeemzy/plastic-bending-visualizer` repository returned 404. Available GitHub connector operations do not include creating repositories or configuring Pages, GitHub CLI is absent from the authoring environment, and browser control was unavailable. Existing repositories were not used as a substitute.

Source is committed in a local Git repository. The delivery archive contains the source, production `dist/`, self-contained `standalone/under-pressure.html`, and a portable `source-history.bundle` of the local commit. Restore the checkout and history with:

```sh
git clone source-history.bundle plastic-bending-visualizer-checkout
cd plastic-bending-visualizer-checkout
git remote remove origin
npm ci
```

Then use the README's GitHub CLI helper or manual instructions to create a **new** public repository and enable Pages. The workflow is prepared, not executed or verified. Account policies may require additional configuration.

## Scientific and technical bounds

The model and all visual scales are qualitative. No calibrated force, temperature, strain or energy-fraction predictions are made. Defect mechanisms and heat responses differ between formulations. Thermoelastic cooling, fracture, crystallite geometry and a complete energy balance are omitted; schematic cloud shading, light rays and chain motion are not numerical solvers. The detailed limitations panel and README describe these choices.

Expanded microscopy is a separate synchronized view. Continuous macro-to-molecular camera travel, a force/deformation graph and side-by-side bend comparisons are omitted. Ordinary-hardware frame rate, actual mobile touch behavior and accessibility with assistive technology remain unmeasured.
