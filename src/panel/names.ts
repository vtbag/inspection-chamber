import { listAnimations } from '../animations';
import { setStyles } from '../styles';
import { syncTwins } from '../twin';
import { DEBUG } from './debug';
import { resetFilter, resetSelected } from './filter';
import { control, updateControl } from './full-control';
import { plugInPanel } from './inner';
import { getModus } from './modus';
import { mayViewTransition, vtActive } from './transition';

export const THROTTLING_DELAY = 500;

export function updateNames(
	leftTransitionNames: Set<string>,
	rightTransitionNames?: Set<string>,
	names?: Set<string>
) {
	//navigator.clipboard.writeText("");
	mayViewTransition(() => {
		top!.document.querySelector('#vtbag-ui-info')!.innerHTML = '';
		top!.document.querySelectorAll('#vtbag-ui-names li').forEach((li) => li.remove());
		top!.document.querySelector<HTMLElement>('#vtbag-ui-names h4')!.innerText = rightTransitionNames
			? 'Animation Groups'
			: 'Elements w/ View Transition Names';

		top!.document.querySelector<HTMLElement>('#vtbag-ui-names div')!.style.display =
			rightTransitionNames ? 'flex' : 'none';
		const list = top!.document.querySelector('#vtbag-ui-names > ol')!;
		(rightTransitionNames ? names! : [...leftTransitionNames].sort()).forEach((name, idx) => {
			const li = top!.document.createElement('li');
			li.innerText = name;
			if (rightTransitionNames && leftTransitionNames.has(name)) {
				li.classList.add('old');
			}
			if (rightTransitionNames?.has(name)) {
				li.classList.add('new');
			}
			//	li.style.viewTransitionName = `vtbag-name-${idx}`;
			list.appendChild(li);
		});
		top!.document.querySelector<HTMLElement>('#vtbag-ui-filter ul')!.style.display =
			rightTransitionNames ? 'block' : 'none';
		refreshNames();
	}, 'update names');
	return names;
}

export function refreshNames() {
	const names = top!.document.querySelectorAll<HTMLLIElement>('#vtbag-ui-names li');
	const filter = top!.document
		.querySelector<HTMLInputElement>('#vtbag-ui-filter ul input:checked')!
		.id.replace('vtbag-c-', '');
	const fragment = top!.document.querySelector<HTMLInputElement>(
		'#vtbag-ui-filter input[type="text"]'
	)!.value;
	mayViewTransition(() => {
		names.forEach((name) => {
			const style = name.style;
			const classes = name.classList;
			const text = name.innerText;
			style.display =
				(fragment === '' || text.includes(fragment)) &&
				(filter === 'all' ||
					(filter === 'both' && classes.contains('new') && classes.contains('old')) ||
					(filter === 'old-only' && classes.contains('old') && !classes.contains('new')) ||
					(filter === 'new-only' && classes.contains('new') && !classes.contains('old')) ||
					(filter === 'old' && classes.contains('old')) ||
					(filter === 'new' && classes.contains('new')))
					? 'list-item'
					: 'none';
		});
	}, 'refresh names');
}

export async function updateNameVisibility() {
	if (!vtActive()) return;
	const inspectionChamber = top!.__vtbag.inspectionChamber!;

	const twinDocument = inspectionChamber.twin?.ownerDocument;
	const topDocument = top!.document;
	const computedStyle = top!.getComputedStyle(topDocument.documentElement);
	const column = topDocument.documentElement.classList.contains('vtbag-ui-column');
	const panelWidth = column
		? parseFloat(computedStyle.getPropertyValue('--vtbag-panel-width') || '0')
		: 0;
	const panelHeight = column
		? 0
		: parseFloat(computedStyle.getPropertyValue('--vtbag-panel-height') || '0');

	const lis = topDocument.querySelectorAll<HTMLLIElement>('#vtbag-ui-names li');
	const hidden = new Set<string>();
	lis.forEach((li) => {
		li.classList.contains('old-hidden') &&
			li.classList.contains('new-hidden') &&
			hidden.add(li.innerText);
	});
	await syncTwins(hidden);
	twinDocument &&
		lis.forEach((li) => {
			const name = li.innerText;
			const classes = li.classList;
			classes[
				classes.contains('old') &&
				insideViewport(
					twinDocument.querySelector(`#vtbag-twin--view-transition-old-${name}`),
					panelWidth,
					panelHeight
				) === false
					? 'add'
					: 'remove'
			]('old-invisible');
			classes[
				classes.contains('new') &&
				insideViewport(
					twinDocument.querySelector(`#vtbag-twin--view-transition-new-${name}`),
					panelWidth,
					panelHeight
				) === false
					? 'add'
					: 'remove'
			]('new-invisible');
			classes[
				(!classes.contains('old') || classes.contains('old-invisible')) &&
				(!classes.contains('new') || classes.contains('new-invisible'))
					? 'add'
					: 'remove'
			]('invisible');
		});
}

