# Implementation and completion plan

Goal: a polished, browser-based educational exhibit, published on GitHub Pages with inspectable source when publishing capabilities permit.

The design is described in DESIGN.md. React owns controls and guidance; a dimensionless history model drives both Three.js scenes and SVG fallbacks. No backend or private credentials are required. Native implementation is used under the user's explicit autonomous instruction.

- [x] Inspect the existing source, model tests, configuration and account capabilities.
- [x] Improve fallback views so deformation, defects, light and thermal state remain synchronized when WebGL fails. Verify with rendered component tests.
- [x] Make central geometry independently testable: neutral length preservation, outer tension, inner compression and symmetry. Use it in the 3D mesh.
- [x] Improve mobile control placement, fresh-specimen access, context-loss handling and scientific sources.
- [x] Add README, license, Pages workflow and deployment helper that creates a new repository without overwriting one.
- [x] Run all tests, typecheck, production build and static-hosting checks. Attempt visual QA only with a working browser; record unavailable checks explicitly.
- [x] Commit source locally, publish if available operations permit, otherwise provide a portable package and the exact blocker.

Review focus: permanent history must survive release; reset must clear it; presets must reset incompatible state; paused and reduced-motion modes must remain controllable; fallback visuals must reflect current state; source links must not claim an uncreated repository exists. Publishing must never overwrite an existing repository.

## Capability findings

GitHub authentication works for jeemzy. The suggested repository returned 404. The connected GitHub operations do not include repository creation or Pages settings. The cloud browser's state and reset calls both timed out. The local runtime can compile and test; the browser binary download returned an HTML 'Site Unavailable' page rather than Chromium. These constraints prevent honest claims of browser visual verification or deployment until an appropriate surface becomes available.

## Final review and rulings

An independent read-only reviewer checked source, scientific claims, shader hooks, controls, tests and deployment. Three important findings were addressed: phase uniforms for shader caching, fallback removal on context restoration and distinct 2D strain faces. A narrow-screen transport wrap was added. GPU and visual verification remain unavailable; these fixes do not establish a measured frame rate or visual sign-off.

Ruling: proceed with native implementation and no routine approval pauses because the user expressly authorized that workflow. Ruling: do not modify an existing GitHub repository to bypass unavailable repository-creation operations. Ruling: deliver a tested standalone application and complete Pages source package without claiming publication.
