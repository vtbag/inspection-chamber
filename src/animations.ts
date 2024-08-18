import { control, namesOfAnimation } from './panel/full-control';
import { plugInPanel } from './panel/inner';
import { getModus } from './panel/modus';
import { updateNames } from './panel/names';
import { vtActive } from './panel/transition';
import { setStyles } from './styles';
import { initTwin } from './twin';

export function forceAnimations() {
	const frameBody = top!.__vtbag.inspectionChamber!.frameDocument!.body;
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
	const keyframesMap = (inspectionChamber.keyframesMap = new Map<string, Keyframe[]>());
	const names = new Set<string>();

	inspectionChamber.styleMap = new Map<string, CSSStyleDeclaration>();

	const set = new WeakSet();
	let growing = true;
	let rootRootAnimation = false;
	while (growing) {
		growing = false;
		frameDoc.getAnimations().forEach((animationObject) => {
			if (animationObject.effect?.pseudoElement?.startsWith('::view-transition')) {
				const { pseudoName, viewTransitionName } = namesOfAnimation(animationObject)!;
				if (!set.has(animationObject)) {
					const keyframeName =
						animationObject instanceof CSSAnimation ? animationObject.animationName : undefined;
					const transitionProperty =
						animationObject instanceof CSSTransition
							? animationObject.transitionProperty
							: undefined;
					if (transitionProperty) {
						console.warn(
							'[inspection-chamber] Unhandled transition:',
							viewTransitionName,
							pseudoName,
							transitionProperty
						);
					} else if (keyframeName) {
						animationObject.pause();
						animationObject.currentTime = 0;
						viewTransitionName && pseudoName === 'image-pair' && names.add(viewTransitionName);
						!viewTransitionName && pseudoName === '::view-transition' && (rootRootAnimation = true);
						if (keyframeName === 'vtbag-twin-noop') {
							animationObject.cancel();
						} else {
							animations.push(animationObject);
							keyframesMap.set(keyframeName, animationObject.effect?.getKeyframes()!);
						}
					} else {
						console.warn(
							'[inspection-chamber] Unhandled animation:',
							viewTransitionName,
							pseudoName,
							animationObject.constructor.name
						);
					}
					growing = true;
				}
				set.add(animationObject);
			}
		});
		growing && (await new Promise((r) => frameDoc.defaultView!.setTimeout(r)));
		rootRootAnimation && console.warn('[inspection-chamber] Root root animation detected');
	}

	const endTime = (animation: Animation) =>
		(animation.effect?.getComputedTiming().endTime?.valueOf() as number) ?? 0;

	inspectionChamber.longestAnimation = animations.reduce((acc, anim) =>
		endTime(anim) > endTime(acc) ? anim : acc
	);
	inspectionChamber.animationEndTime = ~~endTime(inspectionChamber.longestAnimation);

	const oldNames = new Set<string>();
	const newNames = new Set<string>();

	initTwin(frameDoc, frameDoc, names, oldNames, newNames);

	updateNames(oldNames, newNames);
}

export function unleashAllAnimations() {
	const chamber = top!.__vtbag.inspectionChamber!;
	const frameDocument = chamber!.frameDocument!;
	frameDocument.querySelector('#vtbag-adopted-sheet')?.remove();
	chamber.animations?.forEach((a) => {
		try {
			a.finish();
		} catch (e) {
			console.error(e, a, a.effect?.getComputedTiming());
		}
	});
}

