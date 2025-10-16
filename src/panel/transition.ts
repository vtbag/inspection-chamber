import { DEBUG } from './debug';

export const vtActive = () => top!.document.documentElement.classList.contains('vtbag-vt-active');
export const setVtActive = () => top!.document.documentElement.classList.add('vtbag-vt-active');
export const clearVtActive = () =>
	top!.document.documentElement.classList.remove('vtbag-vt-active');

let outerViewTransition: ViewTransition | undefined;
let outerName: string | undefined;

export function mayViewTransition(fun: () => void, name: string, skip = false) {
	const inspectionRunning = vtActive();

	if (skip || inspectionRunning || outerViewTransition || !top!.document.startViewTransition) {
		outerName;
		DEBUG &&
			console.log(
				`view transition '${name}' skipped in favour of ${inspectionRunning ? 'inspection' : "'" + outerName + "'"}`
			);
		fun();
	} else {
		outerName = name;
		const error = (e: any) => console.error(e);
		outerViewTransition = top!.document.startViewTransition(fun);
		outerViewTransition.updateCallbackDone.catch(error);
		outerViewTransition.ready.catch(error);
		outerViewTransition.finished.catch(error);
		outerViewTransition.finished.finally(() => (outerViewTransition = outerName = undefined));
	}
}

export function exitViewTransition() {
	top!.__vtbag.inspectionChamber!.viewTransition?.skipTransition();
}
