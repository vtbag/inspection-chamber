export function addBlinds(container: Element, tagName: string, className = "", viewTransitionName = "", viewTransitionClass="none" ) {
	let children = [...container.children];

	if (className) {
		children.forEach((c) => c.classList.contains(className) && c.remove());
		children = [...container.children];
	}
	const containerRect = container.getBoundingClientRect();
	let prev = children[0]?.getBoundingClientRect();

	const fix = [];
	let columnWidth = prev.width;
	children.forEach((g, idx) => {
		const current = g.getBoundingClientRect();
		if (!current.width) return;
		columnWidth = Math.min(columnWidth, current.width);
		if (idx > 0) {
			if (current.top > prev.bottom) fix[idx - 1] = prev;
		}
		prev = current;
	});

	fix[children.length - 1] = prev;
	let cnt = 0;
	for (let i = fix.length - 1; i >= 0; --i) {
		const last = fix[i];
		if (last) {
			const span = ~~((containerRect.right - last.right) / columnWidth);
			if (span > 0) {
				container.children[i].insertAdjacentHTML(
					'afterend',
					`<${tagName} ${className ? `class="${className}"` : ""} style="grid-column: span ${span}; ${viewTransitionName ? `--vtn: p-${viewTransitionName}-${cnt++}; view-transition-class: ${viewTransitionClass}` : ""}"></${tagName}>`
				);
			}
		}
	}
}