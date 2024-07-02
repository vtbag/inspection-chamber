export const endProps = [
  'height',
  'inset',
  'perspective-origin',
  'transform',
  'transform-origin',
  'width',
];
const basicProps = [
  ...endProps,
  'animation',
  'direction',
  'position',
  'text-orientation',
  'writing-mode',
];

let defaultStyleValues: Record<string, string>;


export function setNonDefaultProps(elemStyle: CSSStyleDeclaration, style: CSSStyleDeclaration) {
  defaultStyleValues ??= init();
  basicProps.forEach((prop) => {
    const val = style.getPropertyValue(prop);
    if (val !== defaultStyleValues[prop]) {
      elemStyle.setProperty(prop, val);
    }
  });
}

function init() {
  const defaultDiv = top!.document.createElement('div');
  top!.document.body.appendChild(defaultDiv);
  const defaultStyles = top!.getComputedStyle(defaultDiv);
  const res = basicProps.reduce(
    (acc: Record<string, string>, prop: string) => (
      (acc[prop] = defaultStyles.getPropertyValue(prop)), acc
    ),
    {}
  );
  top!.document.body.removeChild(defaultDiv);
  return res;
}

