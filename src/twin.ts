import { endProps, setNonDefaultProps } from "./default-styles";
import { setStyles } from "./styles";
import { type Twin } from "./types";
export let twin: Twin;

export function initTwin(doc: Document, names: Set<string>, animationMap: Map<string, Animation>, animationEndTime: number, oldNames: Set<string>, newNames: Set<string>) {
  twin = { animations: [], dom: doc.createElement('vtbot-pseudo-twin'), map: new Map<string, HTMLElement>() };


  const styles: string[] = [];
  addToTwin(twin.dom, doc, '', '', styles);
  twin.dom = twin.dom.firstElementChild as HTMLElement;
  names.forEach((name: string) => {
    const group = addToTwin(twin!.dom, doc, 'group', name, styles);
    const pair = addToTwin(group, doc, 'image-pair', name, styles);
    addToTwin(pair, doc, 'old', name, styles) && oldNames.add(name);
    addToTwin(pair, doc, 'new', name, styles) && newNames.add(name);
  });

  [...twin.dom.children].forEach(async (g) => {
    const name = g.id.substring('vtbot-twin--view-transition-group-'.length);
    const anim = animationMap!.get(`-ua-view-transition-group-anim-${name}`);
    if (anim) {
      const savedTime = anim.currentTime;
      anim.currentTime = animationEndTime * 2;
      const endTimeStyle = doc.defaultView!.getComputedStyle(
        doc.documentElement,
        `::view-transition-group(${name})`
      );
      const gStyle = (g as HTMLElement).style;
      endProps.forEach((property) =>
        gStyle.setProperty(property, endTimeStyle.getPropertyValue(property))
      );
      anim.currentTime = savedTime;
    }
  });
  setStyles(`
@keyframes vtbot-twin-fade-out {
	to { opacity: 0; }
}
@keyframes vtbot-twin-fade-in {
	from { opacity: 0; }
}
` + styles.join('\n'),
    'keyframes'
  );
  doc.body.insertAdjacentElement('beforeend', twin.dom);


  function addToTwin(
    dom: HTMLElement | undefined,
    doc: Document,
    pseudo: string,
    name: string,
    keyframes: string[]
  ) {
    if (!dom) return undefined;
    const win = doc.defaultView!;
    const style = win.getComputedStyle(
      doc.documentElement,
      pseudo ? `::view-transition-${pseudo}(${name})` : '::view-transition'
    );
    if (!style.height.endsWith('px')) return undefined;
    const elem = doc.createElement('vtbot-pseudo-twin');
    elem.id = pseudo
      ? `vtbot-twin--view-transition-${pseudo}-${name}`
      : 'vtbot-twin--view-transition';
    dom.insertAdjacentElement('beforeend', elem);
    const elemStyle = elem.style;

    setNonDefaultProps(elemStyle, style);

    //	elemStyle.border = '1px dashed red';
    elemStyle.visibility = 'hidden';
    const buildIn = style.getPropertyValue('animation-name').split(',')[0];
    if (buildIn && buildIn.startsWith('-ua-view-transition-')) {
      const twin = buildIn.replace('-ua-view-transition', 'vtbot-twin');

      if (buildIn.startsWith('-ua-view-transition-group-')) {
        const anim = animationMap?.get(buildIn);
        if (anim) {
          keyframes.push(generateCSSKeyframes(anim, twin));
        }
      }
      elemStyle.animationName = twin;
    }
    return elem;
  }

  function generateCSSKeyframes(animation: Animation, keyframesName: string) {
    const keyframes = animation.effect!.getKeyframes();
    let keyframesRule = `@keyframes ${keyframesName} {`;

    keyframes.forEach((keyframe: Keyframe, idx: number) => {
      if (idx === keyframes.length - 1) return;
      //@ts-ignore
      const percentage = keyframe.computedOffset * 100;
      keyframesRule += `
        ${percentage}% {
          ${Object.entries(keyframe)
          .filter(([property, _]) => property !== 'offset' && property !== 'computedOffset')
          .map(([property, value]) => `${property}: ${value};`)
          .join(' ')}
        }
      `;
    });

    keyframesRule += '}';
    return keyframesRule;
  }

}


export function syncTwinAnimations() {
  const inspectionChamber = top!.__vtbag.inspectionChamber!;
	inspectionChamber.animations?.forEach((animation) => {
		const twin = inspectionChamber.animationMap?.get((animation as CSSAnimation).animationName.replace('-ua-view-transition', 'vtbot-twin'));
		if (twin) {
			twin.currentTime = animation.currentTime;
		}
	});
}
