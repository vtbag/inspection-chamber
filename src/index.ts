//@ts-ignore
import bench from './bench.txt';

import { setTransitionNames } from './stylesheets';
import { initDragging } from './dragging';
import { showReopener, STANDBY } from './reopener';
import { Modus } from './types';
import { addFrames } from './styles';
import { message } from './panel/messages';
import {
	clearVtActive,
	exitViewTransition,
	mayViewTransition,
	setVtActive,
	vtActive,
} from './panel/transition';
import { initSlowMotion, setupSlowMotionPlay } from './panel/slow-motion';
import { controlledPlay, initController } from './panel/full-control';
import {
	forceAnimations,
	retrieveViewTransitionAnimations,
	unleashAllAnimations,
} from './animations';
import { initNames, updateImageVisibility, updateNames } from './panel/names';
import { initFilter } from './panel/filter';
import { twinClick } from './twin';
import { DEBUG } from './panel/debug';
import { initInnerPanel, mightHideMode, plugInPanel } from './panel/inner';

const ORIENTATION = 'vtbag-ui-panel-orientation';
const FRAMED = 'vtbag-ui-framed';
const NAMED_ONLY = 'named_only';
const titleLogo = '🔬';

top!.__vtbag ??= {};
top!.__vtbag.inspectionChamber ??= { initialized: false };
const inspectionChamber = top!.__vtbag.inspectionChamber!;

let firstModusInteraction = true;

if (top === self) {
	top.setTimeout(initPanel, 500);
} else {
	initSpecimen();
}

function initSpecimen() {
	const frameDocument = (inspectionChamber.frameDocument = self.document);

	self.addEventListener('pageswap', pageSwap, { once: true });
	self.addEventListener('pagereveal', prePageReveal, { once: true });
	if (!inspectionChamber.initialized) {
		inspectionChamber.initialized = true;
		monkeyPatchStartViewTransition();
	}

	function monkeyPatchStartViewTransition() {
		const originalStartViewTransition = frameDocument.startViewTransition;
		// todo: add level 2 options
		frameDocument.startViewTransition = (cb: () => void | Promise<void>) => {
			pageSwap();
			inspectionChamber.viewTransition = originalStartViewTransition.call(
				frameDocument,
				async () => {
					await Promise.resolve();
					await cb();
					pageReveal();
				}
			);
			return inspectionChamber.viewTransition;
		};
	}
}

function pageSwap() {
	DEBUG && console.log('pageSwap');
	inspectionChamber.glow?.cancel();
	addFrames(false, false);
}

function prePageReveal(e: Event) {
	inspectionChamber.viewTransition =
		('viewTransition' in e && (e.viewTransition as ViewTransition)) || undefined;
	pageReveal();
}
function pageReveal() {
	DEBUG && console.log('pageReveal');
	if (inspectionChamber.viewTransition) {
		forceAnimations();
		beforeUpdateCallbackDone();
	}
}

function beforeUpdateCallbackDone() {
	setVtActive();
	const root = top!.document.documentElement;
	const viewTransition = inspectionChamber.viewTransition!;
	const modusFunction: Record<Modus, () => void> = {
		bypass: () => {},
		'slow-motion': setupSlowMotionPlay,
		control: controlledPlay,
		compare: () => {},
	};
	const modus = root.dataset.vtbagModus as Modus;

	viewTransition.updateCallbackDone.catch(() => {});

	viewTransition.ready
		.then(async () => {
			if (modus && modus !== 'bypass') {
				const canvas = top!.document.querySelector<HTMLCanvasElement>('#canvas');
				if (canvas) {
					canvas.style.zIndex = '1000';
					canvas.style.cursor = 'wait';
				}
				await retrieveViewTransitionAnimations();
				addFrames(
					!!top!.document.querySelector<HTMLInputElement>('#vtbag-ui-framed')?.checked,
					!!top!.document.querySelector<HTMLInputElement>('#vtbag-ui-named-only')?.checked
				);
				inspectionChamber.twin!.ownerDocument.addEventListener('click', twinClick);

				modusFunction[modus]();
			}
			top!.history.replaceState(history.state, '', self.location.href);
			top!.document.title = titleLogo + ' ' + self.document.title;
		})
		.finally(() => {});

	viewTransition!.finished.finally(() => {
		clearVtActive();
		inspectionChamber.viewTransition = undefined;
		const twin = top!.__vtbag.inspectionChamber?.frameDocument
			?.querySelector('#vtbag-twin--view-transition')
			?.remove();

		unleashAllAnimations();
		inspectionChamber.animations = undefined;
		inspectionChamber.longestAnimation = undefined;
		addFrames(
			!!top!.document.querySelector<HTMLInputElement>('#vtbag-ui-framed')?.checked,
			!!top!.document.querySelector<HTMLInputElement>('#vtbag-ui-named-only')?.checked
		);
		updateNames(setTransitionNames());
		updateImageVisibility();
		top!.document.querySelector<HTMLSpanElement>('#vtbag-ui-slo-mo-progress')!.innerText = '';
		top!.document.querySelector<HTMLSpanElement>('#vtbag-ui-animations')!.innerText = '';
		!root.dataset.vtbagModus &&
			top!.document.querySelector<HTMLLIElement>('#vtbag-ui-modi li input')?.click();
		setTimeout(() => {
			const empty = top!.document.querySelector<HTMLDivElement>(
				'#vtbag-ui-inner-panel:has( > div:nth-of-type(2):empty)'
			);
			empty && (empty.style.display = 'none');
		}, 100);
	});
}

