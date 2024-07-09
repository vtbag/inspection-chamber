import { vtActive } from "./panel/transition";

export function initTwin(
	fromDoc: Document,
	toDoc: Document,
	names: Set<string>,
	oldNames: Set<string>,
	newNames: Set<string>
) {
	const placeHolder = toDoc.createElement('vtbag-pseudo-twin');

	addToTwin(placeHolder, fromDoc, '', '');
	const twin = top!.__vtbag.inspectionChamber!.twin = placeHolder.firstElementChild as HTMLElement;
	names.forEach((name: string) => {
		const group = addToTwin(twin, fromDoc, 'group', name);
		const pair = addToTwin(group, fromDoc, 'image-pair', name);
		addToTwin(pair, fromDoc, 'old', name) && oldNames.add(name);
		addToTwin(pair, fromDoc, 'new', name) && newNames.add(name);
	});
	// fastForward();
	toDoc.body.insertAdjacentElement('beforeend', twin);



	function addToTwin(
		dom: HTMLElement | undefined,
		fromDoc: Document,
		pseudo: string,
		name: string,
	) {
		if (!dom) return undefined;
		const toDoc = dom.ownerDocument;

		const fromWin = fromDoc.defaultView!;
		const style = fromWin.getComputedStyle(
			fromDoc.documentElement,
			pseudo ? `::view-transition-${pseudo}(${name})` : '::view-transition'
		);
		if (!style.height.endsWith('px')) return undefined;

		const elem = toDoc.createElement('vtbag-pseudo-twin');
		elem.id = pseudo
			? `vtbag-twin--view-transition-${pseudo}-${name}`
			: 'vtbag-twin--view-transition';
		elem.dataset.vtbagTransitionName = name;
		elem.dataset.vtbagTransitionPseudo = pseudo;
		dom.insertAdjacentElement('beforeend', elem);
		copyArea(style, elem.style);
		//setNonDefaultProps(elem.style, style);
		//replaceUaAnimation(elem.style)

		//elem.style.border = '3px solid red';
		elem.style.visibility = 'hidden';

		return elem;
	}
}

export function syncTwins() {

	const inspectionChamber = top!.__vtbag.inspectionChamber!;
	const root = inspectionChamber.frameDocument!.documentElement;
	[...inspectionChamber.twin!.children].forEach(async (group) => {
		const name = (group as HTMLElement).dataset.vtbagTransitionName!;
		morph(root, group as HTMLElement, name);
		morph(root, group.children[0] as HTMLElement, name);
		morph(root, group.children[0].children[0] as HTMLElement, name);
		morph(root, group.children[0].children[1] as HTMLElement, name);
		await new Promise<void>((r) => setTimeout(r));
	});
}

function morph(root: HTMLElement, elem: HTMLElement, name: string) {
	if (!elem) return;
	const pseudo = elem.dataset.vtbagTransitionPseudo!;
	const doc = elem.ownerDocument;
	const style = doc.defaultView!.getComputedStyle(root, `::view-transition-${pseudo}(${name})`);
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


export function replaceUaAnimation(style: CSSStyleDeclaration) {
	const animationName = style.animationName;
	if (animationName.startsWith('-ua-view-transition-group-anim-')) {
		style.animationName = animationName.replace(/-ua-view-transition/g, 'vtbag-twin');
		generateCSSKeyframes(top!.__vtbag.inspectionChamber!.animationMap!.get(animationName)!, style.animationName);
	}
}
export function generateCSSKeyframes(animation: Animation, keyframesName: string) {
	const keyframe = animation.effect!.getKeyframes()[0];
	return `
	@keyframes ${keyframesName} {
		from {${['transform', 'width', 'height', 'backdrop-filter'].forEach((property) => {
		return `
			${property}: ${keyframe[property]};`;
	})}
		}
	}`;
}




export function fastForward() {
	const inspectionChamber = top!.__vtbag.inspectionChamber!;
	const twin = inspectionChamber.twin!;
	const doc = inspectionChamber.frameDocument!;
	[...twin.children].forEach(async (g) => {
		const name = g.getAttribute('data-vtbag-transition-name')!;
		const animation = inspectionChamber.animationMap!.get(`-ua-view-transition-group-anim-${name}`);
		if (animation) {
			const savedTime = animation.currentTime;
			animation.currentTime = inspectionChamber.animationEndTime! * 2;
			const endTimeStyle = doc.defaultView!.getComputedStyle(
				doc.documentElement,
				`::view-transition-group(${name})`
			);
			const gStyle = (g as HTMLElement).style;
			copyArea(endTimeStyle, gStyle);
			animation.currentTime = savedTime;
		}
	});
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

export function twinClick(e: MouseEvent) {
	if (vtActive()) {
		let entry: HTMLLIElement | undefined;
		let size = Infinity;
		top!.__vtbag.inspectionChamber!.twin!.querySelectorAll<HTMLElement>(
			'vtbag-pseudo-twin > vtbag-pseudo-twin > vtbag-pseudo-twin'
		)
			.forEach((d) => {
				const { clientX, clientY } = e;
				const { top, bottom, left, right, width, height } = d.getBoundingClientRect();
				const name = d.dataset.vtbagTransitionName!;
				const pseudo = d.dataset.vtbagTransitionPseudo!;
				if (
					width * height < size &&
					top <= clientY &&
					clientY <= bottom &&
					left <= clientX &&
					clientX <= right
				) {
					let visible = true;
					let me;
					window.top!.document.querySelectorAll<HTMLLIElement>('#vtbag-ui-names li').forEach((li) => {
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
