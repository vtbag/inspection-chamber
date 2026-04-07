export function highlight(element?: Element | null, pseudoElement?: string) {
	if (element) {
		const options: KeyframeAnimationOptions = { delay: 0, duration: 500, easing: 'ease-in' };
		pseudoElement && (options.pseudoElement = pseudoElement);
		element.animate(
			[
				{ outline: '0px solid lightblue', borderRadius: '4px', outlineOffset: '-2px' },
				{ outline: '4px solid lightblue', borderRadius: '4px', outlineOffset: '-4px', offset: 0.5 },
				{ outline: '0px solid lightblue', borderRadius: '4px', outlineOffset: '-2px', offset: 1 },
			],
			options
		);
		element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
	}
}
