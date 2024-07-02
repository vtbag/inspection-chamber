//@ts-ignore
//import bench from "./bench.txt";

import { setTransitionNames } from "./stylesheets";
import { initDragging } from "./dragging";
import { showReopener } from "./reopener";
import { Modus } from "./types";
import { addFrames } from "./styles";
import { message } from "./panel/messages";
import { exitViewTransition, mayViewTransition } from "./panel/transition";
import { initSlowMotion, sloMoPlay } from "./panel/slow-motion";
import { controlledPlay, initController } from "./panel/full-control";
import { forceAnimations, retrieveViewTransitionAnimations, unleashAllAnimations } from "./animations";
import { initNames, updateImageVisibility, updateNames } from "./panel/names";
import { initFilter } from "./panel/filter";

top!.__vtbag ??= {};
top!.__vtbag.inspectionChamber ??= {};
const inspectionChamber = top!.__vtbag.inspectionChamber!;

if (top === self) {
	addEventListener('pageshow', () => {
		setTimeout(initPanel, 500);
	});
} else {
	initSpecimen();
}


function initSpecimen() {
	self.addEventListener('pageswap', (e) => pageSwap());
	self.addEventListener('pagereveal', (e) => {
		inspectionChamber.viewTransition = e.viewTransition;
		inspectionChamber.frameDocument = self.document;
		pageReveal();
	});
}


function pageSwap() {
	inspectionChamber.glow?.cancel();
	addFrames(false);
}

function pageReveal() {
	if (inspectionChamber.viewTransition) {
		forceAnimations(top!.document.querySelector<HTMLIFrameElement>('#vtbot-main-frame')!.contentDocument!);
		updateCallbackDone();
	}
	inspectionChamber.frameDocument!.addEventListener('click', innerClick);
}



function updateCallbackDone() {
	const root = top!.document.documentElement;
	root.classList.add('vtbot-vt-active');
	const frameDocument = inspectionChamber.frameDocument!;
	const viewTransition = inspectionChamber.viewTransition!;
	const modusFunction: Record<Modus, () => void> = {
		bypass: () => { },
		'slow-motion': sloMoPlay,
		control: controlledPlay,
		compare: () => { },
	};
	const modus = root.dataset.vtbotModus as Modus;

	viewTransition.ready.then(async () => {
		if (modus && modus !== 'bypass') {
			const canvas = top!.document.querySelector<HTMLCanvasElement>("#canvas")!;
			canvas.style.zIndex = "1000";
			canvas.style.cursor = 'wait';
			await retrieveViewTransitionAnimations(frameDocument);
			addFrames(top!.document.querySelector<HTMLInputElement>('#vtbot-ui-styled')!.checked);
			modusFunction[modus]();
		}
		top!.history.pushState(history.state, '', self.location.href);
	});

	viewTransition!.finished.finally(() => {
		inspectionChamber.viewTransition = undefined;
		root.classList.remove('vtbot-vt-active');
		unleashAllAnimations();
		inspectionChamber.animations = undefined;
		inspectionChamber.longestAnimation = undefined;
		updateNames(setTransitionNames());
		updateImageVisibility();
		top!.document.querySelector<HTMLSpanElement>("#vtbot-ui-slo-mo-progress")!.innerText = "";
	});
}







function setBackgroundAccent() {
	const root = top!.document.documentElement;
	root.style.setProperty("--vtbot-background-accent", root.style.colorScheme === 'dark' ? "#4E545D" : "#c6d1d7");
}




