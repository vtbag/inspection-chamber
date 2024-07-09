import { viewTransitionNameOfAnimation } from './panel/full-control';
import { updateNames } from './panel/names';
import { setStyles } from './styles';
import { initTwin } from './twin';

export function forceAnimations() {
	setStyles(
		`
		@keyframes vtbag-twin-noop {
			from { opacity: inherit; } to { opacity: inherit; }
		}
		::view-transition-image-pair(*) {
			animation: vtbag-twin-noop forwards;
			animation-duration: inherit;
		}`,
		'catch',
		undefined,
		true
	);
}

export async function retrieveViewTransitionAnimations() {
	const inspectionChamber = top!.__vtbag.inspectionChamber!;
	const frameDoc = inspectionChamber.frameDocument!;
	const animations: Animation[] = (inspectionChamber.animations = []);
	const animationMap = (inspectionChamber.animationMap = new Map<string, Animation>());
	const names = new Set<string>();

	const set = new WeakSet();
	let growing = true;
	while (growing) {
		growing = false;
		frameDoc.getAnimations().forEach((a) => {
			const animation = a as CSSAnimation;
			if (
				!set.has(animation) &&
				animation.effect?.pseudoElement?.startsWith('::view-transition') &&
				animation.playState !== 'finished'
			) {
				if (animation.animationName !== 'vtbag-twin-noop') {
					names.add(viewTransitionNameOfAnimation(animation)!);
					animations.push(animation);
					animationMap.set(animation.animationName, animation);
					animation.pause();
					animation.currentTime = 0;
				}
				growing = true;
			}
			set.add(animation);
		});
		growing && (await new Promise((r) => setTimeout(r)));
	}

	const endTime = (animation: Animation) =>
		(animation.effect?.getComputedTiming().endTime?.valueOf() as number) ?? 0;

	inspectionChamber.longestAnimation = animations.reduce(
		(acc, anim) => (endTime(anim) > endTime(acc) ? anim : acc),
		animations[0]
	);

	inspectionChamber.animationEndTime = ~~endTime(inspectionChamber.longestAnimation);

	const oldNames = new Set<string>();
	const newNames = new Set<string>();

	initTwin(
		frameDoc,
		frameDoc,
		names,
		oldNames,
		newNames
	);

	updateNames(oldNames, newNames);
	top!.document.querySelector<HTMLCanvasElement>('#canvas')!.style.zIndex = '';
}

export function unleashAllAnimations() {
	const chamber = top!.__vtbag.inspectionChamber!;
	chamber!.frameDocument!.querySelector('#vtbag-adopted-sheet')?.remove();
	chamber.animations?.forEach((a) => {
		try {
			a.finish();
		} catch (e) {
			console.error(e, a, a.effect?.getComputedTiming());
		}
	});
}
