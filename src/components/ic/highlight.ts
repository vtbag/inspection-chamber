export function highlight(element?: HTMLElement) {
	if (element) {
		element.animate(
			[
				{ outline: '6px solid lightblue', offset: 0 },
				{ outline: '0 solid gray', offset: 1 },
			],
			{ delay: 0, duration: 1000, easing: 'ease-in' }
		);
		element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
	}
}
