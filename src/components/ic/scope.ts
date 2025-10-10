export function key(element: HTMLElement): HTMLElement {
  return element.constructor.name === HTMLHtmlElement.name ? ':root' as any as HTMLElement : element;
}