function setBackgroundAccent() {
	const root = top!.document.documentElement;
	root.style.setProperty(
		'--vtbag-background-accent',
		root.style.colorScheme === 'dark' ? '#4E545D' : '#c6d1d7'
	);
}

async function initPanel() {
	if (top!.document.querySelector('#vtbag-ui-panel')) return;

	const root = top!.document.documentElement;
	if (top!.sessionStorage.getItem(STANDBY) === 'true') {
		showReopener();
		return;
	}
	const colorScheme = top!.getComputedStyle(root).colorScheme;
	const docTitle = top!.document.title;
	const icon = top!.document.querySelector<HTMLLinkElement>('link[rel="icon"]')?.outerHTML ?? '';

	const page = (await bench)
		.replace(
			'<iframe id="vtbag-main-frame" src="/"></iframe>',
			`<iframe id="vtbag-main-frame" style="opacity: 0;" src="${location.href}"></iframe>`
		)
		.replace('<title></title>', `<title>${titleLogo} ${docTitle}</title>`)
		.replace(`<link rel="icon"/>`, icon);

	top!.addEventListener('resize', setOrientation);
	root.innerHTML = page;
	root.style.colorScheme = colorScheme;
	setOrientation();
	setBackgroundAccent();

	root.dataset.vtbagModus = '';
	const mainFrame = top!.document.querySelector<HTMLIFrameElement>('#vtbag-main-frame')!;
	await new Promise((r) => (mainFrame.onload = r));

	if (!top!.document.startViewTransition) {
		top!.document.querySelector('#vtbag-ui-messages')!.innerHTML = `
			<p>I'm sorry!</p><p>Native view transitions are required to make the 🔬 Inspection Chamber work, but they are not supported by this browser.</p>
			<p>Sadly have to give up.</p>`;
		top!.document
			.querySelectorAll(
				'#vtbag-ui-modi, #vtbag-ui-filter, #vtbag-ui-names, #vtbag-ui-animations, #vtbag-ui-info'
			)
			.forEach((e) => e.remove());
		return;
	}
	const frameDocument = (top!.__vtbag.inspectionChamber!.frameDocument =
		mainFrame.contentDocument!);

	updateNames(setTransitionNames());
	initPanelHandlers();
	const divider = top!.document.querySelector<HTMLDivElement>('#divider')!;
	initDragging(divider, (clientX, clientY) => {
		if (root.classList.contains('vtbag-ui-column')) {
			if (root.classList.contains('vtbag-ui-tl'))
				root.style.setProperty(
					'--vtbag-panel-width',
					`calc(max(200px, ${Math.min(innerWidth - 100, clientX)}px))`
				);
			else
				root.style.setProperty(
					'--vtbag-panel-width',
					`calc(max(200px, 100vw - ${Math.max(100, clientX + 1)}px))`
				);
		} else {
			if (root.classList.contains('vtbag-ui-tl'))
				root.style.setProperty(
					'--vtbag-panel-height',
					`calc(max(212px, ${Math.min(innerHeight - 100, clientY)}px))`
				);
			else
				root.style.setProperty(
					'--vtbag-panel-height',
					`calc(max(212px, 100vh - ${Math.max(100, clientY + 1)}px))`
				);
		}
	});
	mainFrame.animate([{ opacity: 0, transform: 'translateY(100vh)' }, { opacity: 1 }], {
		duration: 500,
		fill: 'forwards',
	});
	frameDocument!.addEventListener('click', innerClick);
}

function innerClick(e: MouseEvent) {
	if (!vtActive() && !e.defaultPrevented) {
		const target = e.target as HTMLElement;
		const vt = target.closest<HTMLElement>('[data-vtbag-transition-name]');
		if (vt) {
			const name = vt.dataset.vtbagTransitionName;
			top!.document.querySelectorAll<HTMLLIElement>('#vtbag-ui-names li').forEach((li) => {
				if (li.innerText === name) {
					li.click();
					if (e.ctrlKey && e.shiftKey) e.preventDefault();
				}
			});
		}
	}
}

function setOrientation() {
	const html = top!.document.documentElement;
	const panelOrientation = top!.localStorage.getItem(ORIENTATION) ?? '';
	if (panelOrientation) {
		panelOrientation.split(' ').forEach((c) => html.classList.add(c));
		updateTurner();
	} else {
		if (
			top!.matchMedia('(orientation: landscape)').matches !==
			html.classList.contains('vtbag-ui-column')
		)
			switchOrientation();
	}
}

