export function highlight(element?: Element | null) {
	if (element) {
		element.animate(
			[
				{ outline: '4px solid lightblue', borderRadius: '4px', offset: 0 },
				{ outline: '4px solid lightblue', borderRadius: '4px', offset: 0.7 },
				{ outline: '0 solid gray', offset: 1 },
			],
			{ delay: 0, duration: 1000, easing: 'ease-in' }
		);
		element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
	}
}