export function listAnimations(name: string) {
	const row = (field: string, value: string) =>
		value
			? `<tr><td style="text-align:right">${field}</td><td><tt><b>${value}</b></tt></td><tr>`
			: '';
	const meta = ['offset', 'computedOffset', 'easing', 'composite'];
	const inspectionChamber = top!.__vtbag.inspectionChamber!;
	const styleMap = inspectionChamber.styleMap!;

	const anim = top!.document.querySelector<HTMLDivElement>('#vtbag-ui-animations')!;
	anim.innerHTML = !vtActive()
		? ''
		: `<h4 data-vtbag-name=${name}>Animations of ${name}:</h4>` +
			animationPanel('group') +
			animationPanel('image-pair') +
			animationPanel('old') +
			animationPanel('new');

	anim.querySelectorAll<HTMLInputElement>('input[type="checkbox"]').forEach((box) => {
		const context = JSON.parse(box.dataset.vtbagContext!);
		box.removeAttribute('data-vtbag-context');
		box.checked = selectAnimation(name, context.pseudo, context.idx)?.playState === 'paused';
		box.addEventListener('change', (e) => {
			if (!stopAndGo(name, context.pseudo, context.idx, box.checked)) {
				box.checked = !box.checked;
			}
		});
	});
	plugInPanel(anim);

	function animationPanel(pseudo: string) {
		const res: string[] = [];
		const style = styleMap.get(`${pseudo}-${name}`) as CSSStyleDeclaration;
		const cssAnimation = style?.animation;
		const animationName = style?.animationName;
		if (animationName && animationName !== 'vtbag-twin-noop' && animationName !== 'none') {
			const animationNames = animationName.split(', ');
			let skipped = 0;
			cssAnimation.split(/,(?![^(]*\))/).forEach((animation, idx) => {
				if (inspectionChamber.keyframesMap?.get(animationNames[idx])) {
					res.push(
						`<details><summary><input type="checkbox" data-vtbag-context='{"pseudo":"${pseudo}","idx":${idx - skipped}}'/> ${pseudo}: <tt>${animationNames[idx]}</tt></summary>${details(animationNames[idx], animation.endsWith(animationName) ? animation.slice(0, -animationName.length) : animation)}</details>`
					);
				} else {
					res.push(
						`<span style="padding-right: 0.25ex; width: 4.75ex; display: inline-block; text-align:right">🔴</span> ${pseudo}: <tt>${animationNames[idx]}</tt><br>`
					);
					++skipped;
					console.error(`[inspection chamber] did not find keyframes named "${animationNames[idx]}" for ::view-transition-${pseudo}(${name})`)
				}
			});
		}
		return res.length > 0 ? res.join('') + '<hr>' : '';

		function details(keyframeName: string, animation: string) {
			return `
<table>
	${row('animation:', animation)}
	${row('animates:', keyframeProperties(keyframeName))}
	${keyframes(keyframeName)}
</table>`;
		}
	}

	function keyframeProperties(name: string) {
		const keys = new Set<string>();
		inspectionChamber.keyframesMap
			?.get(name)
			?.forEach((k) => Object.keys(k).forEach((key) => keys.add(key)));
		return [...keys]
			.filter((k) => !meta.includes(k))
			.sort()
			.join(', ');
	}

	function keyframes(name: string) {
		return inspectionChamber.keyframesMap
			?.get(name)
			?.map((key) =>
				row(
					+(key.computedOffset ?? 0) * 100 + '% :',
					Object.keys(key)
						.sort()
						.filter((k) => !meta.includes(k))
						.map((k) => key[k])
						.join(', ')
				)
			)
			.join('');
	}
}

export function resetAnimationVisibility() {
	top!.__vtbag.inspectionChamber!.animations?.forEach((anim) => {
		if (
			anim instanceof CSSAnimation &&
			anim.animationName !== 'vtbag-twin-noop' &&
			anim.playState === 'idle'
		) {
			anim.pause();
		}
	});
	listAnimations(
		top!.document.querySelector<HTMLHeadingElement>('#vtbag-ui-animations h4')!.dataset.vtbagName!
	);
	control();
}

function stopAndGo(name: string, pseudo: any, idx: any, checked: boolean) {
	const anim = selectAnimation(name, pseudo, idx);
	if (!anim) return false;
	if (checked) {
		anim.pause();
		getModus() === 'full-control' && control();
	} else {
		anim.cancel();
	}
	return true;
}

export function selectAnimation(name: string, pseudo: string, idx: number) {
	const chamber = top!.__vtbag.inspectionChamber!;
	const styleMap = chamber.styleMap!;
	const animationName = styleMap.get(`${pseudo}-${name}`)!.animationName.split(', ')[idx];
	const animations = chamber.animations!;
	const pseudoElement = `::view-transition-${pseudo}(${name})`;
	const selected = animations.filter((anim) => anim.effect?.pseudoElement === pseudoElement);
	if (idx >= selected.length) {
		console.error(
			`[injection chamber] found ${selected.length} animations for ${pseudoElement} when looking for animation with index ${idx} called ${name}`
		);
		return;
	}
	const result = selected[idx];
	if (result instanceof CSSAnimation && result.animationName !== animationName) {
		console.error(
			`[injection chamber] found an animation called ${result.animationName} for ${pseudoElement} when looking for animation at index ${idx} with expected name ${name}`
		);
		return;
	}
	return result;
}
