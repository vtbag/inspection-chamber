import { updateControl } from "./full-control";
import { refreshNames, updateImageVisibility } from "./names";

export function resetFilter() {
	top!.document.querySelector<HTMLInputElement>('#vtbot-ui-filter input[type="text"]')!.value = '';
	top!.document.querySelector<HTMLInputElement>('#vtbot-ui-filter ul input')!.click();
	refreshNames();
}
export function resetSelected() {
	top!.document
		.querySelectorAll<HTMLInputElement>('#vtbot-ui-names li')
		.forEach((item) => item.classList.remove('selected', 'old-hidden', 'new-hidden'));
	updateImageVisibility();
	updateControl();
}


export function initFilter() {
  top!.document.querySelector('#vtbot-ui-filter ul')!.addEventListener('change', refreshNames);
	top!.document
		.querySelector('#vtbot-ui-filter input[type="text"]')!
		.addEventListener('input', refreshNames);
	top!.document.querySelector('#vtbot-ui-filter button')!.addEventListener('click', resetFilter);
}