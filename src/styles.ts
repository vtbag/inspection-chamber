export function setStyles(
	styles: string,
	suffix = '',
	doc = top!.__vtbag.inspectionChamber!.frameDocument!,
	prepend = false
) {
	const id = 'vtbag-adopted-sheet' + (suffix ? '-' + suffix : '');
	doc.getElementById(id)?.remove();
	styles &&
		doc.head.insertAdjacentHTML(
			prepend ? 'afterbegin' : 'beforeend',
			`<style id="${id}">${styles}</style>`
		);
}

export function addFrames(show: boolean, namedOnly: boolean) {
	show ? frame(namedOnly) : unframe();
}

function unframe() {
	setStyles('');
}
function frame(namedOnly = false) {
	setStyles(`
	${
		namedOnly
			? `
* {
	pointer-events: none;
}
[data-vtbag-transition-name] {
	pointer-events: auto;
}`
			: ''
	}

::view-transition-old(*) {
	outline: 3px dashed darkslateblue;
	border-radius: 5px;
}
::view-transition-new(*) {
	outline: 3px dashed darkolivegreen;
}
::view-transition-group(*),
[data-vtbag-transition-name] {
	outline: 2px dotted darkgoldenrod;
}
::view-transition-group(*),
::view-transition-image-pair(*),
::view-transition-old(*),
::view-transition-new(*),
[data-vtbag-transition-name] {
	cursor: help;
}
`);
}
