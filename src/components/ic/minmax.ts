import './minmax.css';
import './toggle.css';

export const defaultTransitionDuration = 150;

export function minmax(
	content: HTMLElement,
	initial: 'minimized' | 'maximized',
	what: string,
	storage?: Storage,
	key?: string,
	callback?: (minmax: HTMLInputElement) => void
) {
	if (storage && key) {
		const persisted = storage.getItem(key);
		if (persisted) {
			initial = persisted === 'minimized' ? 'minimized' : 'maximized';
		}
	}

	content.insertAdjacentHTML(
		'beforebegin',
		initial === 'minimized'
			? `<label class="toggle minmax"><input type="checkbox" checked>${what}</label><div class="shrinker closed" style="height:0"></div>`
			: `<label class="toggle minmax"><input type="checkbox">${what}</label><div class="shrinker"></div>`
	);

	const shrinker = content.previousElementSibling as HTMLDivElement;
	const input = shrinker.previousElementSibling!.firstElementChild! as HTMLInputElement;

	// @ts-ignore
	if ('!moveBefore' in Element.prototype) shrinker.moveBefore(content, null);
	else shrinker.appendChild(content);

	input.addEventListener('click', (e) => {
		const input = e.target as HTMLInputElement;
		const label = input.parentElement as HTMLLabelElement;
		const hint = label.dataset.disabled;
		if (hint) {
			e.preventDefault();
			document.dispatchEvent(new CustomEvent('ic-show-message', { detail: hint }));
		}
	});

	input.addEventListener('change', () => {
		const style = getComputedStyle(shrinker);
		if (input.checked) {
			shrinker.style.height = style.height;
			shrinker.offsetHeight;
			shrinker.style.height = '0px';
			shrinker.classList.add('closed');
		} else {
			shrinker.style.height = '';
			shrinker.offsetHeight;
			const height = style.height;
			shrinker.style.height = '0px';
			shrinker.offsetHeight;
			shrinker.style.height = height;
			shrinker.addEventListener('transitionend', () => (shrinker.style.height = ''), {
				once: true,
			});
			shrinker?.classList.remove('closed');
		}
		if (storage && key) storage.setItem(key, input.checked ? 'minimized' : 'maximized');

		callback && callback(input);
	});
	callback && callback(input);
}

export function disableMinmax(label: HTMLElement, hint: string) {
	const input = label?.firstElementChild as HTMLInputElement;
	!input.checked && input.click();
	label.dataset.disabled = hint;
}
export function enableMinmax(label: HTMLElement) {
	label?.removeAttribute('data-disabled');
}

export function hideMinmax(label?: HTMLElement) {
	label?.parentElement?.style.setProperty('display', 'none');
}
export function showMinmax(label?: HTMLElement) {
	label?.parentElement?.style.setProperty('display', 'block');
}

export function resizeMinmax(label: HTMLElement, callback: () => void) {
	const shrinker = label.nextElementSibling as HTMLDivElement;
	const style = getComputedStyle(shrinker);
	shrinker.offsetHeight;
	const oldHeight = style.height;
	shrinker.style.height = oldHeight;
	shrinker.offsetHeight;
	callback();
	shrinker.style.height = '';
	shrinker.offsetHeight;
	const newHeight = style.height;

	shrinker.style.height = oldHeight;
	shrinker.offsetHeight;
	shrinker.style.height = newHeight;
	shrinker.addEventListener('transitionend', () => (shrinker.style.height = ''), {
		once: true,
	});
}
