import { initDragging } from '../dragging';
import { mayViewTransition } from './transition';

let mainPanel: HTMLDivElement;
let innerPanel: HTMLDivElement;
let pushBack: HTMLDivElement | null = null;

const INNER_POSITION = 2;

export function initInnerPanel() {
	mainPanel = top!.document.querySelector<HTMLDivElement>('#vtbag-ui-panel')!;
	innerPanel = top!.document.querySelector<HTMLDivElement>('#vtbag-ui-inner-panel')!;

	reColor();
	top!.document
		.querySelector<HTMLButtonElement>('#vtbag-ui-light-dark')!
		.addEventListener('click', reColor);

	function reColor() {
		const dark = top!.document.documentElement.style.colorScheme.startsWith('dark');
		innerPanel.style.backgroundColor = dark ? '#000' : '#fff';
		innerPanel.style.color = !dark ? '#000' : '#fff';
	}

	initDragging(innerPanel.children[0] as HTMLElement, (x: number, y: number) => {
		innerPanel.style.left = `${x}px`;
		innerPanel.style.top = `${y}px`;
	});

	initDragging(innerPanel.children[INNER_POSITION] as HTMLElement, (x: number, y: number) => {
		const rect = innerPanel.getBoundingClientRect();
		innerPanel.style.width = `${Math.max(200, x - rect.x + 32)}px`;
		innerPanel.style.height = `${Math.max(200, y - rect.y + 32)}px`;
	});

	const opacity = innerPanel.querySelector<HTMLInputElement>('#vtbag-ui-opacity')!;
	innerPanel.style.opacity = `${parseInt(opacity.value, 10) / 100}`;
	opacity.addEventListener('input', (e) => {
		innerPanel.style.opacity = `${parseInt((e.target as HTMLInputElement).value, 10) / 100}`;
	});
	innerPanel.querySelector<HTMLDivElement>('#vtbag-ui-inner-panel-close')!.addEventListener('click', () => {
		mayViewTransition(() => {
			mainPanel.insertBefore(innerPanel.children[INNER_POSITION], pushBack);
			pushBack = null;
			innerPanel.style.display = 'none';
		}, 'close inner panel');
	});
	mainPanel.querySelectorAll<HTMLHeadingElement>(':scope > div').forEach((el) => plugInPanel(el));
}

export function plugInPanel(el: HTMLHeadingElement) {
	el.querySelector(':scope > h4')?.addEventListener('click', (e) => {
		mayViewTransition(() => {
			const div = (e.target as HTMLElement).closest<HTMLDivElement>('#vtbag-ui-panel > div')!;
			innerPanel.children.length > INNER_POSITION + 2 && mainPanel.insertBefore(innerPanel.children[INNER_POSITION], pushBack);
			pushBack = null;
			if (div) {
				pushBack = div.nextElementSibling as HTMLDivElement;
				innerPanel.insertBefore(div, innerPanel.children[INNER_POSITION]);
				innerPanel.style.display = 'block';
			} else {
				innerPanel.style.display = 'none';
			}
		}, 'inner panel');
	});
}

export function mightHideMode() {
	const id = innerPanel.children[INNER_POSITION].id;
	if (id === 'vtbag-ui-slow-motion' || id === 'vtbag-ui-control') {
		mainPanel.insertBefore(innerPanel.children[INNER_POSITION], pushBack);
		innerPanel.style.display = 'none';
	}
}

export function mayCloseInner() {
	setTimeout(() => {
		const empty = top!.document.querySelector<HTMLDivElement>(
			`#vtbag-ui-inner-panel:has( > div:nth-of-type(${INNER_POSITION + 1}):empty)`
		);
		empty && (empty.style.display = 'none');
	}, 100);
}