import type { Features } from '@/components/ic/features';
import { voidElementNames } from 'astro/runtime/server/index.js';

export function setupHooks(chamberWindow: Window) {
	console.log('setupHooks');
	self.__vtbag ??= {};
	self.__vtbag.ic2 ??= {
		captureFrozen: [],
		chamberWindow,
		pageswap,
		pagereveal,
		monkey,
		animationStart,
		animationStop,
		vtMap: new Map(),
		specialBackNavigation: false,
	};
}

function pageswap(event: PageSwapEvent) {

	console.log('pageswap hook');
	if (parent.__vtbag.ic2!.specialBackNavigation) {
		console.log('Skipping pageswap for special back navigation');
		event.stopImmediatePropagation();
		return;
	}
	const transition = event.viewTransition;
	const doc = (event.target as Window).document;
	const root = doc.documentElement;
	if (transition) {
		if (!('activeViewTransition' in doc)) doc.activeViewTransition = transition;
		requestAnimationFrame(() => {
			const features = crossDocumentFeatures();
			beforeCaptureOld(root, transition!, features);
			parent.__vtbag.ic2!.captureOldOnly || setTimeout(() => afterCaptureOld(root, transition!, features));
		});
	}
}

async function pagereveal(event: PageRevealEvent) {
	console.log('pagereveal hook');
	const transition = event.viewTransition;
	const doc = (event.target as Window).document;
	const root = doc.documentElement;
	const features = crossDocumentFeatures();

	if (parent.__vtbag.ic2!.specialBackNavigation) {
		console.log('Terminating special back navigation');
		event.viewTransition?.skipTransition();
		parent.__vtbag.ic2!.specialBackNavigation = false;
		event.stopImmediatePropagation();
		afterCaptureOld(root, transition!, features);

		return;
	}
	if (transition) {
		if (parent.__vtbag.ic2!.captureOldOnly) {
			console.log('Capturing old only - going back in history');
			(event.target as Window).document.documentElement.style.opacity = '0';
			history.back();
			parent.__vtbag.ic2!.specialBackNavigation = true;
			event.stopImmediatePropagation();
			return;
		};

		if (!('activeViewTransition' in doc)) doc.activeViewTransition = transition;
		transition.ready.finally(() => afterCaptureNew(root, transition, features));
		transition.finished.finally(() => animationsWillFinish(root, transition, features));
		await Promise.resolve(true);
		beforeCaptureNew(root, transition, features);
	}
}

function monkey<
	T extends typeof Element.prototype.startViewTransition | typeof document.startViewTransition,
>(original: T): T {
	return function (
		this: HTMLElement | Document,
		arg?: ViewTransitionUpdateCallback | StartViewTransitionOptions
	): ViewTransition {
		const traces = new Error().stack?.split('\n');
		const trace =
			traces?.slice(traces[2].includes('mayStartViewTransition') ? 3 : 2).join('\n') ?? '';
		const time = Date.now();
		const transitionRoot = this.ownerDocument ? this : this.documentElement;
		let features = parent.__vtbag.ic2!.vtMap!.get(transitionRoot)!;

		if (!features) {
			parent.__vtbag.ic2!.vtMap!.set(transitionRoot, (features = {}));
		}
		features.trace = trace;
		features.time = time;
		features.scoped = this === transitionRoot;

		const captureOldOnly = parent.__vtbag.ic2!.captureOldOnly;

		let transition: ViewTransition;
		if (!original) {
			throw new Error('startViewTransition is not defined on this chamberWindow');
		}

		if (!arg) {
			arg = async () => {
				afterCaptureOld(transitionRoot, transition, features);
				captureOldOnly || beforeCaptureNew(transitionRoot, transition, features);
			};
		} else if (typeof arg === 'function') {
			const originalArg = arg;
			arg = async () => {
				afterCaptureOld(transitionRoot, transition, features);
				captureOldOnly || (await (originalArg as Function)());
				captureOldOnly || beforeCaptureNew(transitionRoot, transition, features);
			};
		} else if ((arg as StartViewTransitionOptions).update) {
			const originalUpdate = (arg as StartViewTransitionOptions).update;
			arg.update = async () => {
				afterCaptureOld(transitionRoot, transition, features);
				captureOldOnly || (await originalUpdate!());
				captureOldOnly || beforeCaptureNew(transitionRoot, transition, features);
			};
		} else {
			(arg as StartViewTransitionOptions).update = () => {
				afterCaptureOld(transitionRoot, transition, features);
				captureOldOnly || beforeCaptureNew(transitionRoot, transition, features);
			};
		}
		transition = original.apply(this, [arg]);
		if (parent.__vtbag.ic2!.chamberWindow?.sessionStorage.getItem('ic-analyzer-mode') === 'capture')
			transition = deactivate(transition, transitionRoot, this.ownerDocument ?? this, features);

		if (this.ownerDocument) {
			if (!('activeViewTransition' in this) || captureOldOnly) {
				this.activeViewTransition = transition;
			}
		} else if (!('activeViewTransition' in transitionRoot.ownerDocument || captureOldOnly)) {
			transitionRoot.ownerDocument.activeViewTransition = transition;
		}
		requestAnimationFrame(() => beforeCaptureOld(transitionRoot, transition, features));
		transition.ready.finally(() => afterCaptureNew(transitionRoot, transition, features));
		transition.finished.finally(() => {
			animationsWillFinish(transitionRoot, transition, features);
		});
		return transition;
	} as T;
}