function insideViewport(element: HTMLElement | null, panelWidth = 0, panelHeight = 0) {
	if (!element) return undefined;
	const { top, right, bottom, left, width, height } = element.getBoundingClientRect();

	DEBUG &&
		console.log(
			~~window.top!.innerWidth,
			~~window.top!.innerHeight,
			~~width,
			~~height,
			~~left,
			~~top,
			~~right,
			~~bottom
		);
	return (
		width > 0 &&
		height > 0 &&
		top < window.top!.innerHeight - panelHeight &&
		bottom > 0 &&
		left < window.top!.innerWidth - panelWidth &&
		right > 0
	);
}

export function updateImageVisibility() {
	const rules: string[] = [];

	const modus = getModus();
	if (!modus || modus === 'bypass') return;
	top!.document.querySelectorAll<HTMLLIElement>('#vtbag-ui-names li').forEach((li) => {
		const name = li.innerText;
		const classes = li.classList;
		let oldVisible = true;
		let newVisible = true;
		if (classes.contains('old-hidden')) {
			oldVisible = false;
			rules.push(`::view-transition-old(${name}) { visibility: hidden; }`);
		} else if (!classes.contains('old')) {
			oldVisible = false;
		}
		if (classes.contains('new-hidden')) {
			rules.push(`::view-transition-new(${name}) { visibility: hidden; }`);
			newVisible = false;
		} else if (!classes.contains('new')) {
			newVisible = false;
		}
		if (!oldVisible && !newVisible) {
			rules.push(`::view-transition-group(${name}) { visibility: hidden; }`);
		}
	});
	setStyles(rules.join('\n'), 'image-visibility');
	control();
}

function highlightNames(name: string) {
	const control = getModus() === 'full-control' && vtActive();
	const lis = top!.document.querySelectorAll<HTMLLIElement>('#vtbag-ui-names li');
	let selected: HTMLLIElement | undefined;
	const sel = top!.document.querySelector<HTMLInputElement>('#vtbag-ui-controller')!;
	const prog = top!.document.querySelector<HTMLInputElement>('#vtbag-ui-progress')!;
	const unsel = top!.document.querySelector<HTMLInputElement>('#vtbag-ui-controller2')!;
	const unprog = top!.document.querySelector<HTMLInputElement>('#vtbag-ui-progress2')!;
	lis.forEach((li) => {
		if (li.innerText === name) {
			if (li.classList.contains('selected')) {
				unsel.value = sel.value;
				unprog.innerText = prog.innerText;
			} else {
				sel.value = unsel.value;
				prog.innerText = unprog.innerText;
			}

			li.classList[control ? 'toggle' : 'add']('selected');
			selected = li;
			if (li.style.display === 'none') resetFilter();
		} else {
			if (!control) li.classList.remove('selected');
		}
	});
	selected &&
		selected.scrollIntoView({
			behavior: 'instant',
			block: 'nearest',
			inline: 'nearest',
		});
}

function writeSelectorToClipboard(elem?: Element | null) {
	const info = top!.document.querySelector<HTMLInputElement>('#vtbag-ui-info')!;
	if (elem && !vtActive()) {
		navigator.clipboard.writeText(
			`inspect(top.document.querySelector("#vtbag-main-frame").contentDocument.querySelector("${deriveCSSSelector(elem)}"))`
		);
		info.innerHTML = `<h4>Info</h4>
						<p>DevTools selector '<b><code>${deriveCSSSelector(elem)}</code></b>' copied to clipboard. Paste to DevTools console to further inspect the element.</p>`;
	} else {
		navigator.clipboard.writeText(
			`inspect(top.document.querySelector("#vtbag-main-frame").contentDocument.querySelector(":root"))`
		);
		const name = elem && (elem as HTMLElement).dataset.vtbagTransitionName;

		info.innerHTML = `<h4>Info</h4>
						<p>DevTools selector '<b><code>:root</code></b>' copied to clipboard. Paste to DevTools console, then expand the <code>&lt;html></code> element and its <code>::view-transition</code> pseudo element.</p>${name && '<p>Look for the <code>::view-transition-group(' + name + ')</code> pseudo element and its children.</p>'}`;
	}
	plugInPanel(info);
}

function deriveCSSSelector(element?: Element, useIds = true) {
	const path: string[] = [];
	while (element && element.nodeType === Node.ELEMENT_NODE) {
		let selector = element.nodeName.toLowerCase();
		if (useIds && element.id) {
			selector = '#' + element.id;
			path.unshift(selector);
			break;
		} else {
			let sibling = element;
			let nth = 1;
			while ((sibling = sibling.previousElementSibling as Element)) {
				if (sibling.nodeName.toLowerCase() === selector) nth++;
			}
			if (nth !== 1) {
				selector += ':nth-of-type(' + nth + ')';
			}
		}
		path.unshift(selector);
		element = element.parentNode as Element;
	}
	return path.join(' > ');
}

