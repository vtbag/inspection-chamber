import type { Features } from "@/components/ic/features";

export function setupHooks(context: Window) {
	console.log('setupHooks');
	self.__vtbag ??= {};
	self.__vtbag.ic2 ??= {
		captureFrozen: [],
		context,
		pageswap,
		pagereveal,
		monkey,
		animationStart,
		animationStop,
		vtMap: new Map(),
	};
}

function pageswap(event: PageSwapEvent) {
	console.log('enter pageswap', event);
	const transition = event.viewTransition;

	const doc = (event.target as Window).document;
	const root = doc.documentElement;
	if (transition) {
		if (!('activeViewTransition' in doc)) doc.activeViewTransition = transition;
		requestAnimationFrame(() => {
			beforeCaptureOld(root, transition!, crossDocumentFeatures(root));
			setTimeout(() => afterCaptureOld(root, transition!));
		});
	}
}


async function pagereveal(event: PageRevealEvent) {
	console.log('enter pagereveal', event);
	const transition = event.viewTransition;
	const doc = (event.target as Window).document;
	const root = doc.documentElement;
	if (transition) {
		if (!('activeViewTransition' in doc)) doc.activeViewTransition = transition;
		transition.ready.finally(() => afterCaptureNew(root, transition));
		transition.finished.finally(() => animationsWillFinish(root, transition));
		await Promise.resolve(true);
		beforeCaptureNew(root, transition, crossDocumentFeatures(root));
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
		let features = parent.__vtbag.ic2!.vtMap!.get(this)!;

		if (!features) {
			parent.__vtbag.ic2!.vtMap!.set(this, (features = { trace, time }));
		} else {
			features.trace = trace;
			features.time = time;
		}
		const captureOldOnly = parent.__vtbag.ic2!.captureOldOnly;

		let transition: ViewTransition;
		if (!original) {
			throw new Error('startViewTransition is not defined on this context');
		}
		const transitionRoot =
			this.constructor.name === HTMLDocument.name
				? (this as Document).documentElement
				: (this as HTMLElement);
		if (!arg) {
			arg = async () => {
				afterCaptureOld(transitionRoot, transition);
				captureOldOnly || beforeCaptureNew(transitionRoot, transition, features);
			};
		} else if (typeof arg === 'function') {
			const originalArg = arg;
			arg = async () => {
				afterCaptureOld(transitionRoot, transition);
				captureOldOnly || (await (originalArg as Function)());
				captureOldOnly || beforeCaptureNew(transitionRoot, transition, features);
			};
		} else if ((arg as StartViewTransitionOptions).update) {
			const originalUpdate = (arg as StartViewTransitionOptions).update;
			arg.update = async () => {
				afterCaptureOld(transitionRoot, transition);
				captureOldOnly || (await originalUpdate!());
				captureOldOnly || beforeCaptureNew(transitionRoot, transition, features);
			};
		} else {
			(arg as StartViewTransitionOptions).update = () => {
				afterCaptureOld(transitionRoot, transition);
				captureOldOnly || beforeCaptureNew(transitionRoot, transition, features);
			};
		}
		transition = original.apply(this, [arg]);
		if (parent.__vtbag.ic2!.context?.sessionStorage.getItem('ic-analyzer-mode') === 'capture')
			transition = deactivate(transition, transitionRoot, this.ownerDocument ?? this);

		if (this.ownerDocument) {
			if (!('activeViewTransition' in this) || captureOldOnly) {
				this.activeViewTransition = transition;
			}
		} else if (!('activeViewTransition' in transitionRoot.ownerDocument || captureOldOnly)) {
			transitionRoot.ownerDocument.activeViewTransition = transition;
		}
		requestAnimationFrame(() => beforeCaptureOld(transitionRoot, transition, features));
		transition.ready.finally(() => afterCaptureNew(transitionRoot, transition));
		transition.finished.finally(() => {
			animationsWillFinish(transitionRoot, transition);
		});
		return transition;
	} as T;

	function deactivate(transition: ViewTransition, transitionRoot: HTMLElement, document: Document) {
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
				afterCaptureNew(transitionRoot, transition);
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
}

function crossDocumentFeatures(root: HTMLElement) {
	let features = parent.__vtbag.ic2!.vtMap!.get(root.ownerDocument);
	if (!features) {
		features = {};
		parent.__vtbag.ic2!.vtMap!.set(root.ownerDocument, features);
	}
	features.crossDocument = true;
	features.time = Date.now();
	return features;
}

function animationStart(event: AnimationEvent) {
	self.__vtbag.ic2!.context!.dispatchEvent(
		new CustomEvent('ic-animation-start', {
			detail: { root: event.target, event },
		})
	);
}
function animationStop(event: AnimationEvent) {
	self.__vtbag.ic2!.context!.dispatchEvent(
		new CustomEvent('ic-animation-stop', {
			detail: { root: event.target, event },
		})
	);
}

function beforeCaptureOld(root: HTMLElement, viewTransition: ViewTransition, features: Features) {
	features.oldTypes = new Set(viewTransition.types);
	self.__vtbag.ic2!.context!.dispatchEvent(
		new CustomEvent('ic-before-capture-old', {
			detail: { root, viewTransition, features },
		})
	);
}
function afterCaptureOld(root: HTMLElement, viewTransition: ViewTransition) {
	self.__vtbag.ic2!.context!.dispatchEvent(
		new CustomEvent('ic-after-capture-old', {
			detail: { root, viewTransition },
		})
	);
	console.log("afterCaptureOld complete");
}
function beforeCaptureNew(root: HTMLElement, viewTransition: ViewTransition, features: Features) {
	features.newTypes = new Set(viewTransition.types);
	self.__vtbag.ic2!.context!.dispatchEvent(
		new CustomEvent('ic-before-capture-new', {
			detail: { root, viewTransition, features },
		})
	);
}
function afterCaptureNew(root: HTMLElement, viewTransition: ViewTransition) {
	self.__vtbag.ic2!.context!.dispatchEvent(
		new CustomEvent('ic-after-capture-new', {
			detail: { root, viewTransition },
		})
	);
}
function animationsWillFinish(root: HTMLElement, viewTransition: ViewTransition) {
	self.__vtbag.ic2!.context!.dispatchEvent(
		new CustomEvent('ic-about-to-finish', {
			detail: { root, viewTransition },
		})
	);
}
