export function setupHooks(context: Window) {
	console.log('setupHooks');
	self.__vtbag ??= {};
	self.__vtbag.ic2 ??= {};
	self.__vtbag.ic2.context = context;
	self.__vtbag.ic2.pageswap = pageswap;
	self.__vtbag.ic2.pagereveal = pagereveal;
	self.__vtbag.ic2.monkey = monkey;
	self.__vtbag.ic2.iframe = self.document.querySelector('#ic-iframe') as HTMLIFrameElement;
	self.__vtbag.ic2.animationStart = animationStart;
	self.__vtbag.ic2.animationStop = animationStop;
}

function pageswap(event: PageSwapEvent) {
	console.log('enter pageswap', event);
	const transition = event.viewTransition;
	const root = (event.target as Window)?.document?.documentElement;
	if (transition) {
		requestAnimationFrame(() => {
			beforeCaptureOld(root, transition!);
			setTimeout(() => afterCaptureOld(root, transition!));
		});
	}
}
async function pagereveal(event: PageRevealEvent) {
	console.log('enter pagereveal', event);
	const transition = event.viewTransition;
	const root = (event.target as Window)?.document?.documentElement;
	if (transition) {
		transition.ready.finally(() => afterCaptureNew(root, transition));
		transition.finished.finally(() => animationsWillFinish(root, transition));
		await Promise.resolve(true);
		beforeCaptureNew(root, transition);
	}
}

function monkey<
	T extends typeof Element.prototype.startViewTransition | typeof document.startViewTransition,
>(original: T): T {
	return function (
		this: Element | Document,
		arg?: ViewTransitionUpdateCallback | StartViewTransitionOptions
	): ViewTransition {
		console.log('Patched startViewTransition called on', this, arg);
		let transition: ViewTransition;
		if (!original) {
			throw new Error('startViewTransition is not defined on this context');
		}
		const root =
			this.constructor.name === HTMLDocument.name
				? (this as Document).documentElement
				: (this as HTMLElement);

		if (!arg) {
			arg = async () => {
				afterCaptureOld(root, transition);
				beforeCaptureNew(root, transition);
			};
		} else if (typeof arg === 'function') {
			const oldArg = arg;
			arg = async () => {
				afterCaptureOld(root, transition);
				await (oldArg as Function)();
				beforeCaptureNew(root, transition);
			};
		} else if ((arg as StartViewTransitionOptions).update) {
			const oldUpdate = (arg as StartViewTransitionOptions).update;
			arg.update = async () => {
				afterCaptureOld(root, transition);
				await oldUpdate!();
				beforeCaptureNew(root, transition);
			};
		} else {
			(arg as StartViewTransitionOptions).update = () => {
				afterCaptureOld(root, transition);
				beforeCaptureNew(root, transition);
			};
		}
		transition = original.apply(this, [arg]);
		requestAnimationFrame(() => beforeCaptureOld(root, transition));
		transition.ready.finally(() => afterCaptureNew(root, transition));
		transition.finished.finally(() => {
			animationsWillFinish(root, transition);
		});
		return transition;
	} as T;
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

function beforeCaptureOld(root: HTMLElement, viewTransition: ViewTransition) {
	self.__vtbag.ic2!.context!.dispatchEvent(
		new CustomEvent('ic-before-capture-old', {
			detail: { root, viewTransition },
		})
	);
}
function afterCaptureOld(root: HTMLElement, viewTransition: ViewTransition) {
	self.__vtbag.ic2!.context!.dispatchEvent(
		new CustomEvent('ic-after-capture-old', {
			detail: { root, viewTransition },
		})
	);
}
function beforeCaptureNew(root: HTMLElement, viewTransition: ViewTransition) {
	self.__vtbag.ic2!.context!.dispatchEvent(
		new CustomEvent('ic-before-capture-new', {
			detail: { root, viewTransition },
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
