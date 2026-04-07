## Plan: Prune V1-Only Artifacts from neubau

Prune the legacy runtime in controlled phases: remove isolated v1 source first, then switch build/package metadata to v2-only, then verify.
This minimizes risk while matching your decisions: v2-only export now, docs/tests cleanup as follow-up.

**Steps**
1. Phase 1: Baseline scan on `neubau`
Identify all current references to v1 entrypoints/selectors so each later deletion is auditable.
2. Phase 2: Remove isolated v1 panel framework (low risk)
Delete `src/panel/debug.ts`, `src/panel/filter.ts`, `src/panel/full-control.ts`, `src/panel/inner.ts`, `src/panel/messages.ts`, `src/panel/modus.ts`, `src/panel/names.ts`, `src/panel/slow-motion.ts`, `src/panel/transition.ts`, plus `src/reopener.ts` and `src/dragging.ts`.
This can run immediately.
3. Phase 3: Remove v1-linked orchestration modules (depends on 2)
Delete `src/animations.ts` and `src/twin.ts` after confirming no imports from v2 paths.
4. Phase 4: Remove remaining v1 style path modules (depends on 3)
Audit and then remove `src/styles.ts` and `src/stylesheets.ts` unless a clearly reusable helper must be relocated first.
5. Phase 5: Remove v1 entrypoint (depends on 4)
Delete `src/index.ts` and eliminate any leftover references.
6. Phase 6: Switch build/publish to v2-only (depends on 5)
Update `bin/bundle` to stop producing `lib/index.js`.
Update `package.json` so published entry metadata points to `lib/attach.js` and no longer expects `lib/index.js`.
7. Phase 7: Remove leftover artifacts (parallel with 6 once unreferenced)
Remove `public/marker.js` if no references remain, and stop tracking `lib/index.js` as expected output.
8. Phase 8: Follow-up cleanup (separate pass)
Prune v1 mentions in docs/tests after core code/build pruning is stable, to keep first PR focused.

**Relevant files**
- `src/index.ts`
- `src/panel/debug.ts`
- `src/panel/filter.ts`
- `src/panel/full-control.ts`
- `src/panel/inner.ts`
- `src/panel/messages.ts`
- `src/panel/modus.ts`
- `src/panel/names.ts`
- `src/panel/slow-motion.ts`
- `src/panel/transition.ts`
- `src/animations.ts`
- `src/twin.ts`
- `src/reopener.ts`
- `src/dragging.ts`
- `src/styles.ts`
- `src/stylesheets.ts`
- `bin/bundle`
- `package.json`
- `public/marker.js`

**Verification**
1. Run reference scans before/after each phase for imports of v1 files and selector prefix `#vtbag-ui-`.
2. Run build and confirm `lib/attach.js` is generated without any dependency on `lib/index.js`.
3. Validate package entry resolution from `package.json` for v2-only consumption.
4. Run Playwright smoke/list plus one representative capture/animation flow.
5. Confirm no stale imports in v2 surfaces like `src/components/ic/Main.astro`, `src/attach.ts`, and e2e fixtures.
