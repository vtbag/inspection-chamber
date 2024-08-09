import { resetAnimationVisibility } from '../animations';
import { updateControl } from './full-control';
import { refreshNames, updateImageVisibility } from './names';

export function resetFilter() {
	top!.document.querySelector<HTMLInputElement>('#vtbag-ui-filter input[type="text"]')!.value = '';
	top!.document.querySelector<HTMLInputElement>('#vtbag-ui-filter ul input')!.click();
	refreshNames();
}
export function resetSelected() {
	top!.document
		.querySelectorAll<HTMLInputElement>('#vtbag-ui-names li')
		.forEach((item) => item.classList.remove('selected', 'old-hidden', 'new-hidden'));
	updateImageVisibility();
	resetAnimationVisibility();
	updateControl();
}

export function initFilter() {
	top!.document.querySelector('#vtbag-ui-filter ul')!.addEventListener('change', refreshNames);
	top!.document
		.querySelector('#vtbag-ui-filter input[type="text"]')!
		.addEventListener('input', refreshNames);
	top!.document.querySelector('#vtbag-ui-filter button')!.addEventListener('click', resetFilter);
}
