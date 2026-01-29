import type { Features } from '@/components/ic/features';
import { message } from '@/components/ic/message';

const ACTIVE_VT_SYM = Symbol.for('__vtbag_activeViewTransition');


export function setupHooks(chamberWindow: Window) {
	console.log('[inspection chamber] setupHooks');
	self.__vtbag ??= {};
	self.__vtbag.ic2 ??= {
		chamberWindow,
		pageswap,
		pagereveal,
		monkey,
		animationStart,
		animationStop,
		vtMap: new Map(),
		crossDocumentBackNavigation: false,
	};
}

function pageswap(event: PageSwapEvent) {
	const target = event.target!;
	let doc: Document;
	if (target.constructor.name === 'Window') {
		doc = (target as Window).document;
	} else if (target.constructor.name === 'HTMLDocument') {
		doc = target as Document;
	} else {
		console.error('[inspection chamber] pagereveal: unknown target', target);
		return;
	}
	console.log(
		'[inspection chamber] pageswap',
		event.viewTransition,
		doc.defaultView?.location.href
	);
	const transition = event.viewTransition;
	if (!transition) return;
	if (parent.__vtbag.ic2!.crossDocumentBackNavigation) {
		event.stopImmediatePropagation();
		return;
	}
	const root = doc.documentElement;

	if (!('activeViewTransition' in doc)) doc.activeViewTransition = transition;
	const features = crossDocumentFeatures();
	transition.ready.catch((e) => {
		features.readyErrorOccurred = true;
		readyError(root, transition, features, e);
	});
	requestAnimationFrame(() => {
		beforeCaptureOld(root, transition!, features);
		parent.__vtbag.ic2!.captureOldOnly ||
			setTimeout(() => afterCaptureOld(root, transition!, features));
	});
}

async function pagereveal(event: PageRevealEvent) {
	const target = event.target!;
	let doc: Document;
	if (target.constructor.name === 'Window') {
		doc = (target as Window).document;
	} else if (target.constructor.name === 'HTMLDocument') {
		doc = target as Document;
	} else {
		console.error('[inspection chamber] pagereveal: unknown target', target);
		return;
	}
	console.log(
		'[inspection chamber] pagereveal',
		event.viewTransition,
		doc.defaultView?.location.href
	);
	const transition = event.viewTransition;
	if (!transition) return;
	const root = doc.documentElement;
	const features = crossDocumentFeatures();

	transition.ready.catch((e) => {
		features.readyErrorOccurred = true;
		readyError(root, transition, features, e);
	});

	if (parent.__vtbag.ic2!.crossDocumentBackNavigation) {
		transition.ready.finally(() => advance(root));

		parent.__vtbag.ic2!.crossDocumentBackNavigation = false;
		event.stopImmediatePropagation();
		afterCaptureOld(root, transition!, features);
		return;
	}

	if (parent.__vtbag.ic2!.captureOldOnly) {
		(event.target as Window).document.documentElement.style.opacity = '0';
		parent.__vtbag.ic2!.crossDocumentBackNavigation = true;
		event.stopImmediatePropagation();
		history.back();
		return;
	}

	if (!('activeViewTransition' in doc)) doc.activeViewTransition = transition;
	transition.ready.finally(() => {
		afterCaptureNew(root, transition, features);
		if (parent.__vtbag.ic2!.chamberWindow?.sessionStorage.getItem('ic-analyzer-mode') === 'capture')
			advance(root);
	});
	transition.finished.finally(() => animationsWillFinish(root, transition, features));
	await Promise.resolve(true);
	beforeCaptureNew(root, transition, features);
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
		const { width, height } = transitionRoot.getBoundingClientRect();
		features.initialHeight = height;
		features.initialWidth = width;

		const captureOldOnly = parent.__vtbag.ic2!.captureOldOnly;
		let readyErrorOccurred = false;

		let transition: ViewTransition;
		if (!original) {
			throw new Error('startViewTransition is not defined');
		}

		if (!arg) {
			arg = async () => {
				afterCaptureOld(transitionRoot, transition, features);
				captureOldOnly ||
					readyErrorOccurred ||
					beforeCaptureNew(transitionRoot, transition, features);
			};
		} else if (typeof arg === 'function') {
			const originalArg = arg;
			arg = async () => {
				afterCaptureOld(transitionRoot, transition, features);
				captureOldOnly || (await (originalArg as Function)());
				captureOldOnly ||
					readyErrorOccurred ||
					beforeCaptureNew(transitionRoot, transition, features);
			};
		} else if ((arg as StartViewTransitionOptions).update) {
			const originalUpdate = (arg as StartViewTransitionOptions).update;
			arg.update = async () => {
				afterCaptureOld(transitionRoot, transition, features);
				captureOldOnly || (await originalUpdate!());
				captureOldOnly ||
					readyErrorOccurred ||
					beforeCaptureNew(transitionRoot, transition, features);
			};
		} else {
			(arg as StartViewTransitionOptions).update = () => {
				afterCaptureOld(transitionRoot, transition, features);
				captureOldOnly ||
					readyErrorOccurred ||
					beforeCaptureNew(transitionRoot, transition, features);
			};
		}
		transition = original.apply(this, [arg]);

		transition.updateCallbackDone.catch((e) =>
			updateError(transitionRoot, transition, features, e)
		);
		transition.ready.catch((e) => {
			readyErrorOccurred = true;
			readyError(transitionRoot, transition, features, e);
		});
		captureOldOnly ||
			transition.ready.then(() => afterCaptureNew(transitionRoot, transition, features));

		if (
			parent.__vtbag.ic2!.chamberWindow?.document?.querySelector<HTMLInputElement>('#capture')
				?.checked
		)
			transition = deactivate(transition, transitionRoot, this.ownerDocument ?? this);

		if (this.ownerDocument) {
			if (!('activeViewTransition' in this) || captureOldOnly) {
				safeSetActiveViewTransition(this, transition);
			}
		} else if (!('activeViewTransition' in transitionRoot.ownerDocument) || captureOldOnly) {
			safeSetActiveViewTransition(transitionRoot.ownerDocument, transition);
		}
		requestAnimationFrame(() => beforeCaptureOld(transitionRoot, transition, features));
		transition.finished.finally(() => {
			animationsWillFinish(transitionRoot, transition, features);
		});
		return transition;
	} as T;
}

