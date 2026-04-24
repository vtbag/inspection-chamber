---
name: capture-basic-tests
description: 'Create and extend simple Playwright tests. Use for extending  src/e2e/20_capture-basic.spec.ts. Focus on one case per test, direct setup, and validating both UI and devtools payload.'
---

# Capture Basic Tests

## Procedure
1. Confirm case wiring in `src/pages/e2e/capture-basic.astro`.
2. Duplicate the closest existing test in `src/e2e/20_capture-basic.spec.ts`. Change only: trigger selector, expected type text, tree/flat-list/devtools expectations.
3. Setup (keep verbatim): `goto('/e2e/capture-basic/')` → long-press `div.resize-handle.edge.s` → close welcome panel if visible → enable `#capture` via `label[for="capture"]` click.
4. Trigger: `testFrame.locator('#trigger-<case>').click()`.
5. Assert header: timestamp regex; old-types and new-types lines contain case name.
6. Assert tree (`.content > details`): open relevant `<details>` first; check group name, old/new element lines.
7. Assert flat list (`#flat-capture-list`): open summary; verify case name present.
8. Assert capture devtools: `page.on('console', consoleHandler)` → click `chamberFrame.locator('vtbag-ic-view-transition-capture span.devtools').first()` → verify array shape.
9. Run: `npx playwright test src/e2e/20_capture-basic.spec.ts --project=chromium`

## Decision Points

**Selectors**
- Input controls: click `label[for="..."]`, not the input — nested span content intercepts direct clicks.
- Capture devtools button: always scope to `vtbag-ic-view-transition-capture span.devtools`. Error messages add their own `span.devtools` earlier in DOM order; unscoped `.first()` hits the wrong button and the console payload is never the captures array.

**`<details>` expansion**
- Never blindly click all summaries in a loop — clicking an already-open item closes it. Check `.open` first; expand only when closed.
- WebKit: use in-page `details.querySelector('summary')?.click()` instead of Playwright action clicks for loops over many items.
- After expanding, assert a stable body line (`Old image element:`, `New image element:`) before calling `allInnerTexts()` for indexed checks.
- Assert ordered `details` blocks by index rather than one joined regex string — robust to expansion-order changes.

**Devtools console payloads**
- Capture-view payload: `jsonValue()` on the last arg; it returns a serializable array — use `createConsoleHandler()`.
- Message-row payload: logs a live DOM node, which `jsonValue()` cannot serialize. Use `jsHandle.evaluate()` in-page: `{ nodeType: value.nodeType, nodeName: value.nodeName }`. The failed-transition message logs the transition root (`nodeType: 9, nodeName: '#document'` for a document-scoped transition). Use a separate `createConsoleNodeHandler()` to avoid cross-contamination.

**`vtbag-ic-message` assertions**
- Locate rows with `.locator('.message')`; use `toHaveCount(n)` to verify count.
- Assert `span.devtools` count per row before clicking — not every message has a devtools icon (e.g. the duplicate-names warning has none, the failure message has one).

**Visibility / undiscoverables**
- With `hide-undiscoverable` enabled, hidden entries exist in DOM but are not visible. Use `toBeVisible` / `not.toBeVisible`, not count checks.
- Verify visibility toggles when the checkbox is clicked.

**Payload shape**
- A group name can appear multiple times (element + nested element both named). Use presence checks for required names; validate representative fields (`oldNamedElement`, `newNamedElement`, `hiddenBy`) rather than fixed array length.
- Avoid brittle full selector paths in UI text (e.g. `body.old > …`). Match stable fragments: group name, discovery-blocked marker, core element selector.

## Quality Checks
- One case per test; no shared helper layer.
- UI and devtools payload both covered.
- Tree assertions deterministic regardless of summary expansion order.
- Focused spec run passes on Chromium.
