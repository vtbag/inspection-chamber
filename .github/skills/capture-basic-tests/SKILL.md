---
name: capture-basic-tests
description: 'Create and extend simple Playwright tests. Use for extending  src/e2e/20_capture-basic.spec.ts. Focus on one case per test, direct setup, and validating both UI and devtools payload.'
---

# Capture Basic Tests

## What This Skill Produces
Creates or extends focused tests in `src/e2e/20_capture-basic.spec.ts` that:
- Run one capture case per test.
- Avoid shared helper abstractions.
- Validate UI output (header, tree details, flat list).
- Validate devtools console payload for the same case.

## Procedure
1. Confirm case wiring in `src/pages/e2e/capture-basic.astro`.
2. Duplicate the closest existing test in `src/e2e/20_capture-basic.spec.ts`.
3. Keep setup direct and local in the test body:
- `goto('/e2e/capture-basic/')`
- Long-press `div.resize-handle.edge.s`
- Close welcome panel if visible
- Enable capture mode (`#capture`, via label click)
4. Trigger the case with the case-specific button (`#trigger-...`).
5. Assert header output above `.content`:
- Same-document call on `:root` (ignore timestamp using regex)
- old types line contains case type
- new types line contains case type
6. Assert tree output (`.content > details`):
- Open the relevant details summary before visible-text checks.
- Verify only the important case-specific lines.
7. Assert flat list output (`#flat-capture-list`):
- Ensure section exists
- Open summary
- Verify case name appears
8. Assert devtools payload:
- Click `span.devtools`
- Capture console payload from the last console argument
- Verify case-specific shape (`name`, old/new element presence, hidden metadata)
9. Run only this spec after changes:
- `npx playwright test src/e2e/20_capture-basic.spec.ts --project=chromium`


## Future Case Expansion
- For any new capture case, duplicate the closest existing case and only change:
- Trigger selector
- Expected active type text in header lines
- Tree group names and old/new element expectations
- Flat-list expected entries
- Devtools expected object shape
- Keep all existing setup and docking steps unchanged unless the new case explicitly requires otherwise.
- Add one test per case and avoid combining multiple features in one test.

## Decision Points
- If clicks on input controls are intercepted, click their labels (`label[for="..."]`) instead of input nodes.
- If details content seems missing, check whether relevant `<details>` are collapsed.
- When opening many `<details>`, do not blindly click all summaries in a loop. This can close items that were already open and hide expected nested lines. For deterministic expansion and assertions, inspect each `<details>` `open` state and click only when closed. When validating tree output with many details blocks, prefer asserting ordered details blocks by index rather than aggregated regex patterns to remain robust across summary expansion order changes.
- WebKit reliability: when expanding many `.content > details` blocks, Playwright action clicks on `summary` in a long loop can intermittently time out on later items. Prefer toggling closed details via in-page evaluation (`details.querySelector('summary')?.click()`) and then assert each details is opened.
- Expansion completeness: `details.open === true` alone is not always enough across engines. After expansion, also assert a stable body line (for example `Old image element:` or `New image element:`) before collecting `allInnerTexts()` for indexed checks.
- For devtools payload checks, use strict exact-object checks for the expected case output.
- If `hide-undiscoverable` is enabled, hidden entries may still exist in DOM/flat list but be visually hidden. Prefer visibility assertions (`toBeVisible` / `not.toBeVisible`) over assuming zero count. When testing cases with toggle-able visibility, verify that hidden entries change visibility state when the toggle is clicked.
- Do not assume one payload entry per group name. A single name can appear multiple times (for example when both element and nested element are named). For devtools payload validation, use `toContain` or presence checks for required names across the payload, then validate representative entry object fields (such as `oldNamedElement`, `newNamedElement`, `oldHiddenBy`, `newHiddenBy`) to confirm correct shape, rather than relying on fixed array length or brittle ordering.
- Avoid brittle selector-path expectations in UI text (for example including `body.old >` prefixes). Prefer matching stable fragments: group name, discovery-blocked marker, and core element selector fragment.

## Quality Checks
- Each test verifies one case and keeps assertions focused.
- Test body remains short and explicit; no new helper layer added.
- Assertions cover both UI and devtools payload for the same case.
- Tree assertions remain deterministic if summary expansion order changes (for example by asserting ordered details blocks directly).
- Cross-browser robustness: details expansion checks should validate both open state and stable details-body content, especially for WebKit.
- Devtools assertions use strict exact-object expectations for the case under test.
- The focused spec run passes on Chromium.