function deactivate(transition: ViewTransition, transitionRoot: HTMLElement, document: Document) {
	{
		(transitionRoot as any).vtbagFlushUpdates?.();
		const freeze = parent.__vtbag.ic2!.captureFreezeTypes;

		transition.ready.then(() => {
			document.getAnimations().forEach((animation) => {
				if (animation.effect?.target === transitionRoot) {
					if (freeze) {
						animation.pause();
					}
					animation.currentTime = animation.effect.getComputedTiming().endTime!;
				}
			});
		});

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
	features.initialHeight = innerHeight;
	features.initialWidth = innerWidth;
	return features;
}

function advance(root: HTMLElement) {
	let paused = false;
	root.ownerDocument.getAnimations().forEach((animation) => {
		if (animation.effect?.target === root) {
			if (parent.__vtbag.ic2!.captureFreezeTypes) {
				animation.pause();
				paused = true;
			}
			animation.currentTime = animation.effect.getComputedTiming().endTime!;
		}
	});
	paused &&
		message(
			'info',
			"View transition types are frozen during inspection. Don't forget to resume them when done."
		);
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
	console.log('[inspection chamber] beforeCaptureOld');
	features.oldTypes = new Set(viewTransition.types);
	self.__vtbag.ic2!.chamberWindow!.dispatchEvent(
		new CustomEvent('ic-before-capture-old', {
			detail: { root, viewTransition, features },
		})
	);
}

function afterCaptureOld(root: HTMLElement, viewTransition: ViewTransition, features: Features) {
	console.log('[inspection chamber] afterCaptureOld');
	self.__vtbag.ic2!.chamberWindow!.dispatchEvent(
		new CustomEvent('ic-after-capture-old', {
			detail: { root, viewTransition, features },
		})
	);
}

function beforeCaptureNew(root: HTMLElement, viewTransition: ViewTransition, features: Features) {
	console.log('[inspection chamber] beforeCaptureNew');
	features.newTypes = new Set(viewTransition.types);
	self.__vtbag.ic2!.chamberWindow!.dispatchEvent(
		new CustomEvent('ic-before-capture-new', {
			detail: { root, viewTransition, features },
		})
	);
}

function afterCaptureNew(root: HTMLElement, viewTransition: ViewTransition, features: Features) {
	console.log('[inspection chamber] afterCaptureNew');
	self.__vtbag.ic2!.chamberWindow!.dispatchEvent(
		new CustomEvent('ic-after-capture-new', {
			detail: { root, viewTransition, features },
		})
	);
}
function updateError(
	root: HTMLElement,
	viewTransition: ViewTransition,
	features: Features,
	error: any
) {
	console.log('[inspection chamber] updateError');
	self.__vtbag.ic2!.chamberWindow!.dispatchEvent(
		new CustomEvent('ic-update-error', {
			detail: { root, viewTransition, features, error },
		})
	);
}
function readyError(
	root: HTMLElement,
	viewTransition: ViewTransition,
	features: Features,
	error: any
) {
	console.log('[inspection chamber] readyError');
	self.__vtbag.ic2!.chamberWindow!.dispatchEvent(
		new CustomEvent('ic-ready-error', {
			detail: { root, viewTransition, features, error },
		})
	);
}

function animationsWillFinish(
	root: HTMLElement,
	viewTransition: ViewTransition,
	features: Features
) {
	console.log('[inspection chamber] animationsWillFinish');
	self.__vtbag.ic2!.chamberWindow!.dispatchEvent(
		new CustomEvent('ic-about-to-finish', {
			detail: { root, viewTransition, features },
		})
	);
}

function safeSetActiveViewTransition(target: any, transition: ViewTransition) {
	'activeViewTransition' in target && Object.defineProperty(target, 'activeViewTransition', {
		configurable: true,
		enumerable: false,
		get() {
			return (this as any)[ACTIVE_VT_SYM];
		},
		set(v: any) {
			(this as any)[ACTIVE_VT_SYM] = v;
		},
	});

	target.activeViewTransition = transition;
}
