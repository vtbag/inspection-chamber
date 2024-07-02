export function setStyles(styles: string, suffix = '', prepend = false) {
	const id = 'vtbot-adopted-sheet' + (suffix ? '-' + suffix : '');
	const doc = top!.__vtbag.inspectionChamber!.frameDocument!;
	doc.getElementById(id)?.remove();
	doc.documentElement.offsetHeight;
	styles && doc.head.insertAdjacentHTML(prepend ? 'afterbegin' : 'beforeend', `<style id="${id}">${styles}</style>`);
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
[data-vtbot-transition-name] {
	border: 1px dotted darkgoldenrod;
}
:root::view-transition {
	position: absolute;
	inset: 0;
}
`
	);
}
