import { deriveCSSSelector } from './element-selector';

export type SparseDOMNode = {
	viewTransitionName: string;
	viewTransitionGroup?: string;
	viewTransitionClass?: string;
	viewTransitionScope?: string;
	style: CSSStyleDeclaration;
	element: Element;
	pseudoElement?: string;
	paintGroup?: number;
	context?: boolean;
	zIndex?: number;
	order?: any;
	children: SparseDOMNode[];
	hiddenBy?: SparseDOMNode;
	hiddenBecause?: Set<string>;
	hidingParent?: SparseDOMNode;
};

export function sparseDomNode(
	element: Element,
	pseudoElement?: string,
	style?: CSSStyleDeclaration
): SparseDOMNode {
	style ??= getComputedStyle(element, pseudoElement);
	const node = {
		children: [],
		element,
		pseudoElement,
		style,
		viewTransitionName: 'none',
	} as SparseDOMNode;

	const hiddenBecause = new Set<string>();
	style.display === 'none' && hiddenBecause.add('displayNone');
	style.display === 'contents' && hiddenBecause.add('displayContents');
	style.contentVisibility === 'hidden' && hiddenBecause.add('contentVisibilityHidden');
	style.viewTransitionScope &&
		style.viewTransitionScope !== 'none' &&
		hiddenBecause.add('viewTransitionScope');
	pseudoElement &&
		style.getPropertyValue('content') === 'none' &&
		hiddenBecause.add('emptyPseudoElement');

	if (hiddenBecause.size) {
		node.hiddenBy = node;
		node.hiddenBecause = hiddenBecause;
	}
	return node;
}

function checkHidden(node: SparseDOMNode, hider: SparseDOMNode | undefined): boolean {
	if (!hider) return false;
	if (hider.hiddenBecause?.has('displayNone')) return true;
	if (hider.hiddenBecause?.has('viewTransitionScope')) return true;
	if (hider.hiddenBecause?.has('emptyPseudoElement')) return true;
	if (
		hider.hiddenBecause?.has('contentVisibilityHidden') &&
		hider.hiddenBecause.has('displayContents')
	)
		return true;
	if (hider.hiddenBecause?.has('contentVisibilityHidden'))
		return hider === node ? checkHidden(node, hider.hidingParent!) : true;
	if (hider.hiddenBecause?.has('displayContents'))
		return hider === node ? true : checkHidden(node, hider.hidingParent!);

	console.error(
		'[Inspection Chmber] Unhandled hidden case for',
		deriveCSSSelector(node.element),
		'hidden by',
		deriveCSSSelector(hider.element),
		'with hiddenBecause',
		hider.hiddenBecause
	);
	return true;
}

export function isHidden(node: SparseDOMNode, hiddenBy: SparseDOMNode | undefined) {
	if (node.hiddenBy && hiddenBy) {
		node.hidingParent = hiddenBy;
	}
	const hider = node.hiddenBy || hiddenBy;
	const hidden = checkHidden(node, hider);
	node.hiddenBy = hider;

	return { hidden, hider };
}

export function addParentLinks(
	sparseDOM: SparseDOMNode[],
	elementMap: Map<Element, SparseDOMNode>,
	transitionRoot: HTMLElement
) {
	const root = elementMap.get(transitionRoot)!;
	root.paintGroup = paintGroup(root, '');
	sparseDOM.forEach((n) => linkToParent(elementMap, transitionRoot, n));
}

function linkToParent(
	elementMap: Map<Element, SparseDOMNode>,
	transitionRoot: HTMLElement,
	node: SparseDOMNode
) {
	if (node.pseudoElement) {
		// todo: if ever supported: handle ::before::marker as child of ::before
		let parent = elementMap.get(node.element);
		if (parent) {
			parent.children.push(node);
			node.paintGroup = paintGroup(node, parent.style.display);
			return;
		} else {
			parent = sparseDomNode(node.element);
			elementMap.set(node.element, parent);
			parent.children.push(node);
			node.paintGroup = paintGroup(node, parent.style.display);
			node = parent;
			// fall through
		}
	}

	if (node.element.matches(':fullscreen, :popover-open, dialog[open]')) {
		const root = elementMap.get(transitionRoot)!;
		root.children.push(node);
		node.paintGroup = paintGroup(node, root.style.display);
		return;
	}

	let me = node;
	let current = node.element;

	while (current !== transitionRoot) {
		let parent = elementMap.get(current.parentElement!);
		if (parent) {
			parent.children.push(me);
			me.paintGroup = paintGroup(me, parent.style.display);
			return;
		}
		const parentElement = current.parentElement!;
		const newParent = sparseDomNode(parentElement);
		elementMap.set(parentElement, newParent);
		newParent.children.push(me);
		me.paintGroup = paintGroup(me, newParent.style.display);

		current = parentElement;
		me = newParent;
	}
}

