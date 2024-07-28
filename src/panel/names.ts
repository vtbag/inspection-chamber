import { listAnimations } from '../animations';
import { setStyles } from '../styles';
import { syncTwins } from '../twin';
import { resetFilter, resetSelected } from './filter';
import { controllerChanged, updateControl } from './full-control';
import { plugInPanel } from './inner';
import { mayViewTransition, vtActive } from './transition';

export let updateNameVisibilityTimeout: number | undefined;

export function updateNames(leftTransitionNames: Set<string>, rightTransitionNames?: Set<string>) {
	//navigator.clipboard.writeText("");
	let names;
	mayViewTransition(() => {
		top!.document.querySelector('#vtbag-ui-info')!.innerHTML = '';
		top!.document.querySelectorAll('#vtbag-ui-names li').forEach((li) => li.remove());
		top!.document.querySelector<HTMLElement>('#vtbag-ui-names h4')!.innerText = rightTransitionNames
			? 'Animation Groups'
			: 'Elements w/ View Transition Names';

		top!.document.querySelector<HTMLElement>('#vtbag-ui-names div')!.style.display =
			rightTransitionNames ? 'flex' : 'none';
		const list = top!.document.querySelector('#vtbag-ui-names > ol')!;
		names = [...new Set([...leftTransitionNames, ...(rightTransitionNames ?? [])])].sort();
		names.forEach((name, idx) => {
			const li = top!.document.createElement('li');
			li.innerText = name;
			if (rightTransitionNames && leftTransitionNames.has(name)) {
				li.classList.add('old');
			}
			if (rightTransitionNames?.has(name)) {
				li.classList.add('new');
			}
			li.style.viewTransitionName = `vtbag-name-${idx}`;
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

export function updateNameVisibility() {
	const inspectionChamber = top!.__vtbag.inspectionChamber!;
	if (controllerChanged()) {
		syncTwins();

		inspectionChamber.updateNameVisibilityTimeout = undefined;
		const twinDocument = inspectionChamber.twin!.ownerDocument;
		const topDocument = top!.document;
		const computedStyle = top!.getComputedStyle(topDocument.documentElement);
		const column = topDocument.documentElement.classList.contains('vtbag-ui-column');
		const panelWidth = column
			? parseFloat(computedStyle.getPropertyValue('--vtbag-panel-width') || '0')
			: 0;
		const panelHeight = column
			? 0
			: parseFloat(computedStyle.getPropertyValue('--vtbag-panel-height') || '0');
		topDocument.querySelectorAll<HTMLLIElement>('#vtbag-ui-names li').forEach((li) => {
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

		if (vtActive()) {
			inspectionChamber.updateNameVisibilityTimeout = top!.setTimeout(updateNameVisibility, 1000);
		}
	}
}

function insideViewport(element: HTMLElement | null, panelWidth = 0, panelHeight = 0) {
	if (!element) return undefined;
	const { top, right, bottom, left, width, height } = element.getBoundingClientRect();

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

	top!.document.querySelectorAll<HTMLLIElement>('#vtbag-ui-names li').forEach((li) => {
		const name = li.innerText;
		const classes = li.classList;
		if (classes.contains('old-hidden')) {
			rules.push(`::view-transition-old(${name}) { visibility: hidden; }`);
		}
		if (classes.contains('new-hidden')) {
			rules.push(`::view-transition-new(${name}) { visibility: hidden; }`);
		}
	});
	setStyles(rules.join('\n'), 'image-visibility');
}

function highlightNames(name: string) {
	const control =
		top!.document.documentElement.dataset.vtbagModus === 'control' &&
		top!.document.querySelector<HTMLElement>('#vtbag-ui-names h4')!.innerText ===
			'Animation Groups';
	const lis = top!.document.querySelectorAll<HTMLLIElement>('#vtbag-ui-names li');
	let selected: HTMLLIElement | undefined;
	lis.forEach((li) => {
		if (li.innerText === name) {
			const sel = top!.document.querySelector<HTMLInputElement>('#vtbag-ui-controller')!;
			const prog = top!.document.querySelector<HTMLInputElement>('#vtbag-ui-progress')!;
			const unsel = top!.document.querySelector<HTMLInputElement>('#vtbag-ui-controller2')!;
			const unprog = top!.document.querySelector<HTMLInputElement>('#vtbag-ui-progress2')!;
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
	top!.document
		.querySelector('#vtbag-ui-names button')!
		.addEventListener('click', () => resetSelected());
	top!.document
		.querySelector<HTMLSpanElement>('#vtbag-ui-names-old')!
		.addEventListener('click', () => {
			top!.document.querySelectorAll<HTMLLIElement>('#vtbag-ui-names li').forEach((li) => {
				if (li.classList.contains('old')) {
					li.classList.toggle('old-hidden');
				}
			});
			updateImageVisibility();
		});
	top!.document
		.querySelector<HTMLSpanElement>('#vtbag-ui-names-new')!
		.addEventListener('click', () => {
			top!.document.querySelectorAll<HTMLLIElement>('#vtbag-ui-names li').forEach((li) => {
				if (li.classList.contains('new')) {
					li.classList.toggle('new-hidden');
				}
			});
			updateImageVisibility();
		});

	top!.document.querySelector('#vtbag-ui-names ol')!.addEventListener('click', (e) => {
		if (e.target instanceof HTMLElement) {
			const targetLi = e.target.closest('li');

			if (targetLi && e instanceof MouseEvent) {
				if (targetLi.style.display === 'none') resetFilter();
				const modus = top!.document.documentElement.dataset.vtbagModus;
				mayViewTransition(
					() => {
						const { left, width } = targetLi.getBoundingClientRect();
						const x = e.clientX - left;
						const leftClick = x >= 0 && x <= 20;
						const rightClick = x >= width - 20 && x <= width;

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
						highlightInFrame(name);
						highlightNames(name);
						const elem = window.top!.__vtbag.inspectionChamber?.frameDocument!.querySelector(
							`[data-vtbag-transition-name="${name}"]`
						);

						if (modus && modus !== 'bypass') writeSelectorToClipboard(elem);
						listAnimations(name);
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
	{ boxShadow: '0 0  0px blue' },
	{ boxShadow: '0 0 50px blue' },
	{
		boxShadow: '0 0 100px blue',
		display: 'inline-block',
		minWidth: '20px',
		minHeight: '20px',
		backgroundColor: 'darkslateblue',
		opacity: '0.5',
	},
	{ boxShadow: '0 0 50px blue' },
	{ boxShadow: '0 0  0px blue' },
];

export function highlightInFrame(name: string) {
	const modus = top!.document.documentElement.dataset.vtbagModus;
	if (!modus || modus === 'bypass') return;
	if (vtActive()) {
		glowPseudo(name);
	} else if (!top!.__vtbag.inspectionChamber!.viewTransition) {
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
			glow[2]!.display = !display.includes('block') ? 'inline-block' : display;
			chamber.glow = el.animate(glow, { delay: 250, duration: 500, iterations: 1 });
			setTimeout(() => (chamber.glow = undefined), 500);
		}
	}
}

function glowPseudo(name: string) {
	setStyles(
		`
		::view-transition-old(*),
		::view-transition-new(*) {
			opacity: 0;
		}
		::view-transition-old(${name}) {
			box-shadow: 0 0 100px blue;
			background-color: darkslateblue;
      opacity: 1;
			transition: all 0.5s;
		}
		::view-transition-new(${name}) {
			box-shadow: 0 0 100px green;
			background-color: darkolivegreen;
      opacity: 1;
			transition: all 0.5s;
		}`,
		'glow'
	);
	setTimeout(() => setStyles('', 'glow'), 500);
}
