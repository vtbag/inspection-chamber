export function highlight(element?: Element | null, pseudoElement?: string) {
	if (element) {
		const options: KeyframeAnimationOptions = { delay: 0, duration: 500, easing: 'ease-in' };
		pseudoElement && (options.pseudoElement = pseudoElement);
		element.animate(
			[
				{ outline: '4px solid lightblue', opacity: 1, borderRadius: '4px', offset: 0 },
				{ outline: '4px solid lightblue', opacity: 0, borderRadius: '4px', offset: 0.7 },
				{ outline: '0 solid gray', opacity: 1, offset: 1 },
			],
			options
		);
		element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
	}
}
