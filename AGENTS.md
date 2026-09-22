# Prototype Instructions

Run the local server yourself and open the preview in the browser available to this environment. Do not give the user server-start instructions when you can run it.

Before making substantial visual changes, use the Product Design plugin's `get-context` skill when the visual source is unclear or no longer matches the current goal. When the user gives durable prototype-specific design feedback, preferences, or decisions, record them in `AGENTS.md`.

When implementing from a selected generated mock, treat that image as the source of truth for layout, component anatomy, density, spacing, color, typography, visible content, and hierarchy.

Build app UI in `src/`. Keep `.openai/hosting.json`, `worker/index.js`, `scripts/prepare-sites-build.mjs`, and `tests/sites-worker.test.mjs` intact so the same local prototype can be handed to Sites. Before a Sites handoff, run `npm run build` and `npm run test:sites`; the build must leave `dist/client/index.html`, `dist/server/index.js`, and `dist/.openai/hosting.json`.

## CartoKob

- Repository owner must be CartoKob, never DDT95. Do not change global Git author configuration.
- This is the territorial decision-support product, not a municipal statistics catalog.
- Approved design: editorial atlas, ivory ground, navy serif place names, panoramic map.
- Metropolitan France including Corsica. Distinguish commune-level risks from point-level geometries.
- Never turn empty or failed source responses into a favorable diagnosis.
- First map click opens commune portrait; second click in the selected commune opens the exact point/parcel diagnostic. A click in a different commune resets context. Address search goes directly to the point.
- National portrait sources are Insee Melodi, not the DDT95 local JSON datasets. Retain source periods and suppressed/missing values.
- DVF amounts belong to deduplicated mutations, not each row, parcel or dwelling. No inferred price-per-square-metre. Respect coverage gaps in 57/67/68 and PLM arrondissement grouping.
- Serve the bounded `/api/market` route with the app; a static-only deployment would break market data. Keep original Sites runtime files intact.

- Updated layout: compact full-height map with a right-hand information panel, no left menu. Keep CartoKob ivory/navy serif identity. Commune summary stays above parcel details; use expandable thematic details and independent panel scrolling. On mobile keep the map visible above the panel.