export function initNames() {
	let toggleAll = (oldNew: 'old' | 'new') => {
		const hidden = oldNew + '-hidden';
		const lis = [...top!.document.querySelectorAll<HTMLLIElement>('#vtbag-ui-names li')];
		const allLis = lis.filter((li) => li.classList.contains(oldNew));
		const cmd = allLis.length > 0 && allLis[0].classList.contains(hidden) ? 'remove' : 'add';
		allLis.forEach((li) => li.classList[cmd](hidden));
		updateImageVisibility();
	};

	top!.document
		.querySelector('#vtbag-ui-names button')!
		.addEventListener('click', () => resetSelected());
	top!.document
		.querySelector<HTMLSpanElement>('#vtbag-ui-names-old')!
		.addEventListener('click', () => toggleAll('old'));
	top!.document
		.querySelector<HTMLSpanElement>('#vtbag-ui-names-new')!
		.addEventListener('click', () => toggleAll('new'));

	top!.document.querySelector('#vtbag-ui-names ol')!.addEventListener('click', (e) => {
		const indirect = !e.isTrusted;
		if (e.target instanceof HTMLElement) {
			const targetLi = e.target.closest('li');

			if (targetLi && e instanceof PointerEvent) {
				if (targetLi.style.display === 'none') resetFilter();
				const modus = getModus();
				mayViewTransition(
					() => {
						const { left, width } = targetLi.getBoundingClientRect();
						const x = e.clientX - left;
						const leftClick = !indirect && x >= 0 && x <= 20;
						const rightClick = !indirect && x >= width - 20 && x <= width;

						const classes = targetLi.classList;
						if (leftClick && classes.contains('old')) {
							classes.toggle('old-hidden');
							updateImageVisibility();
							return;
						}
						if (rightClick && classes.contains('new')) {
							classes.toggle('new-hidden');
							updateImageVisibility();
							return;
						}
						const name = targetLi.innerText;
						!indirect && highlightInFrame(name);
						highlightNames(name);

						const elem = window.top!.__vtbag.inspectionChamber?.frameDocument!.querySelector(
							`[data-vtbag-transition-name="${name}"]`
						);
						if (modus && modus !== 'bypass') writeSelectorToClipboard(elem);
						vtActive() && listAnimations(name);
					},
					'names',
					true
				);
			}
		}
		updateControl();
	});
}

const glow = [
	// Keyframes
	{ boxShadow: 'inset 0 0  50px darkslateblue' },
	{ boxShadow: 'inset 0 0 0px darkslateblue' },
	{ boxShadow: '0 0 50px darkslateblue' },
	{
		boxShadow: '0 0 100px darkslateblue',
		display: 'inline-block',
		minWidth: '20px',
		minHeight: '20px',
		backgroundColor: 'darkslateblue',
		opacity: '0.5',
	},
	{ boxShadow: '0 0 50px darkslateblue' },
	{ boxShadow: '0 0 0px darkslateblue' },
	{ boxShadow: 'inset 0 0 50px darkslateblue' },
];

export function highlightInFrame(name: string) {
	if (vtActive()) {
		glowPseudo(name);
	} else {
		const chamber = top!.__vtbag.inspectionChamber!;
		const el = chamber.frameDocument!.querySelector<HTMLElement>(
			`[data-vtbag-transition-name="${name}"]`
		);
		if (el) {
			el.scrollIntoView({
				behavior: 'instant',
				block: 'nearest',
				inline: 'nearest',
			});
			const display = self.getComputedStyle(el).display;
			glow[3]!.display = !display.includes('block') ? 'inline-block' : display;
			chamber.glow = el.animate(glow, { duration: 500, iterations: 1 });
			self.setTimeout(() => (chamber.glow = undefined), 500);
		}
	}
}

function glowPseudo(name: string) {
	setStyles(
		`
		::view-transition-old(*),
		::view-transition-new(*),
		::view-transition-group(*) {
			opacity: 0;
		}
		::view-transition-group(${name}) {
			opacity: 1;
			outline: 2px dashed darkgoldenrod;
		}
		::view-transition-old(${name}) {
      opacity: 1;
			outline: 2px dashed darkslateblue;
		}
		::view-transition-new(${name}) {
			opacity: 1;
			outline: 2px dashed darkolivegreen;
		}`,
		'glow'
	);
	self.setTimeout(() => setStyles('', 'glow'), 300);
}

export function showSomeAnimations() {
	const firstName = top!.document.querySelector<HTMLLIElement>('#vtbag-ui-names li');
	//select
	firstName?.click();
	//and unselect again
	firstName?.click();
	// might open the animation panel as a side effect
}
