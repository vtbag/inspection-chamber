export function getElementSelector(element: HTMLElement): string {
	if (element.constructor.name === HTMLHtmlElement.name)
		return ':root';

	if (element.id) return '#' + element.id;

	const tagName = element.tagName.toLowerCase();
	let selector = tagName;

	const parent = element.parentElement;
	if (!parent) return selector;

	const siblings = Array.from(parent.children).filter((s) => s.tagName.toLowerCase() === tagName);
	if (siblings.length > 1) {
		const index = siblings.indexOf(element) + 1;
		selector += `:nth-child(${index})`;
	}

	return parent.parentElement ? getElementSelector(parent) + '>' + selector : selector;
}
