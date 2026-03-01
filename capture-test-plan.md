# E2E Test Plan: Capture Analysis Mode

This document outlines a comprehensive test plan for the "Analyze capturing" mode of the Inspection Chamber, covering all view transition CSS properties and capture behaviors as defined in the [CSS View Transitions Module Level 2](https://drafts.csswg.org/css-view-transitions-2/) specification.

## Test Structure

### Test Files
- `src/pages/e2e/capture-basic.astro` - Basic capture scenarios
- `src/pages/e2e/capture-properties.astro` - CSS property combinations
- `src/pages/e2e/capture-advanced.astro` - Advanced features (scopes, nested groups, Chrome-only)
- `src/pages/e2e/capture-edge-cases.astro` - Edge cases and error conditions

### Test Specs
- `src/e2e/capture-basic.spec.ts` - Basic capture tests
- `src/e2e/capture-properties.spec.ts` - Property combination tests
- `src/e2e/capture-advanced.spec.ts` - Advanced feature tests (Chrome-only)
- `src/e2e/capture-edge-cases.spec.ts` - Edge cases and error handling

## Test Implementation Pattern

Each test page will:
- Include `<script is:inline src="/attach.js"></script>` to activate inspection chamber
- Define elements with various view-transition properties
- Provide buttons to trigger same-document view transitions
- Use transition types for test identification

Each test spec will:
1. Navigate to test page (loads in `#test-jig` iframe within chamber)
2. Access frames via `getFrames(page)` - returns `{ testFrame, chamberFrame, page }`
3. Verify ic2 bridge: `verifyIC2Ready(testFrame)`
4. Wait for chamber ready: `waitForChamberReady(chamberFrame)`
5. Switch to capture mode: `enableCaptureMode(chamberFrame)`
6. Trigger transition: `triggerTransitionAndWaitForCapture(testFrame, chamberFrame, buttonId)`
7. Verify capture: `getGroupMap(chamberFrame)` and `verifyGroup(...)` helpers
8. Check custom elements: `verifyCaptureDisplayVisible(chamberFrame)`

---

## Phase 1: Core Capture Tests (capture-basic)

### Test 1.1: Basic capture with single named element
**Scenario:** Basic same-document view transition with single named element (#hero)

**Implementation:** `src/pages/e2e/capture-basic.astro`, `src/e2e/capture-basic.spec.ts`

```astro
<div id="hero" style="view-transition-name: hero">Hero Element</div>
<!-- button triggers transition, hero changes color and h1 font size grows -->
```

**Verify:**
- Group "root" (document root) exists with both old and new nodes
- Group "hero" exists with both old and new nodes
- Total 2 groups captured
- Both groups have `old` and `new` image elements
- Console devtools output reports both groups
- `hasOld: true, hasNew: true` for both groups

**Status:** ✅ Implemented - passes on chromium, webkit, firefox

### Test 1.2: Old-only element (hidden in new state)
**Scenario:** Element with `view-transition-name` that becomes hidden via `display: none` in new state

**Implementation:** `src/pages/e2e/capture-basic.astro`, `src/e2e/capture-basic.spec.ts`

```astro
<div id="old-only">This element only exists in the old state</div>

<!-- CSS type guard for test-1-2: -->
html:active-view-transition-type(test-1-2) {
  #old-only {
    view-transition-name: old-only-element;
  }
  .state-b #old-only {
    display: none;
  }
}
```

**Verify:**
- Group "old-only-element" exists in capture
- Group has `old` image element (element rendered before state change)
- Group has NO `new` image element (element has `display: none` after state change)
- `hasOld: true, hasNew: false`
- Console devtools verifies capture contains old element but not new image
- @root and #hero groups still have both old and new
- Total 3 groups captured

**Status:** ✅ Implemented - passes on chromium, webkit, firefox

### Test 1.3: New-only element (created in new state)
**Scenario:** Element with `view-transition-name` that is hidden in old state and becomes visible in new state

**Implementation:** `src/pages/e2e/capture-basic.astro`, `src/e2e/capture-basic.spec.ts`

```astro
<div id="new-only">This element is created in the new state</div>

<!-- CSS type guard for test-1-3: -->
html:active-view-transition-type(test-1-3) {
  #new-only {
    view-transition-name: new-only-element;
    display: none;  /* Hidden in old state */
  }
  .state-b #new-only {
    display: block;  /* Visible in new state */
  }
}
```

**Verify:**
- Group "new-only-element" exists in capture
- Group has NO `old` image element (element has `display: none` before state change)
- Group has `new` image element (element rendered after state change)
- `hasOld: false, hasNew: true`
- Console devtools verifies capture contains no old image but has new element
- @root and #hero groups still have both old and new
- Total 3 groups captured

**Status:** ✅ Implemented - passes on chromium, webkit, firefox

### Test 1.4: Same Element Old and New
**Scenario:** Element keeps same `view-transition-name` across transition, proving it's the same DOM element (not replaced)

**Implementation:** `src/pages/e2e/capture-basic.astro`, `src/e2e/capture-basic.spec.ts`

```astro
<div id="persistent" data-test-element="same">Persistent Element (same across transition)</div>

<!-- CSS type guard for test-1-4: -->
html:active-view-transition-type(test-1-4) {
  #persistent {
    view-transition-name: persistent-element;
    background: lightblue;
    padding: 10px;
  }
  .state-b #persistent {
    background: lightcoral;
    padding: 20px;
    font-size: 1.2em;
  }
}
```

**Verify:**
- Group "persistent-element" has both `old` and `new` nodes
- Data attribute `data-test-element="same"` exists on both old and new captured elements
- JavaScript object reference equality: `oldNamedElement === newNamedElement` (same DOM object, not two different elements)
- `hasOld: true, hasNew: true`
- Total 3 groups: root, hero, persistent-element

**Status:** ✅ Implemented - passes on chromium, webkit, firefox

### Test 1.5: Different Elements Old and New
**Scenario:** Element A has name "shared" in old, Element B has name "shared" in new

```astro
<div id="elem-a" style="view-transition-name: shared">Element A</div>
<!-- button removes A, adds B with same name -->
```

**Verify:**
- Group "shared" has both `old` and `new` nodes
- Different CSS selectors for old vs new
- `oldSelector !== newSelector`

### Test 1.6: Pseudo-element ::before with view-transition-name
**Scenario:** Element with `::before { view-transition-name: before-name }`

```css
#pseudo-test::before {
  content: 'Before';
  view-transition-name: before-pseudo;
}
```

**Verify:**
- Group "before-pseudo" created
- `pseudoElement: '::before'` in node data

### Test 1.7: Pseudo-element ::after with view-transition-name
**Scenario:** Element with `::after { view-transition-name: after-name }`

```css
#pseudo-test::after {
  content: 'After';
  view-transition-name: after-pseudo;
}
```

**Verify:**
- Group "after-pseudo" created
- `pseudoElement: '::after'` in node data

### Test 1.8: Duplicate view-transition-name Detection ⭐
**Scenario:** Two elements with same `view-transition-name` in same state

```astro
<div style="view-transition-name: duplicate">First</div>
<div style="view-transition-name: duplicate">Second</div>
```

**Verify:**
```typescript
// Set up error listener before transition
const errorPromise = chamberFrame.evaluate(() => {
  return new Promise((resolve) => {
    window.addEventListener('ic-update-error', (e) => resolve(e), { once: true });
  });
});

// Trigger transition (will fail)
await testFrame.locator('#trigger').click();

// Wait for error
await errorPromise;

// Verify error message displayed
await verifyTransitionError(
  chamberFrame, 
  /duplicate.*view.*transition.*name/i
);
```

- Transition aborts during capture
- `ic-update-error` or `ic-ready-error` event fires
- Error message contains "Duplicate" or "duplicate"
- `vtbag-ic-message` shows error with red/error styling

---

## Phase 2: Auto-naming & Classes (capture-properties)

### Test 2.1: view-transition-name: auto (with ID)
**Scenario:** Element with ID uses `auto` naming

```astro
<div id="my-element" style="view-transition-name: auto">Auto with ID</div>
```

**Verify:**
- Name derived from ID (consistent `-ua-` prefixed name)
- Same element old/new matches correctly
- Works as same-element transition

### Test 2.2: view-transition-name: auto (without ID)
**Scenario:** Element without ID uses `auto` naming

```astro
<div style="view-transition-name: auto">Auto no ID</div>
```

**Verify:**
- Generates unique `-ua-auto-{n}` style name
- Name is consistent for same element across old/new
- Different elements get different names

### Test 2.3: view-transition-name: match-element
**Scenario:** Element uses `match-element` keyword

```astro
<div id="elem" style="view-transition-name: match-element">Match Element</div>
```

**Verify:**
- Generates unique `-ua-match-element-{n}` name
- Ignores `id` attribute
- Consistent for same element old/new

### Test 2.4: Single view-transition-class
**Scenario:** Element with single class

```astro
<div style="view-transition-name: box; view-transition-class: card">Card</div>
```

**Verify:**
- Group "box" has `className: 'card'`

### Test 2.5: Multiple view-transition-class
**Scenario:** Element with multiple classes

```astro
<div style="view-transition-name: box; view-transition-class: card primary featured">Multi</div>
```

**Verify:**
- Group "box" has `className: 'card primary featured'`

### Test 2.6: view-transition-class Priority (New over Old) ⭐
**Scenario:** Element exists in both states with different classes

**Old state:**
```astro
<div id="elem" style="view-transition-name: elem; view-transition-class: old-class">
```

**New state:**
```astro
<div id="elem" style="view-transition-name: elem; view-transition-class: new-class">
```

**Verify:**
- Only `new-class` appears in final group data (per spec: new state takes precedence)

### Test 2.7: Combined name and class
**Scenario:** Both properties on same element

```astro
<div style="view-transition-name: named; view-transition-class: styled">Both</div>
```

**Verify:**
- Group "named" exists
- `className: 'styled'`
- Both properties captured correctly

---

## Phase 3: Element Visibility & Rendering (capture-edge-cases)

### Test 3.1: display: none (should not capture)
**Scenario:** Element with `display: none`

```astro
<div style="view-transition-name: hidden; display: none">Not Rendered</div>
```

**Verify:**
- Element NOT in `moduleGroupMaps`
- No group created for "hidden"

### Test 3.2: visibility: hidden (should not capture)
**Scenario:** Element with `visibility: hidden`

```astro
<div style="view-transition-name: invisible; visibility: hidden">Invisible</div>
```

**Verify:**
- Element NOT captured

### Test 3.3: display: contents (should not capture)
**Scenario:** Element with `display: contents`

```astro
<div style="view-transition-name: contents; display: contents">Contents</div>
```

**Verify:**
- Element NOT captured (no principal box)

### Test 3.4: Zero-sized element (should not capture)
**Scenario:** Element with zero width/height

```astro
<div style="view-transition-name: zero; width: 0; height: 0">Zero</div>
```

**Verify:**
- Element NOT captured (`getClientRects().length === 0`)

### Test 3.5: Element transitioning from hidden to visible
**Scenario:** Old state `display: none`, new state visible

**Old:**
```astro
<div style="view-transition-name: appear; display: none">Hidden</div>
```

**New:**
```astro
<div style="view-transition-name: appear">Visible</div>
```

**Verify:**
- Group "appear" has only `new` node
- No `old` node (was not rendered)

### Test 3.6: Element transitioning from visible to hidden
**Scenario:** Old state visible, new state `display: none`

**Verify:**
- Group has only `old` node
- No `new` node

---

## Phase 4: Advanced CSS Properties (capture-properties)

### Test 4.1: Writing-mode capture ⭐
**Scenario:** Element with non-default writing-mode

```astro
<div style="view-transition-name: vertical; writing-mode: vertical-rl">Vertical</div>
```

**Verify:**
- Group captures `writing-mode: vertical-rl`

### Test 4.2: Direction capture (RTL) ⭐
**Scenario:** Element with RTL direction

```astro
<div style="view-transition-name: rtl; direction: rtl">مرحبا</div>
```

**Verify:**
- Group captures `direction: rtl`

### Test 4.3: text-orientation capture ⭐
**Scenario:** Element with text-orientation

```astro
<div style="view-transition-name: orient; text-orientation: upright">Orient</div>
```

**Verify:**
- Group captures `text-orientation: upright`

### Test 4.4: mix-blend-mode capture ⭐
**Scenario:** Element with mix-blend-mode

```astro
<div style="view-transition-name: blend; mix-blend-mode: multiply">Blend</div>
```

**Verify:**
- Group captures `mix-blend-mode: multiply`

### Test 4.5: backdrop-filter capture ⭐
**Scenario:** Element with backdrop-filter

```astro
<div style="view-transition-name: backdrop; backdrop-filter: blur(10px)">Blur</div>
```

**Verify:**
- Group captures `backdrop-filter: blur(10px)`

### Test 4.6: color-scheme capture ⭐
**Scenario:** Element with color-scheme

```astro
<div style="view-transition-name: scheme; color-scheme: dark">Dark</div>
```

**Verify:**
- Group captures `color-scheme: dark`

### Test 4.7: ::active-view-transition-type() guarded properties
**Scenario:** Properties set conditionally on transition type

```css
::view-transition-old(root) {
  animation-duration: 300ms;
}

@supports (view-transition-name: foo) {
  :root:active-view-transition-type(slide) {
    ::view-transition-old(root) {
      animation-duration: 600ms;
    }
  }
}
```

**Trigger with:** `document.startViewTransition({ types: ['slide'], update: ... })`

**Verify:**
- Animation properties reflect type-specific values
- Can be verified through animation inspection mode

---

## Phase 5: Advanced Chrome-Only Features (capture-advanced)

**Browser requirement:** Mark tests with:
```typescript
test.beforeEach(({ browserName }) => {
  test.skip(
    browserName !== 'chromium',
    'view-transition-scope and nested groups require Chrome'
  );
});
```

### Test 5.1: view-transition-group: contain (new only)
**Scenario:** Container with `view-transition-group: contain`

```astro
<div style="view-transition-group: contain; view-transition-name: container">
  <div style="view-transition-name: child">Child</div>
</div>
```

**Verify:**
- Group "container" has `viewTransitionGroup: 'contain'`
- Group hierarchy created
- Child is nested under container in pseudo-element tree

### Test 5.2: view-transition-group: nearest
**Scenario:** Element targeting nearest group parent

```astro
<div style="view-transition-group: contain; view-transition-name: parent">
  <div style="view-transition-name: child; view-transition-group: nearest">
    Child
  </div>
</div>
```

**Verify:**
- Child's `containingGroupName` points to parent
- Proper nesting in group tree

### Test 5.3: view-transition-group: <custom-ident>
**Scenario:** Element targeting specific group by name

```astro
<div style="view-transition-name: target">Target</div>
<div style="view-transition-name: child; view-transition-group: target">
  Points to Target
</div>
```

**Verify:**
- Child references "target" as containing group
- Hierarchy established correctly

### Test 5.4: Multiple Nesting Levels (3+ levels)
**Scenario:** Deep nesting hierarchy

```astro
<div style="view-transition-group: contain; view-transition-name: level1">
  <div style="view-transition-group: contain; view-transition-name: level2">
    <div style="view-transition-name: level3">Leaf</div>
  </div>
</div>
```

**Verify:**
- Correct ancestor chain: level3 → level2 → level1 → @
- `parent` field correctly set for each group

### Test 5.5: Border-width in nested groups ⭐
**Scenario:** Container with border affects child positioning

```astro
<style>
.container {
  view-transition-name: container;
  view-transition-group: contain;
  border: 10px solid red;
}
</style>
<div class="container">
  <div style="view-transition-name: child">Child</div>
</div>
```

**Verify:**
- `oldBorderWidth` captured for container
- Child transform adjusted relative to border
- Check `transformFromSnapshotContainingBlock` calculation

### Test 5.6: view-transition-scope: auto (hides descendants)
**Scenario:** Scope boundary hides nested names from outer transition

```astro
<div style="view-transition-scope: auto">
  <div style="view-transition-name: hidden-by-scope">Hidden</div>
</div>
```

**When:** `document.startViewTransition()` runs

**Verify:**
- "hidden-by-scope" NOT in `moduleGroupMaps`
- Name hidden by scope boundary

### Test 5.7: Nested view-transition-scope boundaries
**Scenario:** Multiple scope boundaries

```astro
<div style="view-transition-scope: auto">
  <div style="view-transition-name: outer-visible">Outer</div>
  <div style="view-transition-scope: auto">
    <div style="view-transition-name: inner-hidden">Inner</div>
  </div>
</div>
```

**When:** Document-level transition

**Verify:**
- Document transition sees "outer-visible"
- Document transition does NOT see "inner-hidden"

### Test 5.8: Scoped transition (element.startViewTransition) ⭐
**Scenario:** Call `element.startViewTransition()` on non-root element

```astro
<div id="scope-root" style="contain: layout">
  <div style="view-transition-name: scoped-child">Inside Scope</div>
</div>
<div style="view-transition-name: outside-scope">Outside Scope</div>
```

**Trigger:** `document.getElementById('scope-root').startViewTransition(update)`

**Verify:**
- "scoped-child" captured
- "outside-scope" NOT captured
- Transition runs on element, not document

### Test 5.9: Capture mode with scope enabled
**Scenario:** Test capture checkbox behavior with scoped names

**Setup:** Element with `view-transition-scope: auto` containing named children

**Action:** Enable capture mode checkbox in inspection chamber

**Verify:**
- Hidden names become visible when capture mode enabled
- Capture mode overrides scope hiding

---

## Phase 6: Cross-document & Special Cases (capture-edge-cases)

### Test 6.1: captureOldOnly mode ⭐
**Scenario:** Inspector set to capture old state only (for cross-doc back nav simulation)

**Setup:** Enable `captureOldOnly` mode in chamber

**Trigger:** Standard same-document transition

**Verify:**
- Only old images captured
- New images skipped
- `moduleGroupMaps` shows only old nodes

### Test 6.2: Root element (@) group
**Scenario:** Verify root group structure

**Verify:**
```typescript
await verifyRootGroup(chamberFrame);

const rootGroup = await getGroupInfo(chamberFrame, '@');
expect(rootGroup).toMatchObject({
  name: '@',
  preOrder: 0,           // Always first in DFS
  hasParent: false,      // No parent
  ancestor: false,
  hasOld: true,          // Root always has old state
  hasNew: true           // Root always has new state
});

// Verify name is generated correctly
// name should be: '' + moduleGroupMaps.size
```

- `@` group always exists in `moduleGroupMaps`
- Has `preOrder: 0` (first in DFS traversal)
- Root of group hierarchy (no parent)
- Always has both old and new states

### Test 6.3: Fragmented element (should not capture)
**Scenario:** Element split across multiple fragments (e.g., multi-column)

**Note:** Hard to test in simple layout, but important edge case

**Verify:**
- Element with multiple box fragments NOT captured

### Test 6.4: Shadow DOM tree-scoped names ⭐
**Scenario:** Element in shadow DOM with view-transition-name

```javascript
const shadow = element.attachShadow({ mode: 'open' });
shadow.innerHTML = '<div style="view-transition-name: shadow-name">Shadow</div>';
```

**Verify:**
- Name scoped correctly to shadow tree
- Tree-scoped name behavior per spec

### Test 6.5: View Transition Name with CSS escape sequences
**Scenario:** Name with escaped characters

```astro
<div style="view-transition-name: \!important">Escaped</div>
```

**Verify:**
- Name unescaped correctly in capture data
- Displays as "!important" in chamber

---

## Helper Functions for Test Specs

### Frame Access

```typescript
/**
 * Get chamber and test frames with proper targeting
 */
async function getFrames(page: Page) {
  // Wait for chamber to be ready
  await page.waitForSelector('#specimen iframe', { state: 'attached' });
  await page.waitForSelector('#dock iframe', { state: 'attached' });
  
  // #test-jig iframe contains the test content
  const testFrameLocator = page.locator('#specimen iframe#test-jig');
  await expect(testFrameLocator).toBeVisible();
  const testFrame = (await testFrameLocator.contentFrame())!;
  
  // #dock iframe contains the chamber controls (vtbag-ic-main)
  const chamberFrameLocator = page.locator('#dock iframe');
  await expect(chamberFrameLocator).toBeVisible();
  const chamberFrame = (await chamberFrameLocator.contentFrame())!;
  
  return { testFrame, chamberFrame, page };
}

/**
 * Verify ic2 bridge is initialized in test frame
 */
async function verifyIC2Ready(testFrame: Frame) {
  const ic2Ready = await testFrame.evaluate(() => {
    return !!(window.parent as any).__vtbag?.ic2;
  });
  expect(ic2Ready).toBe(true);
}
```

### Mode Control

```typescript
/**
 * Enable capture mode in chamber
 * Uses sessionStorage key: 'ic-analyzer-mode'
 */
async function enableCaptureMode(chamberFrame: Frame) {
  // Click the capture radio button in vtbag-ic-analyzer
  await chamberFrame.locator('label[for="capture"]').click();
  await expect(chamberFrame.locator('#capture')).toBeChecked();
  
  // Verify sessionStorage reflects the change
  const mode = await chamberFrame.evaluate(() => 
    sessionStorage.getItem('ic-analyzer-mode')
  );
  expect(mode).toBe('capture');
}

/**
 * Enable animation mode in chamber
 */
async function enableAnimationMode(chamberFrame: Frame) {
  await chamberFrame.locator('label[for="animation"]').click();
  await expect(chamberFrame.locator('#animation')).toBeChecked();
  
  const mode = await chamberFrame.evaluate(() => 
    sessionStorage.getItem('ic-analyzer-mode')
  );
  expect(mode).toBe('animation');
}

/**
 * Set capture-old-only mode
 * Uses sessionStorage key: 'vtbag-ic-capture-old-only'
 */
async function setCaptureOldOnly(chamberFrame: Frame, enabled: boolean) {
  if (enabled) {
    await chamberFrame.evaluate(() => 
      sessionStorage.setItem('vtbag-ic-capture-old-only', 'true')
    );
  } else {
    await chamberFrame.evaluate(() => 
      sessionStorage.removeItem('vtbag-ic-capture-old-only')
    );
  }
}
```

### Transition Triggering

```typescript
/**
 * Trigger transition and wait for capture completion
 */
async function triggerTransitionAndWaitForCapture(
  testFrame: Frame, 
  chamberFrame: Frame,
  buttonId: string
) {
  // Set up event listener for capture completion
  const capturePromise = chamberFrame.evaluate(() => {
    return new Promise((resolve) => {
      window.addEventListener('ic-after-capture-new', resolve, { once: true });
    });
  });
  
  // Trigger the transition
  await testFrame.locator(`#${buttonId}`).click();
  
  // Wait for capture to complete
  await capturePromise;
  
  // Also wait for animations to settle
  await testFrame.evaluate(() => {
    const animations = document.getAnimations();
    if (animations.length === 0) return Promise.resolve();
    return Promise.all(animations.map(a => a.finished));
  });
}

/**
 * Verify capture event sequence
 */
async function verifyCaptureEventSequence(chamberFrame: Frame) {
  const events: string[] = [];
  
  await chamberFrame.evaluate(() => {
    const eventNames = [
      'ic-before-capture-old',
      'ic-after-capture-old',
      'ic-before-capture-new',
      'ic-after-capture-new'
    ];
    
    (window as any).__captureEvents = [];
    
    eventNames.forEach(name => {
      window.addEventListener(name, () => {
        (window as any).__captureEvents.push(name);
      });
    });
  });
  
  // After transition completes, verify sequence
  const capturedEvents = await chamberFrame.evaluate(() => 
    (window as any).__captureEvents
  );
  
  expect(capturedEvents).toEqual([
    'ic-before-capture-old',
    'ic-after-capture-old',
    'ic-before-capture-new',
    'ic-after-capture-new'
  ]);
}
```

### Capture Data Access

```typescript
/**
 * Get group map data from chamber's capture display
 * Accesses moduleGroupMaps via the vtbag-ic-view-transition-capture custom element
 */
async function getGroupMap(chamberFrame: Frame, scopeIndex = 0) {
  return await chamberFrame.evaluate((idx) => {
    // Access the capture display custom element
    const captureElement = document.querySelector('vtbag-ic-view-transition-capture');
    if (!captureElement) return null;
    
    // moduleGroupMaps is exposed via the capture module
    // It's accessible through the element's internal state or via a getter
    const moduleGroupMaps = (captureElement as any).moduleGroupMaps;
    if (!moduleGroupMaps) {
      // Fallback: try to access directly from module scope
      // This requires the capture module to expose it
      const maps = (window as any).__moduleGroupMaps;
      if (!maps) return null;
      return serializeGroupMap(maps, idx);
    }
    
    return serializeGroupMap(moduleGroupMaps, idx);
    
    function serializeGroupMap(maps: Map<any, any>, idx: number) {
      const entries = Array.from(maps.entries());
      const [root, groupMap] = entries[idx] || [null, null];
      
      if (!groupMap) return null;
      
      // Serialize Group objects to plain data
      const result: any = {};
      for (const [name, group] of groupMap.entries()) {
        result[name] = serializeGroup(group);
      }
      return result;
    }
    
    function serializeGroup(group: any) {
      return {
        name: group.name,
        className: group.className || '',
        ancestor: group.ancestor,
        hasOld: !!group.old,
        hasNew: !!group.new,
        oldPseudo: group.old?.pseudoElement || null,
        newPseudo: group.new?.pseudoElement || null,
        childCount: group.children?.length || 0,
        
        // Hierarchy info
        preOrder: group.preOrder,
        postOrder: group.postOrder,
        bfs: group.bfs,
        hasParent: !!group.parent,
        parentName: group.parent?.name || null,
        
        // View transition properties
        viewTransitionGroup: group.old?.viewTransitionGroup || group.new?.viewTransitionGroup || null,
        viewTransitionScope: group.old?.viewTransitionScope || group.new?.viewTransitionScope || null,
        containingGroupName: group.old?.containingGroupName || group.new?.containingGroupName || null,
        
        // For verification (simplified selectors)
        oldElementId: group.old?.element?.id || null,
        newElementId: group.new?.element?.id || null,
        oldElementTag: group.old?.element?.tagName?.toLowerCase() || null,
        newElementTag: group.new?.element?.tagName?.toLowerCase() || null,
        
        // Duplicates detection
        oldDuplicates: group.oldDuplicates?.length || 0,
        newDuplicates: group.newDuplicates?.length || 0,
        
        // Hidden state (for scope testing)
        oldHidden: group.oldHidden,
        newHidden: group.newHidden
      };
    }
  }, scopeIndex);
}

/**
 * Get simplified group info for quick assertions
 */
async function getGroupInfo(chamberFrame: Frame, groupName: string, scopeIndex = 0) {
  const groups = await getGroupMap(chamberFrame, scopeIndex);
  if (!groups || !groups[groupName]) return null;
  return groups[groupName];
}

/**
 * List all captured group names
 */
async function getAllGroupNames(chamberFrame: Frame, scopeIndex = 0) {
  const groups = await getGroupMap(chamberFrame, scopeIndex);
  return groups ? Object.keys(groups) : [];
}
```

### Verification Helpers

```typescript
/**
 * Verify group exists with expected properties
 */
async function verifyGroup(
  chamberFrame: Frame,
  groupName: string,
  expected: {
    hasOld?: boolean;
    hasNew?: boolean;
    className?: string;
    oldElementId?: string;
    newElementId?: string;
    childCount?: number;
    viewTransitionGroup?: string;
    viewTransitionScope?: string;
    containingGroupName?: string;
    preOrder?: number;
    postOrder?: number;
    ancestor?: boolean;
    oldHidden?: boolean;
    newHidden?: boolean;
  },
  scopeIndex = 0
) {
  const group = await getGroupInfo(chamberFrame, groupName, scopeIndex);
  expect(group).toBeTruthy();
  
  // Check each expected property
  Object.entries(expected).forEach(([key, value]) => {
    expect(group[key]).toBe(value);
  });
}

/**
 * Verify group hierarchy (parent-child relationships)
 */
async function verifyGroupHierarchy(
  chamberFrame: Frame,
  childName: string,
  expectedParentName: string,
  scopeIndex = 0
) {
  const child = await getGroupInfo(chamberFrame, childName, scopeIndex);
  expect(child).toBeTruthy();
  expect(child.hasParent).toBe(true);
  expect(child.parentName).toBe(expectedParentName);
}

/**
 * Verify root (@) group exists and has correct structure
 */
async function verifyRootGroup(chamberFrame: Frame, scopeIndex = 0) {
  const root = await getGroupInfo(chamberFrame, '@', scopeIndex);
  expect(root).toBeTruthy();
  expect(root.preOrder).toBe(0); // Root is always first in DFS
  expect(root.hasParent).toBe(false);
}

/**
 * Verify error state in chamber
 */
async function verifyTransitionError(
  chamberFrame: Frame,
  expectedErrorPattern: RegExp
) {
  // Wait for error message in vtbag-ic-message
  const errorLocator = chamberFrame.locator('vtbag-ic-message[data-level="error"]');
  await expect(errorLocator).toBeVisible({ timeout: 5000 });
  
  const errorText = await errorLocator.textContent();
  expect(errorText).toMatch(expectedErrorPattern);
}

/**
 * Verify no groups captured (for hidden/invalid elements)
 */
async function verifyNoGroup(
  chamberFrame: Frame,
  groupName: string,
  scopeIndex = 0
) {
  const groups = await getGroupMap(chamberFrame, scopeIndex);
  expect(groups).toBeTruthy();
  expect(groups).not.toHaveProperty(groupName);
}

/**
 * Wait for chamber to be fully rendered
 */
async function waitForChamberReady(chamberFrame: Frame) {
  await chamberFrame.waitForSelector('vtbag-ic-main', { state: 'attached' });
  await chamberFrame.waitForSelector('vtbag-ic-analyzer', { state: 'attached' });
}
```

### Custom Element Helpers

```typescript
/**
 * Get custom element state
 */
async function getChamberElementState(chamberFrame: Frame, selector: string) {
  return await chamberFrame.evaluate((sel) => {
    const element = document.querySelector(sel);
    return element ? {
      tagName: element.tagName.toLowerCase(),
      className: element.className,
      id: element.id,
      visible: element.checkVisibility?.() ?? true
    } : null;
  }, selector);
}

/**
 * Verify capture display is visible
 */
async function verifyCaptureDisplayVisible(chamberFrame: Frame) {
  const captureDisplay = await getChamberElementState(
    chamberFrame, 
    'vtbag-ic-view-transition-capture'
  );
  expect(captureDisplay).toBeTruthy();
  expect(captureDisplay.visible).toBe(true);
}
```

---

## Additional Test Coverage

### Test A1: Event Sequence Verification
**Scenario:** Verify capture events fire in correct order

**Action:**
1. Set up event listeners before transition
2. Trigger transition
3. Capture event names and order

**Verify:**
```typescript
await verifyCaptureEventSequence(chamberFrame);
// Expected: ic-before-capture-old → ic-after-capture-old → 
//           ic-before-capture-new → ic-after-capture-new
```

### Test A2: sessionStorage Key Persistence
**Scenario:** Verify mode and settings persist across reloads

**Keys to test:**
- `ic-analyzer-mode` (capture/animation)
- `vtbag-ic-capture-old-only` (boolean)
- `vtbag-ic-capture-sort` (sort preference)
- `vtbag-freeze` (freeze state)

**Verify:**
```typescript
// Set mode
await enableCaptureMode(chamberFrame);
// Reload frame
await chamberFrame.reload();
// Verify mode persisted
const mode = await chamberFrame.evaluate(() => 
  sessionStorage.getItem('ic-analyzer-mode')
);
expect(mode).toBe('capture');
```

### Test A3: Group DFS Numbering
**Scenario:** Verify preOrder/postOrder/bfs numbering is correct

```astro
<div style="view-transition-name: a">
  <div style="view-transition-group: contain; view-transition-name: b">
    <div style="view-transition-name: c">C</div>
  </div>
</div>
```

**Verify:**
- Root `@` has `preOrder: 0`
- Numbering follows DFS traversal
- `size(group) = (postOrder - preOrder + 1) / 2`

### Test A4: Custom Element Presence
**Scenario:** Verify chamber custom elements are properly registered

**Check for:**
- `<vtbag-ic-main>` - root analyzer
- `<vtbag-ic-analyzer>` - mode switcher
- `<vtbag-ic-view-transition-capture>` - capture display
- `<vtbag-ic-scope>` - animation scope (in animation mode)

### Test A5: SparseDOMNode Properties
**Scenario:** Verify all properties are captured in node data

**For each captured element, check:**
- `element` reference
- `pseudoElement` (if applicable)
- `viewTransitionName`
- `viewTransitionGroup`
- `viewTransitionClass`
- `viewTransitionScope`
- `style` (CSSStyleDeclaration)
- `children` array

---

## Test Execution Strategy

### Priority Order

1. **Phase 1**: Basic capture tests (foundation)
2. **Phase 2**: Auto-naming and classes (common use cases)
3. **Phase 3**: Element visibility edge cases (important error conditions)
4. **Phase 4**: Advanced CSS properties (comprehensive coverage)
5. **Phase 5**: Chrome-only features (progressive enhancement)
6. **Phase 6**: Special cases and cross-document (advanced scenarios)
7. **Supplemental**: Event sequence, storage, numbering (A1-A5)

### Browser Coverage

- **All browsers**: Phases 1-4
- **Chrome only**: Phase 5 (use `test.skip()` for other browsers)

### Continuous Integration

Run in Playwright with:
```bash
npm test -- --project=Chromium  # Full suite
npm test -- --project=Firefox   # Phases 1-4 only
npm test -- --project=WebKit    # Phases 1-4 only
```

---

## Success Criteria

Each test must verify:
1. ✅ `ic2` bridge initialized in test frame (`parent.__vtbag.ic2`)
2. ✅ Correct groups created in `moduleGroupMaps` via `getGroupMap()`
3. ✅ Accurate old/new node presence with proper properties
4. ✅ Property capture (classes, groups, scopes, etc.)
5. ✅ Hierarchical relationships (parent/children, DFS numbering)
6. ✅ Custom elements rendered (`vtbag-ic-view-transition-capture`)
7. ✅ Events fire in correct sequence
8. ✅ Expected errors thrown for invalid states
9. ✅ sessionStorage persistence for modes and settings
10. ✅ Chamber UI accurately reflects capture state

---

## References

- [CSS View Transitions Level 2 Spec](https://drafts.csswg.org/css-view-transitions-2/)
- [NEW_VERSION_ANALYSIS.md](./NEW_VERSION_ANALYSIS.md) - Implementation guide
- [src/components/ic/capture.ts](./src/components/ic/capture.ts) - Capture implementation
- [src/components/ic/group.ts](./src/components/ic/group.ts) - Group structure
- [src/components/ic/hooks.ts](./src/components/ic/hooks.ts) - Transition lifecycle