async function initPanel() {
	const root = top!.document.documentElement;
	if (sessionStorage.getItem('vtbot-ui-closed') === 'true') {
		showReopener();
		return;
	}
	const colorScheme = top!.getComputedStyle(root).colorScheme;
	const docTitle = top!.document.title;

	const page = (await (await fetch("/bench/")).text()).replace(
		// const page = bench.replace(
		'<iframe id="vtbot-main-frame" src="/"></iframe>',
		`<iframe id="vtbot-main-frame" style="opacity: 0" src="${location.href}"></iframe>`
	);
	top!.addEventListener('resize', setOrientation);
	setOrientation();
	root.innerHTML = page;
	root.style.colorScheme = colorScheme;
	setBackgroundAccent();


	root.dataset.vtbotModus = '';
	const mainFrame = top!.document.querySelector<HTMLIFrameElement>('#vtbot-main-frame')!;
	await new Promise((r) => (mainFrame.onload = r));

	if (!top!.document.startViewTransition) {
		top!.document.querySelector('#vtbot-ui-messages')!.innerHTML = `
			<h4>You are &hellip;</h4>
			<p>&hellip; in the <b>Engine Room</b><img style="width:4em; float:right" src="/favicon.svg" /> deep down at the bottom of <b>The Bag!</b></p>
			<p>I'm sorry!</p><p>Native view transitions are required to make the Test Chamber work, but they are not supported by this browser.</p>
			<p>Sadly have to give up.</p>`;
		top!.document
			.querySelectorAll('#vtbot-ui-modi, #vtbot-ui-filter, #vtbot-ui-names, #vtbot-ui-info')
			.forEach((e) => e.remove());
		return;
	}
	top!.document.title = '⛑️ ' + docTitle;
	const frameDocument = top!.__vtbag.inspectionChamber!.frameDocument = mainFrame.contentDocument!;

	const originalStartViewTransition = frameDocument.startViewTransition;
	frameDocument.startViewTransition = (cb: () => void | Promise<void>) => {
		pageSwap();
		inspectionChamber.frameDocument = frameDocument;
		const viewTransition = inspectionChamber.viewTransition = originalStartViewTransition.call(frameDocument, async () => {
			await Promise.resolve();
			await cb();
			pageReveal();
		});
		return viewTransition;
	};
	updateNames(setTransitionNames());
	initPanelHandlers(mainFrame);
	initDragging(top!.document.querySelector('#divider')!, (e: MouseEvent | TouchEvent) => {
		const clientX = (e instanceof TouchEvent ? e.touches[0]?.clientX : e.clientX) ?? 0;
		const clientY = (e instanceof TouchEvent ? e.touches[0]?.clientY : e.clientY) ?? 0;

		if (root.classList.contains('vtbot-ui-column')) {
			root.style.setProperty(
				'--vtbot-panel-width',
				`calc(max(188px, 100vw - ${Math.max(100, clientX + 1)}px))`
			);
		} else {
			root.style.setProperty(
				'--vtbot-panel-height',
				`calc(max(212px, 100vh - ${Math.max(100, clientY + 1)}px))`
			);
		}
	});
	mainFrame.animate([{ opacity: 0 }, { opacity: 1 }], {
		duration: 50,
		fill: 'forwards',
	});
}

