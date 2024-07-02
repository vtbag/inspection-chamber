import { viewTransitionNameOfAnimation } from "./panel/full-control";
import { updateNames, updateNameVisibility } from "./panel/names";
import { setStyles } from "./styles";
import { initTwin, twin } from "./twin";

export function forceAnimations(doc: Document) {
	setStyles(`
		@keyframes vtbot-twin-noop {
			from { opacity: inherit; } to { opacity: inherit; }
		}
		::view-transition-image-pair(*) {
			animation: vtbot-twin-noop forwards;
			animation-duration: inherit;
		}`, 'catch', true);
}



export async function retrieveViewTransitionAnimations(doc: Document) {
	const inspectionChamber = top!.__vtbag.inspectionChamber!;
	const animations: Animation[] = inspectionChamber.animations = [];
	const animationMap = inspectionChamber.animationMap = new Map();
	const names = new Set<string>();

	const set = new WeakSet();
	let growing = true;
	while (growing) {
		growing = false;
		doc.getAnimations().forEach((a) => {
			if (
				!set.has(a) &&
				a.effect?.pseudoElement?.startsWith('::view-transition') &&
				a.playState !== 'finished'
			) {
				animationMap?.set((a as CSSAnimation).animationName, a);
				names.add(viewTransitionNameOfAnimation(a)!);
				if ((a as CSSAnimation).animationName !== 'vtbot-twin-noop') {
					animations!.push(a);
					a.pause();
					a.currentTime = 0;
				}
				growing = true;
			}
			set.add(a);
		});
		growing && (await new Promise((r) => setTimeout(r)));
	}
	inspectionChamber.longestAnimation = animations.reduce((acc, anim) => {
		const animValue = anim?.effect?.getComputedTiming().endTime?.valueOf();
		const accValue = acc?.effect?.getComputedTiming().endTime?.valueOf();
		return animValue && accValue && animValue > accValue ? anim : acc;
	}, animations[0]);
	inspectionChamber.animationEndTime = ~~(inspectionChamber.longestAnimation?.effect?.getComputedTiming().endTime?.valueOf() as number ?? 0);

	const oldNames = new Set<string>();
	const newNames = new Set<string>();

	initTwin(doc, names, animationMap, inspectionChamber.animationEndTime, oldNames, newNames);
	updateNames(oldNames, newNames);
	updateNameVisibility();
	top!.document.querySelector<HTMLCanvasElement>("#canvas")!.style.zIndex = "";

	growing = true;
	while (growing) {
		growing = false;
		doc.getAnimations().forEach(async (a) => {
			const target = a.effect?.target;
			if (
				!set.has(a) &&
				target!.id.startsWith('vtbot-twin--view-transition') &&
				a.playState !== 'finished'
			) {
				twin!.animations?.push(a);
				const animationName = (a as CSSAnimation).animationName;
				animationMap?.set(animationName, a);
				a.pause();
				a.currentTime = 0;
				growing = true;
			}
			set.add(a);
		});
		await new Promise((r) => setTimeout(r));
	}
}


export function unleashAllAnimations() {
	const chamber = top!.__vtbag.inspectionChamber!;
	chamber!.frameDocument!
		.querySelectorAll('#vtbot-adopted-sheet, #vtbot-twin--view-transition')
		.forEach((e) => e.remove());
	chamber.animations?.forEach((a) => {
		try {
			a.finish();
		} catch (e) {
			console.error(e, a, a.effect?.getComputedTiming());
		}
	});
}


