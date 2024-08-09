import { vtActive } from './transition';

export function setupSlowMotionPlay() {
	updateProgress();
	sloMoPlay();
}

function sloMoPlay() {
	const rate =
		1.0 /
		Math.max(
			0.000001,
			parseFloat(top!.document.querySelector<HTMLSpanElement>('#vtbag-ui-tsf')?.innerText ?? '1.0')
		);
	top!.__vtbag.inspectionChamber!.animations?.forEach((animation) => {
		animation.playbackRate = rate;
		animation.playState === 'paused' && animation.play();
	});
}

export function initSlowMotion() {
	const sloMo = top!.document.querySelector('#vtbag-ui-slo-mo')!;
	const sloMoTsf = top!.document.querySelector<HTMLInputElement>('#vtbag-ui-tsf')!;
	sloMo.addEventListener('input', (e) => {
		if (e.target instanceof HTMLInputElement) {
			const value = (Math.exp(parseInt(e.target.value, 10) / 100) - 100) / 100 + 1 - 0.14;
			sloMoTsf.innerText = `${value.toFixed(1)}`;
			sloMoPlay();
		}
	});
}

function updateProgress() {
	const inspectionChamber = top!.__vtbag.inspectionChamber!;
	const longestAnimation = inspectionChamber.longestAnimation;
	if (longestAnimation) {
		top!.document.querySelector<HTMLSpanElement>('#vtbag-ui-slo-mo-progress')!.innerText =
			` ${~~(longestAnimation.currentTime ?? 0)} / ${inspectionChamber.animationEndTime} ms`;
		if (vtActive()) {
			top!.setTimeout(updateProgress, 20);
		}
	}
}
