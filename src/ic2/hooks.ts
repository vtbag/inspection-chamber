import { setupPauseSheet } from './pause-sheet';

export function setupHooks() {
	console.log('setupHooks');
	top!.__vtbag ??= {};
	top!.__vtbag.ic2 ??= {};
	top!.__vtbag.ic2.pageswap = pageswap;
	top!.__vtbag.ic2.pagereveal = pagereveal;
	top!.__vtbag.ic2.monkey = monkey;
	top!.__vtbag.ic2.iframe = top!.document.querySelector('iframe') as HTMLIFrameElement;
}

function pageswap(event: PageSwapEvent) {
	console.log('enter pageswap', event);

	top!.__vtbag!.ic2!.globalViewTransition = event.viewTransition;
	if (event.viewTransition) {
		setTimeout(() => {
			beforeUpdate();
			// check for current setup and serialize it to sessionStorage
		});
	}
}
function pagereveal(event: PageRevealEvent) {
	console.log('enter pagereveal', event);

	top!.__vtbag!.ic2!.globalViewTransition = event.viewTransition;
	if (event.viewTransition) {
		setupPauseSheet().disabled = !(
			top!.document.getElementById('freeze-toggle') as HTMLInputElement
		).checked;
		event.viewTransition.ready.finally(ready);
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

		if (!original) {
			throw new Error('startViewTransition is not defined on this context');
		}

		if (!arg) {
			arg = beforeUpdate;
		} else if (typeof arg === 'function') {
			arg = async () => {
				beforeUpdate();
				await (arg as Function)();
			};
		} else if ((arg as StartViewTransitionOptions).update) {
			arg.update = async () => {
				beforeUpdate();
				await (arg as StartViewTransitionOptions).update!();
			};
		} else {
			(arg as StartViewTransitionOptions).update = beforeUpdate;
		}
		const transition = original.apply(this, [arg]);
		transition.ready.finally(ready);
		return transition;
	} as T;
}

export function beforeUpdate() {
	console.log('beforeUpdate');
}
export function ready() {
	console.log('ready');
}
