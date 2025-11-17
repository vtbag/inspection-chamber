
export function addBlinds(
	container: Element,
	tagName: string,
	className = '',
	viewTransitionName = '',
	viewTransitionClass = 'none'
) {
	let children = [...container.children];

	if (className) {
		children.forEach((c) => c.classList.contains(className) && c.remove());
		children = [...container.children];
	}
	const order = denseOrder(container);
	const containerRect = container.getBoundingClientRect();
	let prev = children[order[0]]?.getBoundingClientRect();
	const fix = [];
	let columnWidth = prev.width;
	for (let j = 0; j < children.length; ++j) {
		const idx = order[j];
		const g = children[idx];
		const current = g.getBoundingClientRect();
		if (!current.width) continue;
		columnWidth = columnWidth === 0 ? current.width : Math.min(columnWidth, current.width);
		if (idx > 0) {
			if (current.top > prev.bottom) fix[idx - 1] = prev;
		}
		prev = current;
	}

	fix[children.length - 1] = prev;
	let cnt = 0;
	for (let j = fix.length - 1; j >= 0; --j) {
		const i = order[j];
		const last = fix[i];
		if (last) {
			const span = ~~((containerRect.right - last.right) / columnWidth);
			if (span > 0) {
				container.children[i].insertAdjacentHTML(
					'afterend',
					`<${tagName} ${className ? `class="${className}"` : ''} style="grid-column: span ${span}; ${viewTransitionName ? `--vtn: p-${viewTransitionName}-${cnt++}; view-transition-class: ${viewTransitionClass}` : ''}"></${tagName}>`
				);
			}
		}
	}
}

function denseOrder(container: Element): number[] {
	const positions: { index: number; top: number; left: number; }[] = [];
	[...container.children].forEach((child, index) => {
		const rect = child.getBoundingClientRect();
		positions.push({ index, top: rect.top, left: rect.left });
	});
	positions.sort((a, b) => (a.top === b.top ? a.left - b.left : a.top - b.top));
	return positions.map((p) => p.index);
} 