export function sort(node: SparseDOMNode, hidden: SparseDOMNode | undefined = undefined) {
	node.hiddenBy ??= hidden;
	for (let i = 0; i < node.children.length; ++i) {
		const child = node.children[i];
		sort(child, node.hiddenBy);
		if (!child.context && (!child.viewTransitionScope || child.viewTransitionScope === 'none')) {
			node.children.splice(i, 0, ...child.children);
			i += child.children.length;
			child.children.length = 0;
		}
	}

	node.children.sort((a, b) => {
		const aPseudo = a.pseudoElement?.replace('::before', '!:before') || '';
		const bPseudo = b.pseudoElement?.replace('::before', '!:before') || '';
		return a.paintGroup !== b.paintGroup
			? a.paintGroup! - b.paintGroup!
			: a.zIndex !== b.zIndex
				? a.zIndex! - b.zIndex!
				: a.order !== b.order
					? a.order! - b.order!
					: a.element === b.element
						? aPseudo > bPseudo
							? 1
							: aPseudo < bPseudo
								? -1
								: 0
						: a.element.compareDocumentPosition(b.element) & Node.DOCUMENT_POSITION_PRECEDING
							? 1
							: -1;
	});
}

export function print(root: SparseDOMNode, depth = 0) {
	let what = deriveCSSSelector(root.element);
	let pruned = '';
	if (what.startsWith('#')) what = what + ' (' + (root.element.tagName || '') + ')';
	if (!!root.hiddenBy) pruned = 'color: light-dark(orange, darkorange); font-weight: bold;';
	console.log(
		`%c${' '.repeat(depth * 2)} - ${what}${root.pseudoElement || ''}, name: ${root.viewTransitionName}, paint order modifier: ${root.paintGroup}.${root.zIndex}.${root.order}${pruned ? `, hidden by ${deriveCSSSelector(root.hiddenBy?.element)}` : ''},`,
		pruned,
		root.hiddenBy?.hiddenBecause
	);
	root.children.forEach((child) => print(child, depth + 1));
}

const noneProps = [
	'backdrop-filter',
	'clip-path',
	'filter',
	'mask',
	'mask-image',
	'perspective',
	'rotate',
	'scale',
	'transform',
	'translate',
	'view-transition-name',
	'webkit-transform',
	'webkit-mask',
];
const otherProps = ['isolation', 'mix-blend-mode', 'opacity', 'position', 'container-type'];
const allProps = [...noneProps, ...otherProps];

export function paintGroup(node: SparseDOMNode, parentDisplay: string): number {
	node.zIndex = getZIndex(node, parentDisplay);
	node.order = node.style.order ? parseInt(node.style.order, 10) : 0;
	node.context = createsStackingContext(node, parentDisplay);
	if (node.zIndex < 0) return 1;
	if (node.zIndex > 0) return 6;
	if (node.context || node.style.position !== 'static') return 5;
	if (node.style.float !== 'none') return 3;
	if (node.style.display.startsWith('inline')) return 4;
	return 2;
}
function createsStackingContext(node: SparseDOMNode, parentDisplay: string): boolean {
	const { element, style } = node;
	if (element.matches(':fullscreen, :popover-open, dialog[open]')) return true;
	if (style.zIndex !== 'auto') {
		if (['relative', 'absolute'].includes(style.position)) return true;
		if (parentDisplay.includes('flex') || parentDisplay.includes('grid')) return true;
	}
	if (element === element.ownerDocument.documentElement) return true;
	if (['fixed', 'sticky'].includes(style.position)) return true;
	if (['layout', 'paint', 'strict', 'content'].some((val) => style.contain.includes(val)))
		return true;
	if (style.containerType === 'size' || style.containerType === 'inline-size') return true;
	if (style.isolation && style.isolation === 'isolate') return true;
	if (style.mixBlendMode && style.mixBlendMode !== 'normal') return true;
	if (parseFloat(style.opacity || '1') < 1) return true;

	if (
		noneProps.some(
			(prop) => style.getPropertyValue(prop) && style.getPropertyValue(prop) !== 'none'
		)
	)
		return true;

	if (allProps.some((val) => style.willChange.includes(val))) return true;
	// @ts-expect-error
	if (style.webkitOverflowScrolling === 'touch') return true;
	if (element.matches(':fullscreen, :popover-open, dialog[open]')) return true;
	return false;
}

export function getZIndex(node: SparseDOMNode, parentDisplay: string): number {
	const { style, element } = node;
	if (element.matches(':fullscreen, :popover-open, dialog[open]'))
		return Number.MAX_SAFE_INTEGER; /* todo: record open event to identify correct paint order */

	if (style.zIndex === 'auto') return 0;
	if (
		parentDisplay.includes('flex') ||
		parentDisplay.includes('grid') ||
		style.position !== 'static'
	) {
		const zValue = parseInt(style.zIndex, 10);
		return isNaN(zValue) ? 0 : zValue;
	} else return 0;
}
