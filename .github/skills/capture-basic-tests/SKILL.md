---
name: capture-basic-tests
description: 'Create and extend simple Playwright tests. Use for extending  capture-basic.astro. Focus on one case per test, direct setup, and validating both UI and devtools payload.'
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
- For devtools payload checks, use strict exact-object checks for the expected case output.

## Quality Checks
- Each test verifies one case and keeps assertions focused.
- Test body remains short and explicit; no new helper layer added.
- Assertions cover both UI and devtools payload for the same case.
- Devtools assertions use strict exact-object expectations for the case under test.
- The focused spec run passes on Chromium.