function switchOrientation() {
	// changing the snapshot containing block size skips the transition
	mayViewTransition(() => {
		const classes = top!.document.documentElement.classList;
		exitViewTransition();
		classes.toggle('vtbag-ui-column');
		if (classes.contains('vtbag-ui-column')) {
			classes.toggle('vtbag-ui-tl');
		}
		top!.localStorage.setItem(
			ORIENTATION,
			[...classes].filter((c) => c.startsWith('vtbag-ui-')).join(' ')
		);
		updateTurner();
	}, 'switch orientation');
}
function updateTurner() {
	const turner = top!.document.querySelector<HTMLButtonElement>('#vtbag-ui-turn')!;
	const classes = top!.document.documentElement.classList;
	turner.innerText = '⤪⤨⤩⤧'[
		(classes.contains('vtbag-ui-column') ? 2 : 0) + (classes.contains('vtbag-ui-tl') ? 1 : 0)
	];
}
function initPanelHandlers() {
	const turner = top!.document.querySelector('#vtbag-ui-turn')!;
	turner.addEventListener('click', () => switchOrientation());

	top!.document.querySelector('#vtbag-ui-light-dark')!.addEventListener('click', () => {
		const rootStyle = top!.document.documentElement.style;
		top!.document.querySelector<HTMLIFrameElement>(
			'#vtbag-main-frame'
		)!.contentDocument!.documentElement.style.colorScheme = rootStyle.colorScheme =
			rootStyle.colorScheme === 'dark' ? 'light' : 'dark';
		setBackgroundAccent();
	});

	initInnerPanel();

	top!.document.querySelector('#vtbag-ui-standby')!.addEventListener('click', () => {
		top!.sessionStorage.setItem(STANDBY, 'true');
		top!.location.reload();
	});
	top!.document.querySelector('#vtbag-ui-modi ul')!.addEventListener('change', updateModus);

	initFilter();
	initNames();
	const framedCheck = top!.document.querySelector<HTMLInputElement>('#vtbag-ui-framed')!;
	const namedOnlyCheck = top!.document.querySelector<HTMLInputElement>('#vtbag-ui-named-only')!;
	framedCheck.addEventListener('change', frameChange);
	namedOnlyCheck.addEventListener('change', frameChange);

	function frameChange() {
		const framed = framedCheck.checked;
		const namedOnly = namedOnlyCheck.checked;
		top!.sessionStorage.setItem(FRAMED, framed ? 'X' : '');
		top!.sessionStorage.setItem(NAMED_ONLY, namedOnly ? 'X' : '');
		addFrames(framed, namedOnly);
	}

	initSlowMotion();
	initController();
	top!.document
		.querySelectorAll('#vtbag-ui-control-exit, #vtbag-ui-control-play')
		.forEach((e) => e.addEventListener('click', exitViewTransition));

	top!.addEventListener('keyup', function (e) {
		if (e.key === 'Escape') {
			if (vtActive()) {
				exitViewTransition();
			} else {
				top!.sessionStorage.setItem(STANDBY, 'true');
				top!.location.reload();
			}
		}
	});
}

function updateModus() {
	const root = top!.document.documentElement;
	const checked = top!.document.querySelector<HTMLInputElement>('#vtbag-ui-modi ul input:checked');
	if (checked) {
		const modus = checked.id.replace('vtbag-m-', '') as Modus;
		if (modus !== root.dataset.vtbagModus) {
			mayViewTransition(() => {
				root.dataset.vtbagModus = modus;
				exitViewTransition();

				top!.document.querySelector<HTMLInputElement>('#vtbag-ui-filter ul input')!.click();
				if (modus === 'slow-motion') {
					attachFrameToggle('#vtbag-ui-slow-motion');
				}
				if (modus === 'control') {
					attachFrameToggle('#vtbag-ui-control');
				}
				if (modus === 'bypass') {
					attachFrameToggle('#vtbag-ui-modi');
				}
				const messages = top!.document.querySelector<HTMLInputElement>('#vtbag-ui-messages')!;
				messages.innerHTML = message[modus];
				plugInPanel(messages);

				const modi = top!.document.querySelector<HTMLDivElement>('#vtbag-ui-modi')!;
				if (
					firstModusInteraction &&
					modi.parentElement?.id === 'vtbag-ui-panel' &&
					messages.parentElement?.id === 'vtbag-ui-panel'
				) {
					firstModusInteraction = false;
					top!.document
						.querySelector('#vtbag-ui-panel')
						?.insertAdjacentElement(
							'afterbegin',
							top!.document.querySelector<HTMLInputElement>('#vtbag-ui-modi')!
						);
				}
				mightHideMode();
			}, 'update-modus');
		}
	}
}

function attachFrameToggle(divId: string) {
	const framed = top!.document.querySelector<HTMLInputElement>('#vtbag-ui-framed')!;
	const namedOnly = top!.document.querySelector<HTMLInputElement>('#vtbag-ui-named-only')!;
	const parent = framed.parentElement;
	const div = top!.document.querySelector(divId);
	framed.checked = !!top!.sessionStorage.getItem(FRAMED);
	namedOnly.checked = !!top!.sessionStorage.getItem(NAMED_ONLY);
	addFrames(framed.checked, namedOnly.checked);

	if (parent && div && parent.parentElement !== div) div.insertAdjacentElement('beforeend', parent);
}
