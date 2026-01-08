import { vtActive } from './panel/transition';

export function initTwin(
	fromDoc: Document,
	toDoc: Document,
	names: Set<string>,
	oldNames: Set<string>,
	newNames: Set<string>
) {
	const placeHolder = toDoc.createElement('vtbag-pseudo-twin');

	addToTwin(placeHolder, fromDoc, '::view-transition', '');
	const twin = (top!.__vtbag.inspectionChamber!.twin =
		placeHolder.firstElementChild as HTMLElement);
	names.forEach((name: string) => {
		const group = addToTwin(twin, fromDoc, 'group', name);
		const pair = addToTwin(group, fromDoc, 'image-pair', name);
		addToTwin(pair, fromDoc, 'old', name) && oldNames.add(name);
		addToTwin(pair, fromDoc, 'new', name) && newNames.add(name);
	});
	toDoc.body.insertAdjacentElement('beforeend', twin);

	function addToTwin(
		dom: HTMLElement | undefined,
		fromDoc: Document,
		pseudo: string,
		name: string
	) {
		if (!dom) {
			console.error('[inspection chamber] Works not as expected ;-)');
			return undefined;
		}
		const inspectionChamber = top!.__vtbag.inspectionChamber;

		const toDoc = dom.ownerDocument;

		const fromWin = fromDoc.defaultView!;
		const pseudoName = name ? `::view-transition-${pseudo}(${name})` : pseudo;
		const style = fromWin.getComputedStyle(fromDoc.documentElement, pseudoName);
		if (!style.height.endsWith('px')) return undefined;
		inspectionChamber?.styleMap!.set(name ? `${pseudo}-${name}` : pseudo, style);
		const elem = toDoc.createElement('vtbag-pseudo-twin');
		elem.id = twinId(name, pseudo);
		elem.dataset.vtbagTransitionName = name;
		elem.dataset.vtbagTransitionPseudo = pseudo;
		dom.insertAdjacentElement('beforeend', elem);
		copyArea(style, elem.style);
		elem.style.visibility = 'hidden';
		return elem;
	}
}

function twinId(name: string, pseudo: string) {
	return name ? `vtbag-twin--view-transition-${pseudo}-${name}` : 'vtbag-twin--view-transition';
}
export async function syncTwins(hidden: Set<string>) {
	top!.document.documentElement.classList.add('vtbag-twin-sync');
	const inspectionChamber = top!.__vtbag.inspectionChamber!;
	// const _root = inspectionChamber.frameDocument!.documentElement;
	for (let group of [...(inspectionChamber.twin?.children || [])]) {
		const name = (group as HTMLElement).dataset.vtbagTransitionName!;
		if (hidden.has(name)) continue;
		morph(group as HTMLElement, name);
		morph(group.children[0] as HTMLElement, name);
		morph(group.children[0].children[0] as HTMLElement, name);
		morph(group.children[0].children[1] as HTMLElement, name);
		await new Promise<void>((r) => self.setTimeout(r));
	}
	top!.document.documentElement.classList.remove('vtbag-twin-sync');
}

function morph(elem: HTMLElement, name: string) {
	if (!elem) return;
	const pseudo = elem.dataset.vtbagTransitionPseudo!;
	const style = top!.__vtbag.inspectionChamber!.styleMap!.get(`${pseudo}-${name}`)!;
	const elemStyle = elem.style;
	copyArea(style, elemStyle);
}
function copyArea(fromStyle: CSSStyleDeclaration, toStyle: CSSStyleDeclaration) {
	toStyle.position = fromStyle.position;
	toStyle.inset = fromStyle.inset;
	toStyle.height = fromStyle.height;
	toStyle.width = fromStyle.width;
	toStyle.transform = fromStyle.transform;
	toStyle.zIndex = fromStyle.zIndex;
	toStyle.transformOrigin = fromStyle.transformOrigin;
	toStyle.perspective = fromStyle.perspective;
}

export function twinClick(e: MouseEvent) {
	if (vtActive()) {
		let entry: HTMLLIElement | undefined;
		let size = Infinity;
		top!.__vtbag
			.inspectionChamber!.twin?.querySelectorAll<HTMLElement>(
				'vtbag-pseudo-twin > vtbag-pseudo-twin > vtbag-pseudo-twin > vtbag-pseudo-twin'
			)
			.forEach((d) => {
				const { clientX, clientY } = e;
				const { top, bottom, left, right, width, height } = d.getBoundingClientRect();
				const name = d.dataset.vtbagTransitionName!;
				const pseudo = d.dataset.vtbagTransitionPseudo!;
				if (
					width &&
					height &&
					width * height < size &&
					top <= clientY &&
					clientY <= bottom &&
					left <= clientX &&
					clientX <= right
				) {
					let visible = true;
					let me;
					window
						.top!.document.querySelectorAll<HTMLLIElement>('#vtbag-ui-names li')
						.forEach((li) => {
							if (li.innerText === name) {
								me = li;
								if (li.classList.contains(`${pseudo}-hidden`)) visible = false;
							}
						});
					if (visible) {
						size = width * height;
						entry = me;
					}
				}
			});
		entry?.click();
	}
}