function innerClick(e: MouseEvent) {
	const target = e.target as HTMLElement;
	if (!top!.document.documentElement.classList.contains('vtbot-vt-active')) {
		if (e.defaultPrevented) return;
		const vt = target.closest<HTMLElement>('[data-vtbot-transition-name]');
		if (vt) {
			const name = vt.dataset.vtbotTransitionName;
			top!.document.querySelectorAll<HTMLLIElement>('#vtbot-ui-names li').forEach((li) => {
				if (li.innerText === name) {
					li.click();
				}
			});
		}
	} else {
		let entry: HTMLLIElement | undefined;
		let size = Infinity;
		target.ownerDocument
			.querySelectorAll<HTMLElement>('#vtbot-twin--view-transition > vtbot-pseudo-twin > vtbot-pseudo-twin > vtbot-pseudo-twin')
			.forEach((d) => {
				const { clientX, clientY } = e;
				const { top, bottom, left, right, width, height } = d.getBoundingClientRect();
				const name = d.id.substring('vtbot-twin--view-transition-new-'.length);
				const len = 'vtbot-twin--view-transition-'.length;
				const pseudo = d.id.substring(len, len + 3);
				if (
					width * height < size &&
					top <= clientY &&
					clientY <= bottom &&
					left <= clientX &&
					clientX <= right
				) {
					let visible = true;
					let me;
					window.top!.document.querySelectorAll<HTMLLIElement>('#vtbot-ui-names li').forEach((li) => {
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

function setOrientation() {
	const html = top!.document.documentElement;
	if (
		top!.matchMedia('(orientation: landscape)').matches !==
		html.classList.contains('vtbot-ui-column')
	)
		switchOrientation();
}

function switchOrientation() {
	// changing the snapshot containing block size skips the transition
	mayViewTransition(() => {
		exitViewTransition();
		top!.document.documentElement.classList.toggle('vtbot-ui-column');
	}, 'switch orientation');
}



function initPanelHandlers(frame: HTMLIFrameElement) {
	top!.document.querySelector('#vtbot-ui-turn')!.addEventListener('click', switchOrientation);

	top!.document.querySelector('#vtbot-ui-light-dark')!.addEventListener('click', () => {
		const rootStyle = top!.document.documentElement.style;
		top!.document.querySelector<HTMLIFrameElement>('#vtbot-main-frame')!.contentDocument!.documentElement.style.colorScheme = (rootStyle.colorScheme = rootStyle.colorScheme === 'dark' ? 'light' : 'dark');
		setBackgroundAccent();
	});
	top!.document.querySelector('#vtbot-ui-close')!.addEventListener('click', () => {
		top!.sessionStorage.setItem('vtbot-ui-closed', "true");
		//top!.sessionStorage.removeItem("vtbot-ui-reopener");
		top!.location.reload();
	});
	top!.document.querySelector('#vtbot-ui-modi ul')!.addEventListener('change', updateModus);

	initFilter();
	initNames();
	top!.document
		.querySelector('#vtbot-ui-styled')
		?.addEventListener('change', (e) =>
			addFrames((e.target as HTMLInputElement).checked)
		);

	initSlowMotion();
	initController();
	top!.document
		.querySelectorAll('#vtbot-ui-control-exit, #vtbot-ui-control-play')
		.forEach((e) => e.addEventListener('click', exitViewTransition));


	top!.addEventListener('keyup', function (e) {
		if (e.key === 'Escape') {
			if (top!.document.documentElement.classList.contains('vtbot-vt-active')) {
				exitViewTransition();
			} else {
				top!.sessionStorage.setItem('vtbot-ui-closed', 'true');
				top!.location.reload();
			}
		}
	});
}



let firstModusInteraction = true;

function updateModus() {
	const root = top!.document.documentElement;
	const checked = top!.document.querySelector<HTMLInputElement>('#vtbot-ui-modi ul input:checked');
	if (checked) {
		const modus = checked.id.replace('vtbot-m-', '') as Modus;
		if (modus !== root.dataset.vtbotModus) {
			mayViewTransition(() => {
				root.dataset.vtbotModus = modus;
				exitViewTransition();
				if (modus !== 'compare')
					top!.document.querySelector<HTMLInputElement>('#vtbot-ui-filter ul input')!.click();
				if (modus === 'slow-motion') {
					attachFrameToggle('#vtbot-ui-slow-motion');
				}
				if (modus === 'control') {
					attachFrameToggle('#vtbot-ui-control');
				}
				top!.document.querySelector<HTMLInputElement>('#vtbot-ui-messages')!.innerHTML =
					message[modus];

				if (firstModusInteraction) {
					firstModusInteraction = false;
					top!.document
						.querySelector('#vtbot-ui-panel')
						?.insertAdjacentElement(
							'afterbegin',
							top!.document.querySelector<HTMLInputElement>('#vtbot-ui-modi')!
						);
				}
			}, 'update-modus');
		}
	}
}

function attachFrameToggle(divId: string) {
	const styled = top!.document.querySelector('#vtbot-ui-styled')?.parentElement;
	const div = top!.document.querySelector(divId);
	if (styled && div && styled.parentElement !== div)
		div.insertAdjacentElement('beforeend', styled);
}