
export type SparseDOMNode = {
	viewTransitionName: string;
	viewTransitionGroup?: string;
	viewTransitionClass?: string;
	style: CSSStyleDeclaration;
	element: Element;
	pseudoElement?: string;
	paintGroup?: number;
	context?: boolean;
	zIndex?: number;
	order?: any;
	children: SparseDOMNode[];
};

export function linkToParent(
	elementMap: Map<Element, SparseDOMNode>,
	transitionRoot: HTMLElement,
	node: SparseDOMNode
) {
	if (node.style?.contain.includes('view-transition')) return;
	if (node.pseudoElement) {
		// todo: if ever supported: handle ::before::marker as child of ::before
		let parent = elementMap.get(node.element);
		if (parent) {
			parent.children.push(node);
			node.paintGroup = paintGroup(node, parent.style);
			return;
		} else {
			const parentStyle = getComputedStyle(node.element);
			parent = {
				children: [],
				element: node.element,
				viewTransitionName: 'none',
				style: parentStyle,
			};
			elementMap.set(node.element, parent);
			parent.children.push(node);
			node.paintGroup = paintGroup(node, parent.style);
			node = parent;
			if (node.style?.contain.includes('view-transition')) return;
			// fall through
		}
	}

	if (node.element.matches(':fullscreen, :popover-open, dialog[open]')) {
		const root = elementMap.get(transitionRoot)!;
		root.children.push(node);
		node.paintGroup = paintGroup(node, root.style);
		return;
	};

	let me = node;
	let current = node.element;


	while (current !== transitionRoot) {

		let parent = elementMap.get(current.parentElement!);
		if (parent) {
			parent.children.push(me);
			me.paintGroup = paintGroup(me, parent.style);
			return;
		}
		const parentElement = current.parentElement!;
		const parentStyle = getComputedStyle(parentElement);
		const newParent: SparseDOMNode = {
			children: [],
			element: parentElement,
			style: parentStyle,
			viewTransitionName: 'none',
		};
		elementMap.set(parentElement, newParent);
		newParent.children.push(me);
		me.paintGroup = paintGroup(me, newParent.style);

		if (parentStyle.contain.includes('view-transition')) return;
		current = parentElement;
		me = newParent;
	}
}

export function sort(node: SparseDOMNode) {

	for (let i = 0; i < node.children.length; ++i) {
		const child = node.children[i];
		sort(child);
		const pseudo = node.children[i].pseudoElement;
		if (pseudo) {
			if (pseudo === '::after') node.children.push(node.children.splice(i, 1)[0]);
			else node.children.unshift(node.children.splice(i, 1)[0]);
		}
		if (!child.context) {
			node.children.splice(i, 0, ...child.children);
			i += child.children.length;
			child.children.length = 0;
		}
	}
	node.children.sort((a, b) =>
		a.paintGroup !== b.paintGroup
			? (a.paintGroup! - b.paintGroup!)
			: a.zIndex !== b.zIndex
				? a.zIndex! - b.zIndex!
				: a.order !== b.order
					? a.order! - b.order!
					: a.element.compareDocumentPosition(b.element) & Node.DOCUMENT_POSITION_PRECEDING
						? 1
						: -1
	);
}

export function print(group: SparseDOMNode, depth = 0) {
	console.log(`${' '.repeat(depth * 2)}- ${group.element.tagName} ${group.viewTransitionName} ${group.paintGroup} ${group.zIndex}`);
	group.children.forEach((child) => print(child, depth + 1));
}

const noneProps = ['backdrop-filter', 'clip-path', 'filter', 'mask', 'mask-image', 'perspective', 'rotate', 'scale', 'transform', 'translate', 'view-transition-name', 'webkit-transform', 'webkit-mask'];
const otherProps = ['isolation', 'mix-blend-mode', 'opacity', 'position', 'container-type'];
const allProps = [...noneProps, ...otherProps];

export function paintGroup(node: SparseDOMNode, parentStyle: CSSStyleDeclaration) {
	node.zIndex = getZIndex(node, parentStyle);
	node.order = node.style.order ? parseInt(node.style.order, 10) : 0;
	node.context = createsStackingContext(node, parentStyle);
	if (node.zIndex < 0) return 1;
	if (node.zIndex > 0) return 6;
	if (node.context || node.style.position !== 'static') return 5;
	if (node.style.float !== 'none') return 3;
	if (node.style.display.startsWith('inline')) return 4;
	return 2;
}
function createsStackingContext(node: SparseDOMNode, parentStyle: CSSStyleDeclaration): boolean {
	const { element, style } = node;
	if (element.matches(':fullscreen, :popover-open, dialog[open]')) return true;
	if (style.zIndex !== 'auto') {
		if (['relative', 'absolute'].includes(style.position)) return true;
		if (parentStyle?.display.includes('flex') || parentStyle?.display.includes('grid')) return true;
	}
	if (element === document.documentElement) return true;
	if (['fixed', 'sticky'].includes(style.position)) return true;
	if (['layout', 'paint', 'strict', 'content'].some((val) => style.contain.includes(val))) return true;
	if (style.containerType === 'size' || style.containerType === 'inline-size') return true;
	if (style.isolation && style.isolation === 'isolate') return true;
	if (style.mixBlendMode && style.mixBlendMode !== 'normal') return true;
	if (parseFloat(style.opacity || '1') < 1) return true;

	if (noneProps.some((prop) => style.getPropertyValue(prop) && style.getPropertyValue(prop) !== 'none')) return true;

	if (allProps.some((val) => style.willChange.includes(val))) return true;
	// @ts-expect-error
	if (style.webkitOverflowScrolling === 'touch') return true;
	if (element.matches(':fullscreen, :popover-open, dialog[open]')) return true;
	return false;
}


export function getZIndex(node: SparseDOMNode, parentStyle: CSSStyleDeclaration): number {
	const { style, element } = node;
	if (element.matches(':fullscreen, :popover-open, dialog[open]')) return Number.MAX_SAFE_INTEGER; /* todo: record open event to identify correct paint order */

	if (style.zIndex === 'auto') return 0;
	if (!parentStyle.display.includes('flex') && !parentStyle.display.includes('grid') && style.position === 'static') return 0;
	const zValue = parseInt(style.zIndex, 10);
	return isNaN(zValue) ? 0 : zValue;
}



