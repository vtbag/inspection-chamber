# Inspection Chamber (New Version) — Working Guide

This document is a focused map of the **new implementation only**.
It intentionally excludes legacy/old-version flows and files.

## Scope (what to treat as "new")

Primary focus files:

- `src/attach.ts` (runtime entry injected into inspected page)
- `src/pages/InspectionChamber.astro` (new chamber UI page)
- `src/components/Window.astro` (dock/undock/floating chamber window)
- `src/components/ic/*` (IC UI + capture/animation analysis)
- `src/components/ic/hooks.ts` (view-transition lifecycle hooks and bridge events)

Explicitly ignored for this guide:

- `src/bench.html`, `src/bench.txt`
- legacy path rooted in `src/index.ts` and `src/panel/*`
- non-new-version outputs (`lib/*`, `public/*`, `nsrc/*`, etc.) except where needed to explain bundling

---

## Build + bundle pipeline (new path)

`bin/bundle` does the following relevant steps:

1. `astro build`
2. Builds `dist/InspectionChamber/index.html` into a single-file artifact via Vite + `IC-vite.config.ts`, outputting to `dist/IC/InspectionChamber/index.html`
3. Bundles `src/attach.ts` into `lib/attach.js`
4. Appends a generated `htmlString(src, title)` function to `lib/attach.js`, embedding the built chamber HTML from `dist/IC/InspectionChamber/index.html`
5. Replaces placeholders in embedded HTML:
   - `__vtbag_inspection_chamber_title__` -> runtime title
   - `/vtbag_inspection_chamber_src__/` -> inspected page URL

Notes:

- The script references `dist/IC/InspectionChamber/index.html` (with **Inspection** spelling).
- The generated `lib/attach.js` is the distributable integration artifact.

---

## Runtime architecture (new version)

### 1) `src/attach.ts` (entry behavior)

- **Top window (`parent === self`)**:
  - On idle, replaces current document with embedded Inspection Chamber HTML by calling `replaceDocument(location.href, document.title)`.
- **Iframe context**:
  - Runs `setup()` and waits/reloads until `parent.__vtbag.ic2` is ready.
  - Monkey-patches `Element.prototype.startViewTransition` and `document.startViewTransition` with `ic2.monkey` from hooks.
  - Subscribes to lifecycle events:
    - `pageswap` -> `ic2.pageswap`
    - `pagereveal` -> `ic2.pagereveal`
    - `animationstart` -> `ic2.animationStart`
    - `animationend` -> `ic2.animationStop`

### 2) `src/pages/InspectionChamber.astro` (shell page)

- Defines split layout:
  - `#specimen` with `#test-jig` iframe (inspected content)
  - `#twins` overlay for pseudo/twin visualization
  - draggable `#dragBar`
  - `#dock` with iframe containing `<vtbag-ic-main>` controls
  - floating `<Window>` fallback/alternate view
- Calls `setupHooks(contentIframe.contentWindow)` to initialize `ic2` bridge.
- Handles long-tap docking transitions (`longTap`) and stores panel/window placement in `sessionStorage`.
- Sets `IntersectionObserver` to sync pseudo/twin visibility between specimen and controls.

### 3) `src/components/Window.astro`

- Floating/minimizable/resizable controls container.
- Emits `longTap` from resize handles for docking side changes.
- Uses `mayStartViewTransition(..., { useTypesPolyfill: 'always' })` for:
  - resize (`window-resize`)
  - minimize (`minimize`)
- Persists position/size in `sessionStorage` (`vtbag-ic-window-last-drag`).

---

## `ic2` hook core (`src/components/ic/hooks.ts`)

`setupHooks(chamberWindow)` initializes `self.__vtbag.ic2` with bridge functions and shared state.

Important state on `__vtbag.ic2`:

- `chamberWindow`
- `vtMap: Map<HTMLElement, Features>`
- `captureOldOnly`, `captureFreezeTypes`
- `crossDocumentBackNavigation`
- `crossDocumentGroups`

### Event lifecycle emitted into chamber UI

The hook layer dispatches custom events onto `chamberWindow`:

- `ic-before-capture-old`
- `ic-after-capture-old`
- `ic-before-capture-new`
- `ic-after-capture-new`
- `ic-update-error`
- `ic-ready-error`
- `ic-animation-start`
- `ic-animation-stop`
- `ic-about-to-finish`

### Core behavior

