
import { updateNameVisibility } from './names';
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
	updateNameVisibility();
	control();
}

let lastSum = 0;
let lastChanged = 0;

export function controllerChanged() {
	const res = lastChanged !== lastSum;
	lastChanged = lastSum;
	return res;
}
function control() {
	const inspectionChamber = top!.__vtbag.inspectionChamber!;
	const animations = inspectionChamber.animations;
	if (animations) {
		const selectedTime = parseInt(
			top!.document.querySelector<HTMLSpanElement>('#vtbag-ui-progress')!.innerText
		);
		const otherTime = parseInt(
			top!.document.querySelector<HTMLSpanElement>('#vtbag-ui-progress2')!.innerText
		);
		lastSum = selectedTime + otherTime;

		const selectedElements = new Set<string>();
		top!.document
			.querySelectorAll<HTMLLIElement>('#vtbag-ui-names li.selected')
			.forEach((li) => selectedElements.add(li.innerText));
		animations.forEach((animation) => {
			const name = viewTransitionNameOfAnimation(animation);
			animation.currentTime = name && selectedElements.has(name) ? selectedTime : otherTime;
		});
	}
	if (inspectionChamber.updateNameVisibilityTimeout) {
		top!.clearTimeout(inspectionChamber.updateNameVisibilityTimeout);
		inspectionChamber.updateNameVisibilityTimeout = undefined;
		if (vtActive()) {
			inspectionChamber.updateNameVisibilityTimeout = top!.setTimeout(updateNameVisibility, 500);
		}
	}
}

export function viewTransitionNameOfAnimation(animation: Animation) {
	return animation.effect?.pseudoElement?.replace(
		/::view-transition-(new|old|group|image-pair)\((.*)\)/,
		'$2'
	);
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
	if (
		vtActive() && top!.document.documentElement.dataset.vtbagModus === 'control'
	) {
		control();
	}
}
