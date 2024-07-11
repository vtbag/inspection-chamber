//@ts-ignore
import bench from './bench.txt';

import { setTransitionNames } from './stylesheets';
import { initDragging } from './dragging';
import { showReopener } from './reopener';
import { Modus } from './types';
import { addFrames } from './styles';
import { message } from './panel/messages';
import { clearVtActive, exitViewTransition, mayViewTransition, setVtActive, vtActive } from './panel/transition';
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

const titleLogo = "🔬";

top!.__vtbag ??= {};
top!.__vtbag.inspectionChamber ??= {};
const inspectionChamber = top!.__vtbag.inspectionChamber!;

let firstModusInteraction = true;

if (top === self) {
	setTimeout(initPanel, 500);
} else {
	initSpecimen();
}

function initSpecimen() {
	const frameDocument = inspectionChamber.frameDocument = self.document;

	self.addEventListener('pageswap', () => pageSwap());
	self.addEventListener('pagereveal', (e) => {
		inspectionChamber.viewTransition = e.viewTransition;
		pageReveal();
	});
	monkeyPatchStartViewTransition();

	function monkeyPatchStartViewTransition() {
		const originalStartViewTransition = frameDocument.startViewTransition;
		// todo: add level 2 options
		frameDocument.startViewTransition = (cb: () => void | Promise<void>) => {
			pageSwap();
			const viewTransition = (inspectionChamber.viewTransition = originalStartViewTransition.call(
				frameDocument,
				async () => {
					await Promise.resolve();
					await cb();
					pageReveal();
				}
			));
			return viewTransition;
		};
	}
}

function pageSwap() {
	inspectionChamber.glow?.cancel();
	addFrames(false);
}

function pageReveal() {
	if (inspectionChamber.viewTransition) {
		forceAnimations();
		updateCallbackDone();
	}
}

