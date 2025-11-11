import { updateLiveValues } from '../animations';
import { getModus } from './modus';
import { showSomeAnimations, THROTTLING_DELAY, updateNameVisibility } from './names';
import { vtActive } from './transition';

export function controlledPlay() {
	const animationEndTime = top!.__vtbag.inspectionChamber!.animationEndTime;
	top!.document.querySelector<HTMLSpanElement>('#vtbag-ui-controller-max')!.innerText =
		animationEndTime + ' ms';
	top!.document.querySelector<HTMLSpanElement>('#vtbag-ui-progress')!.innerText = '0';
	const controller = top!.document.querySelector<HTMLInputElement>('#vtbag-ui-controller')!;
	controller.max = '' + animationEndTime;
	controller.value = '0';
	controller.disabled = false;
	top!.document.querySelector<HTMLSpanElement>('#vtbag-ui-progress2')!.innerText = '0';
	const controller2 = top!.document.querySelector<HTMLInputElement>('#vtbag-ui-controller2')!;
	controller2.max = '' + animationEndTime;
	controller2.value = '0';
	controller2.disabled = false;
	control();
	updateNameVisibility();
	//showSomeAnimations();
}

export function control() {
	const inspectionChamber = top!.__vtbag.inspectionChamber!;
	const animations = inspectionChamber.animations;
	if (inspectionChamber.updateNameVisibilityTimeout) {
		top!.clearTimeout(inspectionChamber.updateNameVisibilityTimeout);
		inspectionChamber.updateNameVisibilityTimeout = undefined;
	}
	inspectionChamber.updateNameVisibilityTimeout = top!.setTimeout(
		updateNameVisibility,
		THROTTLING_DELAY
	);

	if (animations) {
		const selectedTime = parseInt(
			top!.document.querySelector<HTMLSpanElement>('#vtbag-ui-progress')!.innerText,
			10
		);
		const otherTime = parseInt(
			top!.document.querySelector<HTMLSpanElement>('#vtbag-ui-progress2')!.innerText,
			10
		);

		const selectedElements = new Set<string>();
		top!.document
			.querySelectorAll<HTMLLIElement>('#vtbag-ui-names li.selected')
			.forEach((li) => selectedElements.add(li.innerText));
		animations.forEach((animation) => {
			if (animation.playState === 'paused') {
				const { viewTransitionName } = namesOfAnimation(animation);
				animation.currentTime =
					viewTransitionName && selectedElements.has(viewTransitionName) ? selectedTime : otherTime;
			}
		});
	}
	updateLiveValues();
}

export function namesOfAnimation(animation: Animation) {
	const names = animation.effect?.pseudoElement
		?.replace(/::view-transition-(group|image-pair|old|new|group-children)\((.*)\)/, '$1 $2')
		.split(' ');
	return { pseudoName: names?.[0], viewTransitionName: names?.[1] };
}

export function initController() {
	const controller = top!.document.querySelector<HTMLInputElement>('#vtbag-ui-controller')!;
	const progress = top!.document.querySelector<HTMLInputElement>('#vtbag-ui-progress')!;
	controller.addEventListener('input', (e) => {
		if (e.target instanceof HTMLInputElement) {
			progress.innerText = '' + ~~e.target.value;
			control();
		}
	});
	const controller2 = top!.document.querySelector<HTMLInputElement>('#vtbag-ui-controller2')!;
	const progress2 = top!.document.querySelector<HTMLInputElement>('#vtbag-ui-progress2')!;
	controller2.addEventListener('input', (e) => {
		if (e.target instanceof HTMLInputElement) {
			progress2.innerText = '' + ~~e.target.value;
			control();
		}
	});
}

export function updateControl() {
	if (vtActive() && getModus() === 'full-control') {
		control();
	}
}
