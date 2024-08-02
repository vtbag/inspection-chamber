import { initDragging } from '../dragging';
import { InspectionChamber } from '../types';
import { mayViewTransition } from './transition';

const INNER_POSITION = 2;
const ELEMENTS_INCLUDING_CONTENT = 5;

let chamber: InspectionChamber | undefined = undefined;

export function initInnerPanel() {
	setPanels();
	reColor();
	top!.document
		.querySelector<HTMLButtonElement>('#vtbag-ui-light-dark')!
		.addEventListener('click', reColor);

	function reColor() {
		const dark = top!.document.documentElement.style.colorScheme.startsWith('dark');
		chamber!.innerPanel!.style.backgroundColor = dark ? '#000' : '#fff';
		chamber!.innerPanel!.style.color = !dark ? '#000' : '#fff';
	}

	initDragging(chamber!.innerPanel!.children[0] as HTMLElement, (x: number, y: number) => {
		chamber!.innerPanel!.style.left = `${x}px`;
		chamber!.innerPanel!.style.top = `${y}px`;
	});

	initDragging(
		chamber!.innerPanel!.children[chamber!.innerPanel!.children.length - 1] as HTMLElement,
		(x: number, y: number) => {
			const rect = chamber!.innerPanel!.getBoundingClientRect();
			chamber!.innerPanel!.style.width = `${Math.max(200, x - rect.x + 32)}px`;
			chamber!.innerPanel!.style.height = `${Math.max(200, y - rect.y + 32)}px`;
		}
	);

	const opacity = chamber!.innerPanel!.querySelector<HTMLInputElement>('#vtbag-ui-opacity')!;
	chamber!.innerPanel!.style.opacity = `${parseInt(opacity.value, 10) / 100}`;
	opacity.addEventListener('input', (e) => {
		chamber!.innerPanel!.style.opacity = `${parseInt((e.target as HTMLInputElement).value, 10) / 100}`;
	});
	chamber!
		.innerPanel!.querySelector<HTMLDivElement>('#vtbag-ui-inner-panel-close')!
		.addEventListener('click', closeInner);
	chamber!
		.mainPanel!.querySelectorAll<HTMLHeadingElement>(':scope > div')
		.forEach((el) => plugInPanel(el));
}

export function plugInPanel(el: HTMLHeadingElement) {
	el.querySelector(':scope > h4')?.addEventListener('click', (e) => {
		mayViewTransition(() => {
			const div = (e.target as HTMLElement).closest<HTMLDivElement>('#vtbag-ui-panel > div')!;
			pushItBack();
			if (div) {
				chamber!.pushBack = div.nextElementSibling as HTMLDivElement;
				chamber!.innerPanel!.insertBefore(div, chamber!.innerPanel!.children[INNER_POSITION]);
				chamber!.innerPanel!.style.display = 'block';
			} else {
				chamber!.innerPanel!.style.display = 'none';
			}
		}, 'inner panel');
	});
}

export function mightHideMode() {
	const id = chamber!.innerPanel!.children[INNER_POSITION].id;
	if (id === 'vtbag-ui-slow-motion' || id === 'vtbag-ui-control') {
		chamber!.mainPanel!.insertBefore(
			chamber!.innerPanel!.children[INNER_POSITION],
			chamber!.pushBack ?? null
		);
		chamber!.innerPanel!.style.display = 'none';
	}
}

export function mayCloseInner() {
	setTimeout(() => {
		const empty = top!.document.querySelector<HTMLDivElement>(
			`#vtbag-ui-inner-panel:has( > div:nth-of-type(${INNER_POSITION + 1}):empty)`
		);
		if (empty) {
			empty.style.display = 'none';
			closeInner();
		}
	}, 100);
}

function closeInner() {
	setPanels();
	mayViewTransition(() => {
		pushItBack();
		chamber!.innerPanel!.style.display = 'none';
	}, 'close inner panel');
}

function pushItBack() {
	chamber!.innerPanel!.children.length === ELEMENTS_INCLUDING_CONTENT &&
		chamber!.mainPanel!.insertBefore(
			chamber!.innerPanel!.children[INNER_POSITION],
			chamber!.pushBack ?? null
		);
	chamber!.pushBack = null;
}

function setPanels() {
	chamber ??= top!.__vtbag.inspectionChamber;
	chamber!.mainPanel ??= top!.document.querySelector<HTMLDivElement>('#vtbag-ui-panel')!;
	chamber!.innerPanel ??= top!.document.querySelector<HTMLDivElement>('#vtbag-ui-inner-panel')!;
}
