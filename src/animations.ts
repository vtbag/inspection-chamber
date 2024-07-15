import { namesOfAnimation } from './panel/full-control';
import { updateNames } from './panel/names';
import { vtActive } from './panel/transition';
import { setStyles } from './styles';
import { initTwin } from './twin';

export function forceAnimations() {
	setStyles(
		`
		@keyframes vtbag-twin-noop {
			from { opacity: 1; } to { opacity: 1; }
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
	const keyframesMap = (inspectionChamber.keyframesMap = new Map<string, Keyframe[]>());
	const names = new Set<string>();

	inspectionChamber.styleMap = new Map<string, CSSStyleDeclaration>();

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
				const animationName = animation.animationName;
				if (animationName !== 'vtbag-twin-noop' && animationName !== 'none') {
					const { viewTransitionName } = namesOfAnimation(animation)!;
					names.add(viewTransitionName);
					animations.push(animation);
					animationMap.set(animationName, animation);
					animation.pause();
					animation.currentTime = 0;
					keyframesMap!.set(animationName, animation.effect?.getKeyframes());
				}
				growing = true;
			}
			set.add(animation);
		});
		growing && (await new Promise((r) => frameDoc.defaultView!.setTimeout(r)));
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

	initTwin(frameDoc, frameDoc, names, oldNames, newNames);

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

export function listAnimations(name: string) {
	const anim = top!.document.querySelector('#vtbag-ui-animations')!;
	anim.innerHTML = !vtActive()
		? ''
		: `<h4>Animations of ${name}:</h4>` +
			animation('old') +
			animation('new') +
			animation('group') +
			animation('image-pair');

	function animation(pseudo: string) {
		const inspectionChamber = top!.__vtbag.inspectionChamber!;
		const style = inspectionChamber.styleMap?.get(`${pseudo}-${name}`);
		const animationName = style?.animationName;
		if (!style || !animationName || animationName === 'vtbag-twin-noop' || animationName === 'none')
			return '';
		const animationNames = animationName.split(', ');
		const delays = style.animationDelay.split(', ');
		const durations = style.animationDuration.split(', ');
		const directions = style.animationDirection.split(', ');
		const fillModes = style.animationFillMode.split(', ');
		const iterationCounts = style.animationIterationCount.split(', ');
		const timingFunctions = style.animationTimingFunction.replace(/\),/g, ')@').split('@ ');
		const timelines =
			'animationTimeline' in style && (style['animationTimeline'] as string).split(', ');

		const res: string[] = [];
		animationNames.forEach((animationName, idx) => {
			res.push(
				`<details><summary>${pseudo}: ${animationName}(${delays[idx]}, ${durations[idx]})</summary>${details(idx, animationName)}</details>`
			);
		});
		return res.join('') + '<hr>';

		function details(idx: number, animationName: string) {
			return `
<table>
<tr><td style="text-align:right">${'direction:'}</td><td>${directions[idx]}</td><tr>
<tr><td style="text-align:right">${'fill-mode:'}</td><td>${fillModes[idx]}</td><tr>
<tr><td style="text-align:right">${'iteration-count:'}</td><td>${iterationCounts[idx]}</td><tr>
<tr><td style="text-align:right">${'timing-function:'}</td><td>${timingFunctions[idx]}</td><tr>
${timelines && `<tr><td style="text-align:right">${'timeline:'}</td><td>${timelines[idx]}</td><tr>`}
<tr><td style="text-align:right">${'animates:'}</td><td>${keyframeProperties(animationName)}</td><tr>
</table>`;

			function keyframeProperties(name: string) {
				const keys = new Set<string>();
				inspectionChamber.keyframesMap
					?.get(name)
					?.forEach((k) => Object.keys(k).forEach((key) => keys.add(key)));
				const meta = ['offset', 'computedOffset', 'easing', 'composite'];
				return [...keys]
					.filter((k) => !meta.includes(k))
					.sort()
					.join(', ');
			}
		}
	}
}
