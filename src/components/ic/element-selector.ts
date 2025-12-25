export function deriveCSSSelector(element?: Element, short = true) {
	let path = '';
	if (!element) return '';

	const unique = (s: string) => element?.ownerDocument.querySelectorAll(s).length === 1;

	if (element?.constructor.name === HTMLHtmlElement.name) return ':root';

	while (element?.nodeType === Node.ELEMENT_NODE) {
		const tag = element.tagName.toLowerCase();
		let selector = tag;
		if (element.id) {
			selector = '#' + CSS.escape(element.id);
		}
		let test = path ? selector + '>' + path : selector;
		if (short && unique(test)) {
			return test;
		}

		let sibling = element;
		let nth = 1;
		while ((sibling = sibling.previousElementSibling as Element)) {
			if (sibling.tagName.toLowerCase() === tag) nth++;
		}
		selector += ':nth-of-type(' + nth + ')';
		test = path ? selector + '>' + path : selector;
		if (short && unique(test)) {
			return test;
		}
		path = test;
		element = element.parentNode as Element;
	}
	return path;
}
