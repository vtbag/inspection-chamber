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
	let rows = 0;
	for (let j = 0; j < children.length; ++j) {
		const idx = order[j];
		const child = children[idx] as HTMLElement;
		const current = child.getBoundingClientRect();
		if (!current.width) continue;
		columnWidth = columnWidth === 0 ? current.width : Math.min(columnWidth, current.width);
		if (idx > 0 && current.top > prev.bottom) {
			fix[idx - 1] = prev;
			rows++;
		}
		prev = current;
	}

	const addDelay = (el: HTMLElement, delay: number) => {
		const vtc = el.style
			.getPropertyValue('--vtc')
			.split(' ')
			.filter((e) => !e.startsWith('delay-'));
		vtc.push(`delay-${Math.max(0, delay)}`);
		el.style.setProperty('--vtc', vtc.join(' '));
	};

	fix[children.length - 1] = prev;
	let cnt = 0;
	let delay = Math.min(3, rows) + 1;
	for (let j = fix.length - 1; j >= 0; --j) {
		const i = order[j];
		const last = fix[i];
		let child = children[i] as HTMLElement;
		if (last) {
			delay = Math.max(0, delay - 1);
			const span = ~~((containerRect.right - last.right) / columnWidth);
			if (span > 0) {
				container.children[i].insertAdjacentHTML(
					'afterend',
					`<${tagName} ${className ? `class="${className}"` : ''} style="grid-column: span ${span}; ${viewTransitionName ? `--vtn: p-${viewTransitionName}-${cnt++}; --vtc: ${viewTransitionClass}` : ''}"></${tagName}>`
				);
				addDelay(container.children[i + 1] as HTMLElement, delay);
			}
		}
		addDelay(child, delay);
	}
}

function denseOrder(container: Element): number[] {
	const positions: { index: number; top: number; left: number }[] = [];
	[...container.children].forEach((child, index) => {
		const rect = child.getBoundingClientRect();
		positions.push({ index, top: rect.top, left: rect.left });
	});
	positions.sort((a, b) => (a.top === b.top ? a.left - b.left : a.top - b.top));
	return positions.map((p) => p.index);
}