- `monkey(originalStartViewTransition)` wraps same-document starts:
  - captures trace/time/root dimensions
  - injects `afterCaptureOld` around update callback
  - triggers `beforeCaptureOld`/new-capture events at the right phases
- `pageswap`/`pagereveal` handle cross-document transitions:
  - collect `Features`
  - manage old-only capture via controlled back navigation
  - optional transition fast-forwarding
- `fastForward()` seeks animations to end-time and optionally pauses transition-type animations (`captureFreezeTypes`).

---

## `src/components/ic/*` module map (important runtime parts)

### Composition root

- `Main.astro` defines `<vtbag-ic-main>` and toggles major mode subtree:
  - `Analyzer` + either `Animations` or `Captures`

### Shared base and utilities

- `ic-element.ts`: base custom-element lifecycle (`setUp`, `render`, `tearDown`)
- `features.ts`: transition metadata type passed through hooks/events
- `message.ts`: central user message dispatcher (`ic-show-message`)
- `debug.ts`: `HOW_IC_CALLS_MSVT_CATCH_ERRORS` flag for `mayStartViewTransition`

### Capture data path

- `capture.ts`:
  - listens for `ic-before-capture-*`
  - computes named transition elements, sparse DOM, grouping tree
  - records groups in `moduleGroupMaps`
  - injects temporary style overrides for auto/match-element naming
  - cleans up on `ic-after-capture-*` and `ic-about-to-finish`
- `group.ts`:
  - core group graph model (`Group`)
  - nesting/ordering (`nestGroups`, DFS numbering)
  - naming/color/display helpers
- `ViewTransitionCapture.astro`:
  - renders captured result details from `moduleGroupMaps` + `vtMap`
  - supports devtools print and highlight interactions

### Animations inspection path

- `Animations.astro`:
  - central animation panel
  - listens to `ic-after-capture-new` and `ic-about-to-finish`
  - creates per-scope elements (`vtbag-ic-scope`)
  - controls freeze/next/run and slow-mo globally
- `Scope.astro`:
  - per-transition-root control panel
  - tracks pseudo animation timeline, slider sync (`ic-time-change`), sort/size/frame options
  - controls per-scope freeze/run state and animation stepping
- `GroupList.astro` / `Group.astro` / `Pseudo*.astro`:
  - structured rendering for grouped pseudo-elements and property details

### Mode switch panel

- `Analyzer.astro`: mode selector (`capture` vs `animation`) stored in `sessionStorage` (`ic-analyzer-mode`) + error surfacing.
- `Captures.astro`: old-only and freeze-types options + capture list rendering.

---

## Key storage and mode flags

Frequently used keys:

- `ic-analyzer-mode` (`capture` | `animation`)
- `vtbag-ic-capture-old-only`
- `vtbag-ic-capture-sort`
- `vtbag-freeze`
- `vtbag-ic-window-last-drag`
- `vtbag-ic-dock-last-drag`

These keys materially affect behavior and should be considered during debugging/repro.

---

## Practical debugging checklist (new version)

1. Confirm `parent.__vtbag.ic2` exists before iframe hook setup.
2. Verify `setupHooks()` runs once with correct `chamberWindow`.
3. Check that `ic-before-capture-old` / `ic-after-capture-new` are firing in expected order.
4. Inspect `parent.__vtbag.ic2.vtMap` and `moduleGroupMaps` during active transition.
5. If capture appears empty, verify analyzer mode (`capture` vs `animation`) and `captureOldOnly` state.
6. If cross-document behaves oddly, inspect `crossDocumentBackNavigation` and `pagereveal/pageswap` suppression.

---

## Notes / cleanup status

- Hook module moved to `src/components/ic/hooks.ts`.
- Removed unused `late` import from hooks.
- Removed unused `safeSetActiveViewTransition()` helper.
- Removed empty `src/ic2/captures.ts`.

---

## Suggested change strategy for future tasks

When making changes, start from the smallest surface that owns the behavior:

- transition lifecycle/bridging issues -> `src/ic2/hooks.ts`
- chamber shell/docking/layout issues -> `src/pages/InspectionChamber.astro` + `src/components/Window.astro`
- capture graph/data correctness -> `src/components/ic/capture.ts` + `group.ts`
- animation controls/timeline UX -> `src/components/ic/Animations.astro` + `Scope.astro`

Avoid touching legacy `src/index.ts` unless explicitly required.
