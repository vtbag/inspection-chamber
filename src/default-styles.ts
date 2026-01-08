const allProps: string[] = [];
const redundantProps = ['top', 'left', 'right', 'bottom'];
/*
const _basicProps = [
	'animation',
	'direction',
	'height',
	'inset',
	'perspective',
	'perspective-origin',
	'position',
	'text-orientation',
	'transform',
	'transform-origin',
	'width',
	'writing-mode',
	'z-index',
];
*/
let defaultStyleValues: Record<string, string>;

export function setNonDefaultProps(elemStyle: CSSStyleDeclaration, style: CSSStyleDeclaration) {
	defaultStyleValues ??= init();
	allProps.forEach((prop) => {
		const val = style.getPropertyValue(prop);
		if (val !== defaultStyleValues[prop]) {
			elemStyle.setProperty(prop, val);
		}
	});
}

export function getNonDefaultProps(elemStyle: CSSStyleDeclaration) {
	defaultStyleValues ??= init();
	const res: Record<string, string> = {};
	allProps.forEach((prop) => {
		const val = elemStyle.getPropertyValue(prop);
		if (val !== defaultStyleValues[prop]) {
			res[prop] = val;
		}
	});
	return res;
}

export function getNonDefaultPropNames(elemStyle: CSSStyleDeclaration) {
	defaultStyleValues ??= init();
	const res: string[] = [];
	res.push('inset');
	allProps.forEach((prop) => {
		const val = elemStyle.getPropertyValue(prop);
		if (val !== defaultStyleValues[prop]) {
			res.push(prop);
		}
	});
	return res.filter(
		(prop) =>
			!(prop.startsWith('inset-') || prop.startsWith('animation-') || redundantProps.includes(prop))
	);
}

function init() {
	const defaultDiv = top!.document.createElement('div');
	top!.document.body.appendChild(defaultDiv);
	const defaultStyles = top!.getComputedStyle(defaultDiv);
	const res: Record<string, string> = {};

	for (let i = 0; i < defaultStyles.length; i++) {
		const prop = defaultStyles.item(i);
		allProps.push(prop);
		res[prop] = defaultStyles.getPropertyValue(prop);
	}
	top!.document.body.removeChild(defaultDiv);
	return res;
}
