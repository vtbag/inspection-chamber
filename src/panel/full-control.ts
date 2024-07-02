import { InspectionChamber } from "../types";



export function controlledPlay() {
  const animationEndTime = top!.__vtbag.inspectionChamber!.animationEndTime;
  top!.document.querySelector<HTMLSpanElement>('#vtbot-ui-controller-max')!.innerText =
    animationEndTime + ' ms';
  top!.document.querySelector<HTMLSpanElement>('#vtbot-ui-progress')!.innerText = '0';
  const controller = top!.document.querySelector<HTMLInputElement>('#vtbot-ui-controller')!;
  controller.max = '' + animationEndTime;
  controller.value = '0';
  controller.disabled = false;
  top!.document.querySelector<HTMLSpanElement>('#vtbot-ui-progress2')!.innerText = '0';
  const controller2 = top!.document.querySelector<HTMLInputElement>('#vtbot-ui-controller2')!;
  controller2.max = '' + animationEndTime;
  controller2.value = '0';
  controller2.disabled = false;
  control();
}

function control() {
  const animations = top!.__vtbag.inspectionChamber!.animations;
  if (animations) {
    const selectedTime = parseInt(
      top!.document.querySelector<HTMLSpanElement>('#vtbot-ui-progress')!.innerText
    );
    const otherTime = parseInt(
      top!.document.querySelector<HTMLSpanElement>('#vtbot-ui-progress2')!.innerText
    );
    const selectedElements = new Set<string>();
    top!.document
      .querySelectorAll<HTMLLIElement>('#vtbot-ui-names li.selected')
      .forEach((li) => selectedElements.add(li.innerText));
    animations.forEach((animation) => {
      const name = viewTransitionNameOfAnimation(animation);
      animation.currentTime = (name && selectedElements.has(name)) ? selectedTime : otherTime;
    });
  }
}

export function viewTransitionNameOfAnimation(animation: Animation) {
  return animation.effect?.pseudoElement?.replace(
    /::view-transition-(new|old|group|image-pair)\((.*)\)/,
    '$2'
  );
}

export function initController() {
  const controller = top!.document.querySelector<HTMLInputElement>('#vtbot-ui-controller')!;
  const progress = top!.document.querySelector<HTMLInputElement>('#vtbot-ui-progress')!;
  controller.addEventListener('input', (e) => {
    if (e.target instanceof HTMLInputElement) {
      progress.innerText = '' + ~~e.target.value;
      control();
    }
  });
  const controller2 = top!.document.querySelector<HTMLInputElement>('#vtbot-ui-controller2')!;
  const progress2 = top!.document.querySelector<HTMLInputElement>('#vtbot-ui-progress2')!;
  controller2.addEventListener('input', (e) => {
    if (e.target instanceof HTMLInputElement) {
      progress2.innerText = '' + ~~e.target.value;
      control();
    }
  });
}

export function updateControl() {
	if (
		top!.document.documentElement.classList.contains('vtbot-vt-active') &&
		top!.document.documentElement.dataset.vtbotModus === 'control'
	) {
		control();
	}
}
