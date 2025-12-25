import { ledGroup } from './led-group';
import { mayStartViewTransition } from '@vtbag/utensil-drawer/may-start-view-transition';

export function frameToggles(parent: HTMLElement, grandpaSelector: string) {
	parent.insertAdjacentHTML(
		'beforeend',
		ledGroup({
			className: 'frame',
			groupName: 'frame',
			checked: '',
			independent: true,
			alternatives: [
				{
					label: 'Frame groups',
					value: 'frame-groups',
					id: 'frame-groups',
				},
				{
					label: 'Frame images',
					value: 'frame-images',
					id: 'frame-images',
				},
				{
					label: 'Frame others',
					value: 'frame-others',
					id: 'frame-others',
				},
			],
		})
	);

	const leds = parent.lastElementChild!;

	function refresh() {
		const grandpa = parent.closest(grandpaSelector)!;
		const onOff = (led: HTMLInputElement, selector: string) => {
			const frameToggles = grandpa.querySelectorAll<HTMLInputElement>(selector);
			const checked = [...frameToggles].filter((input) => input.checked && input.checkVisibility());
			led.checked = checked.length > 0;
			led.classList.toggle('orange', checked.length > 0 && checked.length < frameToggles.length);
		};
		onOff(
			leds.querySelector<HTMLInputElement>('#frame-groups')!,
			'vtbag-ic-pseudo label.frame.group input'
		);
		onOff(
			leds.querySelector<HTMLInputElement>('#frame-images')!,
			'vtbag-ic-pseudo :is(label.frame.old, label.frame.new) input'
		);
		onOff(
			leds.querySelector<HTMLInputElement>('#frame-others')!,
			'vtbag-ic-pseudo :is(label.frame.image-pair, label.frame.group-children) input'
		);
	}

	refresh();

	parent.lastElementChild!.addEventListener('click', (e) => {
		const input = e.target as HTMLInputElement;
		if (input.tagName !== 'INPUT') return;

		const what = input.value;
		const checked = input.checked;
		const selector =
			what === 'frame-groups'
				? 'vtbag-ic-pseudo label.frame.group'
				: what === 'frame-images'
					? 'vtbag-ic-pseudo :is(label.frame.old, label.frame.new)'
					: 'vtbag-ic-pseudo :is(label.frame.image-pair, label.frame.group-children)';

		mayStartViewTransition(
			{
				update: () =>
					parent
						.closest(grandpaSelector)
						?.querySelectorAll<HTMLInputElement>(
							`${selector} input${checked ? ':not(:checked)' : ':checked'}`
						)
						.forEach((el) => el.click()),
				types: ['framing'],
			},
			{ collisionBehavior: 'never', useTypesPolyfill: 'always' }
		);
	});

	return refresh;
}