function deactivate(transition: ViewTransition, transitionRoot: HTMLElement, document: Document, features: Features) {
	{
		transition.ready.then(() => {
			const freeze = parent.__vtbag.ic2!.captureFreezeTypes;
			if (freeze) parent.__vtbag.ic2!.captureFrozen.push(transition);
			document.getAnimations().forEach((animation) => {
				if (animation.effect?.target === transitionRoot) {
					if (freeze) {
						animation.pause();
						animation.currentTime = animation.effect.getComputedTiming().endTime!;
					}
				} else {
					animation.finish();
				}
			});
			afterCaptureNew(transitionRoot, transition, features);
		});
		document.activeViewTransition &&
			parent.__vtbag.ic2?.captureFreezeTypes &&
			transition.finished.finally(() => parent.location.reload());

		return new Proxy(transition, {
			get(_, prop) {
				if (prop === 'ready' || prop === 'finished' || prop === 'updateCallbackFinished') {
					return new Promise<void>(() => { });
				}
				if (prop === 'waitUntil') {
					return (_: Promise<unknown>) => { };
				}
				return Reflect.get(transition, prop);
			},
		});
	}

}

function crossDocumentFeatures() {
	let features = parent.__vtbag.ic2!.vtMap!.get(undefined!);
	if (!features) {
		features = {};
		parent.__vtbag.ic2!.vtMap!.set(undefined!, features);
	}
	features.crossDocument = true;
	features.time = Date.now();
	features.trace = undefined;
	features.scoped = false;
	return features;
}

function animationStart(event: AnimationEvent) {
	self.__vtbag.ic2!.chamberWindow!.dispatchEvent(
		new CustomEvent('ic-animation-start', {
			detail: { root: event.target, event },
		})
	);
}
function animationStop(event: AnimationEvent) {
	self.__vtbag.ic2!.chamberWindow!.dispatchEvent(
		new CustomEvent('ic-animation-stop', {
			detail: { root: event.target, event },
		})
	);
}

function beforeCaptureOld(root: HTMLElement, viewTransition: ViewTransition, features: Features) {
	console.log('beforeCaptureOld start');
	features.oldTypes = new Set(viewTransition.types);
	self.__vtbag.ic2!.chamberWindow!.dispatchEvent(
		new CustomEvent('ic-before-capture-old', {
			detail: { root, viewTransition, features },
		})
	);
	console.log('beforeCaptureOld complete');
}
function afterCaptureOld(root: HTMLElement, viewTransition: ViewTransition, features: Features) {
	console.log('afterCaptureOld start');
	self.__vtbag.ic2!.chamberWindow!.dispatchEvent(
		new CustomEvent('ic-after-capture-old', {
			detail: { root, viewTransition, features },
		})
	);
	console.log('afterCaptureOld complete');
}
function beforeCaptureNew(root: HTMLElement, viewTransition: ViewTransition, features: Features) {
	console.log('beforeCaptureNew start');
	features.newTypes = new Set(viewTransition.types);
	self.__vtbag.ic2!.chamberWindow!.dispatchEvent(
		new CustomEvent('ic-before-capture-new', {
			detail: { root, viewTransition, features },
		})
	);
	console.log('beforeCaptureNew complete');
}
function afterCaptureNew(root: HTMLElement, viewTransition: ViewTransition, features: Features) {
	console.log('afterCaptureNew start');
	self.__vtbag.ic2!.chamberWindow!.dispatchEvent(
		new CustomEvent('ic-after-capture-new', {
			detail: { root, viewTransition, features },
		})
	);
	console.log('afterCaptureNew complete');
}
function animationsWillFinish(root: HTMLElement, viewTransition: ViewTransition, features: Features) {
	console.log('animationsWillFinish');
	self.__vtbag.ic2!.chamberWindow!.dispatchEvent(
		new CustomEvent('ic-about-to-finish', {
			detail: { root, viewTransition, features },
		})
	);
	console.log('animationsWillFinish complete');
}