function updateCallbackDone() {
	setVtActive();
	const root = top!.document.documentElement;
	const viewTransition = inspectionChamber.viewTransition!;
	const modusFunction: Record<Modus, () => void> = {
		bypass: () => { },
		'slow-motion': setupSlowMotionPlay,
		control: controlledPlay,
		compare: () => { },
	};

	const modus = root.dataset.vtbagModus as Modus;

	viewTransition.ready.then(async () => {
		if (modus && modus !== 'bypass') {
			const canvas = top!.document.querySelector<HTMLCanvasElement>('#canvas')!;
			canvas.style.zIndex = '1000';

			canvas.style.cursor = 'wait';
			await retrieveViewTransitionAnimations();
			addFrames(top!.document.querySelector<HTMLInputElement>('#vtbag-ui-framed')!.checked);
			inspectionChamber.twin!.ownerDocument.addEventListener('click', twinClick);

			modusFunction[modus]();
		}
		console.log('self.location.href :>> ', self.location.href);
		top!.history.replaceState(history.state, '', self.location.href);
		top!.document.title = titleLogo + " " + self.document.title;
	});

	viewTransition!.finished.finally(() => {
		clearVtActive();
		inspectionChamber.viewTransition = undefined;
		!top!.document.querySelector('#vtbag-twin--view-transition')?.remove();

		unleashAllAnimations();
		inspectionChamber.animations = undefined;
		inspectionChamber.longestAnimation = undefined;
		addFrames(top!.document.querySelector<HTMLInputElement>('#vtbag-ui-framed')!.checked);
		updateNames(setTransitionNames());
		updateImageVisibility();
		top!.document.querySelector<HTMLSpanElement>('#vtbag-ui-slo-mo-progress')!.innerText = '';
		!root.dataset.vtbagModus && top!.document.querySelector<HTMLLIElement>('#vtbag-ui-modi li input')?.click();
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
	if (sessionStorage.getItem('vtbag-ui-closed') === 'true') {
		showReopener();
		return;
	}
	const colorScheme = top!.getComputedStyle(root).colorScheme;
	const docTitle = top!.document.title;
	const icon = top!.document.querySelector<HTMLLinkElement>('link[rel="icon"]')?.outerHTML ?? "";

	const page = (await bench).replace(
		'<iframe id="vtbag-main-frame" src="/"></iframe>',
		`<iframe id="vtbag-main-frame" style="opacity: 0;" src="${location.href}"></iframe>`).replace('<title></title>', `<title>${titleLogo} ${docTitle}</title>`).replace(`<link rel="icon"/>`, icon);

	top!.addEventListener('resize', setOrientation);
	setOrientation();
	root.innerHTML = page;
	root.style.colorScheme = colorScheme;
	setBackgroundAccent();

	root.dataset.vtbagModus = '';
	const mainFrame = top!.document.querySelector<HTMLIFrameElement>('#vtbag-main-frame')!;
	await new Promise((r) => (mainFrame.onload = r));

	if (!top!.document.startViewTransition) {
		top!.document.querySelector('#vtbag-ui-messages')!.innerHTML = `
			<p>I'm sorry!</p><p>Native view transitions are required to make the 🔬 Inspection Chamber work, but they are not supported by this browser.</p>
			<p>Sadly have to give up.</p>`;
		top!.document
			.querySelectorAll('#vtbag-ui-modi, #vtbag-ui-filter, #vtbag-ui-names, #vtbag-ui-info')
			.forEach((e) => e.remove());
		return;
	}
	const frameDocument = (top!.__vtbag.inspectionChamber!.frameDocument =
		mainFrame.contentDocument!);

	updateNames(setTransitionNames());
	initPanelHandlers();
	initDragging(top!.document.querySelector('#divider')!, (e: MouseEvent | TouchEvent) => {
		const clientX = (e instanceof TouchEvent ? e.touches[0]?.clientX : e.clientX) ?? 0;
		const clientY = (e instanceof TouchEvent ? e.touches[0]?.clientY : e.clientY) ?? 0;

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
	mainFrame.animate([{ opacity: 0 }, { opacity: 1 }], {
		duration: 50,
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
				}
			});
		}
	}
}

function setOrientation() {
	const html = top!.document.documentElement;
	const panelOrientation = localStorage.getItem('vtbag-ui-panel-orientation') ?? '';
	if (panelOrientation) {
		panelOrientation.split(' ').forEach((c) => html.classList.add(c));
	} else {
		if (top!.matchMedia('(orientation: landscape)').matches !==
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
		localStorage.setItem('vtbag-ui-panel-orientation', [...classes].filter((c) => c.startsWith('vtbag-ui-')).join(' '));
	}, 'switch orientation');
}

function initPanelHandlers() {
	top!.document.querySelector('#vtbag-ui-turn')!.addEventListener('click', switchOrientation);

	top!.document.querySelector('#vtbag-ui-light-dark')!.addEventListener('click', () => {
		const rootStyle = top!.document.documentElement.style;
		top!.document.querySelector<HTMLIFrameElement>(
			'#vtbag-main-frame'
		)!.contentDocument!.documentElement.style.colorScheme = rootStyle.colorScheme =
			rootStyle.colorScheme === 'dark' ? 'light' : 'dark';
		setBackgroundAccent();
	});
	top!.document.querySelector('#vtbag-ui-close')!.addEventListener('click', () => {
		top!.sessionStorage.setItem('vtbag-ui-closed', 'true');
		top!.location.reload();
	});
	top!.document.querySelector('#vtbag-ui-modi ul')!.addEventListener('change', updateModus);

	initFilter();
	initNames();
	const framed = top!.document.querySelector<HTMLInputElement>('#vtbag-ui-framed')!;
	framed.addEventListener('change', (e) => {
		const framed = (e.target as HTMLInputElement).checked;
		localStorage.setItem('vtbag-ui-framed', framed ? "X" : "");
		addFrames(framed);
	});

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
				top!.sessionStorage.setItem('vtbag-ui-closed', 'true');
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
				top!.document.querySelector<HTMLInputElement>('#vtbag-ui-messages')!.innerHTML =
					message[modus];

				if (firstModusInteraction) {
					firstModusInteraction = false;
					top!.document
						.querySelector('#vtbag-ui-panel')
						?.insertAdjacentElement(
							'afterbegin',
							top!.document.querySelector<HTMLInputElement>('#vtbag-ui-modi')!
						);
				}
			}, 'update-modus');
		}
	}
}

function attachFrameToggle(divId: string) {
	const framed = top!.document.querySelector<HTMLInputElement>('#vtbag-ui-framed')!;
	const parent = framed.parentElement;
	const div = top!.document.querySelector(divId);
	framed.checked = !!localStorage.getItem('vtbag-ui-framed');
	addFrames(framed.checked);

	if (parent && div && parent.parentElement !== div) div.insertAdjacentElement('beforeend', parent);
}
