# @vtbag/inspection-chamber

## 1.0.24

### Patch Changes

- d41d95a: Reduced dependency graph and indirect vulnerabilities.

## 1.0.23 - 2026-01-08

### Patch Changes

- 0b590c4: Fixes an issue, where changing visibility of pseudo-elements did not work for cross-document view transitions.

## 1.0.22 - 2025-07-09

### Patch Changes

- 42936d9: Fixes an issue with image visibility in Bypass mode.

## 1.0.21 - 2025-02-05

### Patch Changes

- c26cb14: Fixes a bug where the frame of the group pseudo-element is visible even both, the old and the new image are hidden or non existent

## 1.0.20 - 2025-01-25

### Patch Changes

- ccb1e36: Provides internal fixes and code stabilization

## 1.0.19 - 2025-01-02

### Patch Changes

- 48bd379: Adds a workaround for quoted animation names in Webkit which caused user agent animation names to be flagged as errors in Safari.

## 1.0.18 - 2024-12-05

### Patch Changes

- 904b8e4: Stops list items from escaping the name panel on view transitions.
- 8beb0e4: Fixes an issue (#35) with collapsing views. Getting a little better with styling.

## 1.0.17 - 2024-10-22

### Patch Changes

- bd4af9e: The Chamber now also works with same-document view transitions that use the extended signature for startViewTransition as defined by the level 2 spec, which allows you to pass view transition types to the transition!

## 1.0.16 - 2024-10-17

### Patch Changes

- dcbae28: Prefers column layout on first use.
- fc0447a: Adds .d.ts declarations
- e48f3ce: Refactor addressbar updates
- dfe3ded: Fixes an issue where the favicon of the original page got lost.

## 1.0.15 - 2024-10-04

### Patch Changes

- 54acd79: Now the Chamber can also handle animations of view transition pseudo-elements that where started using JavaScript and the Web Animation API

## 1.0.14 - 2024-09-25

### Patch Changes

- adf156a: Gives better error messages in the animation panel if there is some problem with the definition of an animation.

## 1.0.13 - 2024.09.19

### Patch Changes

- 49942c9: Fixes buggy styling that disabled scrolling of the main panel for Chrome 129.0.x.y
- dac7964: Fixes a bug with name sorting

## 1.0.12 - 2024-09-19

### Patch Changes

- 02f22df: Names in the Animation Groups panel are now shown in the order in which the transition groups appear as children of the `::view-transition` pseudo-element. If you miss the alphabetic order when searching for groups, please try the search function of the Filter panel.
- 3d31e58: Fixes a bug that caused the chamber to wedge when `startViewTransition()` was called without parameters.

## 1.0.11 - 2024-09-05

### Patch Changes

- aa8c519: Fixes a bug that blocked the chamber on nested iframes and framework components when used with the Astro router.

## 1.0.10 - 2024-08-27

### Patch Changes

- 8774263: Improves CCS information on animation panel
- 79774ea: Prevents dragging the enlarged sub-panel off the screen

## 1.0.9 - 2024-08-20

### Patch Changes

- 35b93dd: Chore: Pushes plus mini styling and refectoring
- 62c7102: Improves robustness against broken animations and outputs better error messages.

## 1.0.8 - 2024-08-16

### Patch Changes

- c90d8be: Optimizes styling of panels
- 81315a3: Fix error on browsers without native view transition API.

## 1.0.7 - 2024-08-13

### Patch Changes

- ab1bd93: Fixes canvas background

## 1.0.6 - 2024-08-10

### Patch Changes

- 731a96d: mini patch to logging & styling

## 1.0.5 - 2024-08-10

### Patch Changes

- ce5578f: Fixes scrolling & closing of enlarged sub-panels.
- 2dea51e: Introduces tutorial mode that shows usage instructions prominently by expanding the messages panel.
- 74279be: Fixes broken resize behavior of enlarged panel.
- eec3e26: Refactorings to further stabilize and clean up The Chamber prototype
- b946e4e: Reworkes time travel during full control mode
- eb0e145: Adds the ability to deselect single animations
- 326b0cf: Updates README

## 1.0.4 - 2024-07-31

### Patch Changes

- 8a89a9e: Improves opening the chamber on mobile.
- 8529e93: Adds an explicit button to close the enlarged panel (in addition to the existing option to click the heading again).
- b575757: Fixes some styling issues.

## 1.0.3 - 2024-07-28

### Patch Changes

- 065d488: Reenables identification of elements after view transitions.
- 22a871c: Improves usage instructions
- 7f90b5a: Fixes reopening from standby on mobile.
- 7d5d1af: Reduces identifying glow effects on start of view transitions.
- 005e529: Updates README
- f3d8ccb: Fixes how the chamber hooks into startViewTransition
- 614ca2a: Optimizes colorScheme
- cec5e6b: Version bumps

## 1.0.2 - 2024-07-18

### Patch Changes

- 007ac06: Reactivates the glow effect when clicking on names or elements.

## 1.0.1 - 2024-07-18

### Patch Changes

- 4d89b41: Initial release
