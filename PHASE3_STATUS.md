# Studio Cadenza — Phase 3 build status

Implemented from the Phase 2 source plus the supplied Phase 3 architecture specification.

## Canonical state
- `useSceneStore` is the canonical scene/document/object graph.
- `useEditorUIStore` owns editor/viewport UI state.
- Phase 2 `useProjectStore` is now a compatibility facade over `useSceneStore`; it does not own objects.
- `useTileStore` no longer imports `useProjectStore` for object state.

## Scene model
- `SceneObject` supports independent architectural objects and vector objects.
- `visible` is separate from `manufacturingIncluded`.
- A second independent architectural object (`object_stair_demo`) is included as a proof of multi-object scenes.
- Object transforms are stored as 3D transforms.
- Archetype geometry is stored on the object instead of being only global UI state.

## Persistence / migration
- Current serialized format is schema v2.
- v1 projects are migrated to v2 by splitting the old vector paths into `vector_object` scene objects.
- File Save/Open uses the v2 snapshot through `useSceneStore`.

## Manufacturing
- CAM QC and DXF selection use `manufacturingIncluded`, not layer visibility.
- Editor visibility remains controlled by object/layer visibility.

## Rendering
- Existing rich archetype renderers were preserved.
- Added scene rendering infrastructure under `src/rendering/`.
- 3D selection is connected to the canonical scene selection for the primary object and the independent stair demo.

## Verification
- TypeScript parser/type pass was run without installed dependencies using `tsc --noResolve`; no syntax/semantic errors were reported after filtering expected missing-package resolution errors.
- A full Vite build was **not** executed because the environment could not complete dependency installation from the npm registry/cache. Runtime/browser verification therefore remains to be done on a machine with dependencies installed.
