import { setupPauseSheet } from './pause-sheet';
export function setupHooks() {
	console.log('setupHooks');
	top!.__vtbag ??= {};
	top!.__vtbag.ic2 ??= {};
	top!.__vtbag.ic2.pageswap = pageswap;
	top!.__vtbag.ic2.pagereveal = pagereveal;
	top!.__vtbag.ic2.monkey = monkey;
	top!.__vtbag.ic2.iframe = top!.document.querySelector('#ic-iframe') as HTMLIFrameElement;
	top!.__vtbag.ic2.animationStart = animationStart;
	top!.__vtbag.ic2.animationStop = animationStop;
}

function pageswap(event: PageSwapEvent) {
	console.log('enter pageswap', event);

	top!.__vtbag!.ic2!.globalViewTransition = event.viewTransition;
	if (event.viewTransition) {
		requestAnimationFrame(() => {
			beforeCaptureOld(event.viewTransition!);
			setTimeout(() => afterCaptureOld(event.viewTransition!));
		});
	}
}
async function pagereveal(event: PageRevealEvent) {
	console.log('enter pagereveal', event);

	top!.__vtbag!.ic2!.globalViewTransition = event.viewTransition;
	if (event.viewTransition) {
		event.viewTransition.ready.finally(() => afterCaptureNew(event.viewTransition!));
		await Promise.resolve(true);
		beforeCaptureNew(event.viewTransition!);
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

		if (!arg) {
			arg = async () => {
				afterCaptureOld(transition);
				beforeCaptureNew(transition);
			};
		} else if (typeof arg === 'function') {
			const oldArg = arg;
			arg = async () => {
				afterCaptureOld(transition);
				await (oldArg as Function)();
				beforeCaptureNew(transition);
			};
		} else if ((arg as StartViewTransitionOptions).update) {
			const oldUpdate = (arg as StartViewTransitionOptions).update;
			arg.update = async () => {
				afterCaptureOld(transition);
				await oldUpdate!();
				beforeCaptureNew(transition);
			};
		} else {
			(arg as StartViewTransitionOptions).update = () => {
				afterCaptureOld(transition);
				beforeCaptureNew(transition);
			};
		}
		transition = original.apply(this, [arg]);
		requestAnimationFrame(() => beforeCaptureOld(transition));
		transition.ready.finally(() => afterCaptureNew(transition));
		return transition;
	} as T;
}

function animationStart(event: AnimationEvent) {
	top!.dispatchEvent(new CustomEvent('ic-animation-change', { detail: event }));
}
function animationStop(event: AnimationEvent) {
	top!.dispatchEvent(new CustomEvent('ic-animation-change', { detail: event }));
}

function beforeCaptureOld(viewTransition: ViewTransition) {
	//console.log('beforeCaptureOld', viewTransition);
	top!.dispatchEvent(new CustomEvent('ic-before-capture-old', { detail: { viewTransition } }));
}
function afterCaptureOld(viewTransition: ViewTransition) {
	//console.log('afterCaptureOld', viewTransition);
	top!.dispatchEvent(new CustomEvent('ic-after-capture-old', { detail: { viewTransition } }));
}
function beforeCaptureNew(viewTransition: ViewTransition) {
	//console.log('beforeCaptureNew', viewTransition);
	top!.dispatchEvent(new CustomEvent('ic-before-capture-new', { detail: { viewTransition } }));
}
function afterCaptureNew(viewTransition: ViewTransition) {
	//console.log('afterCaptureNew', viewTransition);
	top!.dispatchEvent(new CustomEvent('ic-after-capture-new', { detail: { viewTransition } }));
}
