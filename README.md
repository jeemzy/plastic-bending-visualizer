# Under Pressure · Matter Lab

A hands-on 3D exhibit about plastic bending, stress whitening, light scattering and dissipative warming. Built with React, TypeScript, Vite and Three.js. Static hosting only; no backend, analytics, authentication, secrets or paid APIs.

## Try the exhibit

- Drag upward on the specimen or use **Bending amount**. Range inputs support keyboard arrows, Home and End.
- Switch between **Material**, **Strain** and **Thermal** views.
- Compare a polypropylene-like material, a polystyrene-like material and an idealized flexible elastomer.
- Watch the synchronized tension-side microscopic view: chains rearrange, schematic cavities appear, and incoming light scatters. Expand the view to explore it with its own bending slider.
- **Release bend** removes the applied bend. Small bends recover; susceptible samples retain whitening and a residual set after strong bends.
- The sparkle button in the control deck creates a **fresh specimen**. Material changes also clear history.
- Use the four chapter cards, pause/resume, replay and quarter-speed motion. Ambient microscopic motion respects reduced-motion preferences.
- With WebGL unavailable, synchronized SVG views still show bending, whitening, light scattering and relative warming.

## Develop

Node **22.18+** is required (CI uses Node 24).

```sh
npm ci
npm run dev
```

```sh
npm test              # model, geometry, rendered fallbacks, DOM interactions
npm run typecheck
npm run build         # production output in dist/
npm run preview
```

For a self-contained copy that opens directly from disk:

```sh
npm run preview:single
```

Open `standalone/under-pressure.html` in a modern browser. All code and visual assets are embedded. This is the same application without a server, not a recording or static image.

## Browser verification

```sh
npx playwright install --with-deps chromium
npm run build
npm run test:e2e
```

The test starts and closes its own static server under `/plastic-bending-visualizer/`. It exercises guided stages, release/reset, slider input, pause/resume, presets, thermal mode, light toggling, modal controls, replay, direct dragging, mobile/tablet width, reduced motion and WebGL fallback. Screenshots and a result file are written to `verification/`. An optional `CHROMIUM_EXECUTABLE` environment variable selects an already-installed browser. `CHROMIUM_SINGLE_PROCESS=1` is only for constrained test runtimes.

## Publish to GitHub Pages

The project uses relative Vite asset paths (`base: './'`), so it supports a GitHub Pages project path and renamed repositories. `.github/workflows/pages.yml` installs locked dependencies, runs unit and DOM tests, builds, runs Chromium tests, uploads browser artifacts and deploys to Pages only if checks pass. Only the deployment job receives Pages/OIDC write permissions.

### Automated first deployment

