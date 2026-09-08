# Studio Cadenza — Phases 4–6

This release extends the Phase 3 scene architecture rather than replacing it.

## Phase 4 — Manufacturing Intelligence
- `src/services/manufacturingEngine.ts` builds a deterministic manufacturing plan from `manufacturingIncluded` objects.
- Estimates vector path length, machine time, stock/waste utilization and operation type.
- Keeps editor visibility separate from manufacturing inclusion.

## Phase 5 — AI / Parametric Design
- `src/services/aiDesignEngine.ts` converts natural-language intent into editable vector geometry and design intent.
- The engine is deterministic/offline-safe so the editor does not depend on an external model being available.
- Existing server AI endpoint remains compatible; the command center can apply generated geometry directly to the Scene Store.

## Phase 6 — Release / QA
- `src/services/projectQuality.ts` audits schema, scene indexing, material references and vector validity.
- `ReleaseCommandCenter` exposes the Phase 4–6 workflow inside the studio.
- Includes manufacturing-plan rebuild, AI synthesis/apply, release audit and selected-object duplication.

## Verification limitation
The current environment cannot complete `npm install` from the npm registry, so a real browser/Vite runtime build cannot be claimed here. The release has been checked structurally and with TypeScript parser/type analysis; dependency-resolution errors are expected until dependencies are installed in Replit/local development.

## Recommended runtime
Import this repository into Replit, install dependencies, then run the existing scripts:
- `npm install`
- `npm run build`
- `npm run dev`
