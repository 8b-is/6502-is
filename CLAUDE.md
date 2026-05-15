# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install          # Install dependencies
npm run dev          # Start Vite dev server with HMR
npm run build        # Production build → dist/
npm run preview      # Preview built output locally
npm run lint         # ESLint (flat config in eslint.config.js)
```

Docker (Coolify-compatible, multi-stage build → Nginx static serve):

```bash
docker-compose up -d --build      # Serve built app on $PORT (defaults to 6502:80)
```

There is no test framework in this project — `test_engine.js`, `scratch.js`, and `scratch2.js` at the repo root are ad-hoc Node scripts, not a suite.

## Regenerating generated code

Two files in `src/` are produced by helper scripts and should be regenerated rather than hand-edited:

- **`src/simulation/engine.js`** — assembled by `node build_engine.cjs` from `visual6502-ref/{nodenames,transdefs,chipsim,macros}.js`. The `visual6502-ref/` directory is gitignored; you need a checkout of the original Visual6502 sources to rebuild. The script wraps the legacy IIFE-style code into ES modules, stubs out DOM globals (`document`, `setStatus`, etc.), and silences `console.log` by rewriting it to `void(`.
- **`src/utils/disassembler.js`** — produced by `python parse_opcodes.py`, which parses opcode tables out of `6502.md` (a Wikipedia-format reference of every 6502 instruction).

`fix_css.py` is a one-shot patcher for the top-dashboard CSS block — not part of any normal workflow.

## Architecture

This is a WebGL reimagining of [visual6502.org](http://www.visual6502.org/): the transistor-level 6502 simulator rendered as a 3D chip die in React Three Fiber.

### Three layers, loosely coupled

1. **Simulation engine** (`src/simulation/engine.js`, ~5600 lines, generated) — a port of the original Visual6502 transistor net solver. It owns global module-level state: the `nodes[]` array (each with `state`, `pullup`, `pulldown`, connected `gates` and `c1c2s` transistors), the `transistors` map, and the `userCode[]` buffer that backs the simulated memory. Key exports used by the rest of the app: `initChip()`, `step()` (one half-clock), `loadProgram()`, `getMachineState()`, `mRead`, `mWrite`, `toggleNode(id)`, and the `nodes`/`ngnd`/`npwr` references for the renderer to read state from. Setup runs automatically at import time (`setupNodes()` / `setupTransistors()` / `setupNodeNameList()` are invoked once at module load).

2. **Geometry layer** (`src/utils/geometryBuilder.js` + `src/data/segdefs.js`, ~1MB of segment polygons) — `buildChipGeometries()` turns each segdef polygon into an extruded `THREE.Shape`, tagged with the original chip's coordinate system (origin at 5000,5000 → scaled to roughly 100 units), grouped and `mergeGeometries`'d by physical layer (Metal, Polysilicon, Powered/Grounded/Switched Diffusion, Input Diode). The node ID for each polygon is baked into the merged BufferGeometry as a custom `aNodeId` vertex attribute so the GPU can look up per-node state at render time.

3. **Renderer + UI** (`src/components/`) — `Chip3D.jsx` is the R3F canvas. It builds one mesh per layer and uses `onBeforeCompile` to inject custom GLSL into `meshPhysicalMaterial`. Live node state is uploaded each frame to a 2048×1 `DataTexture` (`nodeStateTexture`), and the shader samples `vNodeId / 2048.0` to color polygons based on whether their node is high. A second `tracePathTexture` lights up nodes reachable through currently-on transistors when the user clicks (BFS in `Chip3D.jsx` onClick handler, deliberately stopping at `ngnd`/`npwr` to prevent explosion). `App.jsx` owns layer-visibility/opacity state, the diagram overlay config, theme mode ('full' vs 'safe' = lower-contrast), and an emergency-stop flag that freezes the shader clock.

### How simulation drives the visuals

`ProgrammingPanel.jsx` is the driver loop:

- Parses the hex textarea into bytes, copies them into the engine's `userCode[]`, calls `loadProgram()` then `initChip()`.
- For clock ≤ 60 Hz: one `step()` per `setTimeout(1000/Hz)` so individual cycles are visible.
- For higher Hz: batches up to ~5000 `step()` calls per animation frame; visual updates throttle to one `getMachineState()` per frame (the chip is CPU-bound, not GPU-bound).
- After each visible step it calls `setSharedMachineState`, which propagates up to `App` and down to `Chip3D`, which walks `nodes[]` and rewrites the 2048×4 `Uint8Array` that backs `nodeStateTexture` — only setting `needsUpdate = true` if any byte changed.

### Mobile vs desktop UI

`ProgrammingPanel` and `LayerToggle` both switch their entire render tree on `window.innerWidth < 1024`. Mobile uses floating round icon buttons + a modal editor; desktop uses collapsible glass panels. The two paths are not visually similar — when changing one, check whether the change should mirror to the other.

### Public assets worth knowing

`public/cd.svg` is the chip diagram overlay (loaded by `PlexiglassOverlay`), `public/potsdamer_platz_1k.hdr` is the IBL environment for `meshPhysicalMaterial`. Both are large; don't inline.