Install and authenticate [GitHub CLI](https://cli.github.com/). From a clean local Git repository with a `main` branch and no existing remotes:

```sh
npm run deploy
```

The helper checks authentication, refuses to use an existing `plastic-bending-visualizer` repository, runs tests/build, creates a new public repository, enables the GitHub Actions Pages source, then pushes `main`. It never overwrites another repository. GitHub/account policies may require additional authorization. If a step fails after repository creation, finish setup manually in that new repository instead of rerunning the creation helper.

### Manual first deployment

1. Create a new public repository named `plastic-bending-visualizer`. Do not initialize it with a README or reuse a repository containing other work.
2. Initialize the extracted source if it is not already a Git checkout:

```sh
git init -b main
git add .
git commit -m "Build interactive polymer physics exhibit"
```

3. Add the URL of **your new repository**, then push:

```sh
git remote add origin https://github.com/YOUR_USERNAME/plastic-bending-visualizer.git
git push -u origin main
```

4. In **Settings → Pages → Build and deployment → Source**, choose **GitHub Actions**. If the first workflow ran before Pages was enabled, rerun it from **Actions**.
5. Open the URL shown by the successful deployment and confirm its controls work. A committed workflow is not itself evidence of a live deployment.

The workflow sets `VITE_SOURCE_URL` to its actual repository URL, enabling the site's source link. Local builds show a science link instead. No uncreated repository is presented as a working link.

## Scientific model and limitations

This is an educational animation, not a finite-element, optical, molecular-dynamics or constitutive material solver. All parameters and thresholds are dimensionless storytelling choices. **No material-specific forces, strain thresholds, temperatures or energy fractions are predicted.** The 0–100 slider describes the exhibit's bending control, not a percentage strain.

The prescribed beam geometry preserves neutral-line length while lengthening the outer face and shortening the inner face. The material model interpolates toward a requested bend, accumulates irreversible illustrative damage and residual set in susceptible presets, generates a relative dissipative thermal signal during motion, and cools toward ambient while stationary. Greater speed changes the time available for cooling and the illustrative loss rate.

The microscopic view represents a tension-side region. Chain geometry and motions, cavity sizes, craze fibrils, light rays, apparent opacity and thermal colors are exaggerated conceptual cues. Chains are entangled; their intersections do not imply chemical crosslinks. The PP preset uses generic cavities and rearrangement, the PS preset adds schematic craze fibrils and omits fracture, and the TPE preset represents one idealized recoverable response. Real formulations differ.

The energy bar compares current elastic energy, accumulated structural work and accumulated dissipated work in arbitrary units. Dissipation remains in that history after cooling. The bar does not solve a complete loading/unloading energy balance and is not a measured fraction of input work. Dissipative heating is not macroscopic chain friction, and mechanical work does not all become heat. Reversible thermoelastic cooling/heating is omitted, so this exhibit does not reproduce every possible immediate thermal response.

The nominal white region uses a procedural cloud-density surface approximation, not volume scattering or a physical optical calculation. No free-orbit camera, continuous macro-to-molecular zoom, force plot, side-by-side material comparison, fracture or self-contact solver is included. The expanded microscopic view and synchronized side panel provide the magnification interaction.

### Further reading

- Pawlak & Galeski (2010), [Cavitation and morphological changes in polypropylene deformed at elevated temperatures](https://doi.org/10.1002/polb.22020). Demonstrates how morphology and deformation conditions affect cavitation and translucency.
- [Crazing and shear banding](https://www.unsw.edu.au/science/our-schools/materials/engage-with-us/high-school-students-and-teachers/online-tutorials/polymers/properties-and-deformation/crazing-and-shear-banding), UNSW. Introductory explanation of void-containing craze regions and fibrillar ligaments.
- [Experimental studies on the temperature fluctuations in deformed thermoplastics with defects](<https://doi.org/10.1016/S0020-7683(99)00107-9>). Discusses reversible and irreversible thermal responses.
- [Kinetics of stored and dissipated energies associated with cyclic loadings of dry polyamide 6.6 specimens](https://www.sciencedirect.com/science/article/abs/pii/S0142941814000312). Experimental work distinguishing energy storage from dissipation.

## Source layout

| File                     | Responsibility                                                 |
| ------------------------ | -------------------------------------------------------------- |
| `src/model.ts`           | Qualitative material history, dissipation and cooling          |
| `src/geometry.ts`        | Prescribed beam coordinates and face-length relationships      |
| `src/Specimen.tsx`       | Mesh deformation, procedural whitening and visualization modes |
| `src/Microstructure.tsx` | Chain, cavity, fibril and light animations                     |
| `src/FallbackViews.tsx`  | Synchronized SVG alternatives                                  |
| `src/scene.ts`           | Renderer sizing and GPU resource disposal                      |
| `src/App.tsx`            | Controls, state coordination, guided chapters and explanations |
| `src/style.css`          | Responsive layout, typography, focus and reduced-motion styles |
| `tests/`                 | Model, geometry, rendered component, DOM and browser tests     |
| `scripts/`               | Standalone bundling and cautious first-deployment helper       |

See `docs/VERIFICATION.md` for the checks actually completed in the authoring environment and publication status. Source is MIT licensed; dependency licenses remain with their authors.
