
export function effectiveZIndex(element: Element, style: CSSStyleDeclaration, parentStyle: CSSStyleDeclaration): number {
  const zIndexString = style.zIndex;

  if (zIndexString === 'auto') return 0;

  // 1. Root element
  if (element === document.documentElement) return 0;

  const zIndex = parseInt(zIndexString, 10);
  if (isNaN(zIndex)) return 0;

  // 2. Positioned elements with z-index
  if (['relative', 'absolute'].includes(style.position)) {
    return zIndex;
  }

  // 3. Fixed or sticky positioned elements (always create stacking context)
  if (['fixed', 'sticky'].includes(style.position)) return zIndex;

  // 4. Flex/grid items with z-index
  if ((parentStyle.display.includes('flex') ||
    parentStyle.display.includes('grid'))) {
    return zIndex;
  }

  // 5. Container query elements
  const containerType = style.containerType;
  if (containerType === 'size' || containerType === 'inline-size') {
    return zIndex;
  }

  // 6. Elements with opacity < 1
  if (parseFloat(style.opacity) < 1) return zIndex;

  // 7. Elements with mix-blend-mode (not 'normal')
  if (style.mixBlendMode !== 'normal') return zIndex;

  // 8. Elements with transform (not 'none')
  if (style.transform !== 'none') return zIndex;

  // 9. Elements with filter (not 'none')
  if (style.filter !== 'none') return zIndex;

  // 10. Elements with backdrop-filter (not 'none')
  // @ts-ignore
  if (style.backdropFilter !== 'none' || style.webkitBackdropFilter !== 'none') return zIndex;

  // 11. Elements with perspective (not 'none')
  if (style.perspective !== 'none') return zIndex;

  // 12. Elements with clip-path (not 'none')
  if (style.clipPath !== 'none') return zIndex;

  // 13. Elements with mask (not 'none')
  if (style.mask !== 'none' || style.webkitMask !== 'none') return zIndex;

  // 14. Elements with isolation: isolate
  if (style.isolation === 'isolate') return zIndex;

  // 15. Elements with will-change
  const willChange = style.willChange;
  if (willChange && willChange !== 'auto') {
    const stackingProps = ['opacity', 'transform', 'filter', 'perspective',
      'clip-path', 'mask', 'backdrop-filter'];
    if (stackingProps.some(prop => willChange.includes(prop))) {
      return zIndex;
    }
  }

  // 16. Elements with contain: layout or paint
  const contain = style.contain;
  if (contain && contain !== 'none') {
    if (['layout', 'paint', 'strict', 'content'].some(val => contain.includes(val))) {
      return zIndex;
    }
  }

  // 17. Elements with transform-style: preserve-3d
  if (style.transformStyle === 'preserve-3d') return zIndex;

  // 18. Elements with view-transition-name (not 'none')
  if (style.viewTransitionName && style.viewTransitionName !== 'none') return zIndex;

  // 19. Elements in the top layer (fullscreen, popover, dialog)
  // Note: Checking top layer requires different approach
  if (element.matches(':fullscreen, :popover-open, dialog[open]')) return Number.MAX_SAFE_INTEGER;

  // 20. Legacy iOS
  // @ts-ignore
  if (style.webkitOverflowScrolling === 'touch') return zIndex;

  return 0;
}
