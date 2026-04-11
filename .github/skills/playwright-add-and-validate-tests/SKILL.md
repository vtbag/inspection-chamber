---
name: playwright-add-and-validate-tests
description: "Use when: adding Playwright tests, extending src/e2e specs, validating new E2E assertions, debugging failing capture tests, or generating additional test cases in this repository."
---

# Playwright Add And Validate Tests

## Purpose

Add new Playwright tests in this codebase without breaking existing conventions, then validate that the new tests pass.

## Scope

- Test files live in `src/e2e`.
- This project uses helpers from `src/e2e/capture-test-helpers.ts`.
- `openCaptureView(...)` is used for direct UI text/structure assertions.
- `runCaptureTest(...)` is preferred for config-driven capture assertions.
- Non-Windows projects run multiple browsers (`chromium`, `webkit`, `firefox`) from `playwright.config.ts`.

## Inputs To Ask For If Missing

1. Which scenario should be added (feature behavior and expected result)?
2. Which file should be extended (or should a new `*.spec.ts` file be created)?
3. Should validation run on one test, one file, or the full suite?
4. Any browser constraints (for example WebKit-only behavior)?

## Workflow

1. Read target spec and nearby helpers before editing.
2. Mirror existing naming style:
   - `test.describe('...')`
   - Numbered test titles like `2.7: ...` when extending an existing numbered suite.
3. Reuse existing helpers and selectors:
   - Prefer `runCaptureTest(...)` for standard capture flows.
   - Use `openCaptureView(...)` when asserting summaries, labels, or custom text structure.
4. Keep assertions deterministic:
   - Prefer specific text or regex checks.
   - Avoid brittle timing assumptions.
5. Handle browser-specific support explicitly:
   - Use `test.skip(browserName !== 'webkit', '...')` when required.
6. Validate for copy/paste mistakes before running tests:
   - No duplicated assertion lines unless intentional.
   - No inconsistent test IDs or trigger IDs.
   - No unreachable code after early returns.
7. Run validation as narrowly as possible first, then broaden if needed.

## Validation Commands

Use the smallest useful command first.

```bash
npx playwright test src/e2e/<target-file>.spec.ts -g "<new test title fragment>"
```

If that passes, run the full file:

```bash
npx playwright test src/e2e/<target-file>.spec.ts
```

If requested, run broader validation:

```bash
npx playwright test
```

## Repository-Specific Guardrails

- Keep test structure and helper usage consistent with existing `src/e2e` specs.
- Do not refactor unrelated tests while adding a new case.
- If a failure is unrelated to the new test, report it separately instead of masking it.
- When adding a browser-specific test, state clearly why the skip condition exists.

## Output Format

After edits and validation, report:

1. Files changed.
2. Tests added (exact titles).
3. Commands run for validation.
4. Pass/fail outcome and any residual risk.
