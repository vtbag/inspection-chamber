export function setStyles(
	styles: string,
	suffix = '',
	doc = top!.__vtbag.inspectionChamber!.frameDocument!,
	prepend = false
) {
	const id = 'vtbag-adopted-sheet' + (suffix ? '-' + suffix : '');
	doc.getElementById(id)?.remove();
	doc.documentElement.offsetHeight;
	styles &&
		doc.head.insertAdjacentHTML(
			prepend ? 'afterbegin' : 'beforeend',
			`<style id="${id}">${styles}</style>`
		);
}

export function addFrames(show: boolean) {
	show ? frame() : unframe();
}

function unframe() {
	setStyles('');
}
function frame() {
	setStyles(`
::view-transition-old(*) {
	border: 3px dashed darkslateblue;
	border-radius: 5px;
}
::view-transition-new(*) {
	border: 3px dashed darkolivegreen;
}
::view-transition-group(*),
[data-vtbag-transition-name] {
	border: 1px dotted darkgoldenrod;
}
::view-transition-group(*),
::view-transition-image-pair(*),
::view-transition-old(*),
::view-transition-new(*),
[data-vtbag-transition-name] {
	cursor: help;
}
:root::view-transition {
	position: absolute;
	inset: 0;
}
`);
}
