import { type Selector, type SelectorList, parse, generate } from 'css-tree';

const animations = new Set<string>();
const elements: { element: HTMLElement; pseudoElement: string }[] = [];
const pseudoElements = new Set<string>();
let root: HTMLElement;

export const allRoots: Set<HTMLElement> = new Set();

export function namedElements(viewTransitionRoot: HTMLElement = document.documentElement) {
	root = viewTransitionRoot;
	elements.length = 0;

	allRoots.forEach(
		(r) => root.contains(r) && elements.push({ element: r, pseudoElement: undefined! })
	);
	root
		.querySelectorAll<HTMLElement>('[style*=view-transition-]')
		.forEach((el) => elements.push({ element: el, pseudoElement: undefined! }));
	animations.clear();
	pseudoElements.clear();
	[...root.ownerDocument.styleSheets, ...root.ownerDocument.adoptedStyleSheets].forEach((sheet) =>
		namedElementsOfSheet(sheet)
	);
	return { elements, animations: [...animations], pseudoElements: [...pseudoElements] };
}

function namedElementsOfSheet(sheet: CSSStyleSheet) {
	if (sheet.disabled) return;
	[...sheet.cssRules].forEach((rule) => namedElementsOfRule(rule));
}

function namedElementsOfRule(rule: CSSRule, keyframeName?: string) {
	const name = rule.constructor.name;
	if (
		name === 'CSSImportRule' ||
		name === 'CSSFontFaceRule' ||
		name === 'CSSPageRule' ||
		name === 'CSSNamespaceRule' ||
		name === 'CSSKeyframesRule' ||
		name === 'CSSCounterStyleRule' ||
		name === 'CSSFontFeatureValuesRule' ||
		name === 'CSSFontPaletteValuesRule' ||
		name === 'CSSLayerStatementRule' ||
		name === 'CSSPropertyRule' ||
		name === 'CSSViewTransitionRule'
	)
		return;

	if (name === 'CSSStyleRule') {
		if (!rule.cssText.includes('view-transition-')) return;
		declNamedElements((rule as CSSStyleRule).style);
		// fall through to grouping rule to check nested rules
	}
	if (name === 'CSSGroupingRule' || name === 'CSSStyleRule') {
		[...(rule as CSSGroupingRule).cssRules].forEach((rule) => namedElementsOfRule(rule));
		return;
	}

	if (name === 'CSSNestedDeclarations') return declNamedElements((rule as any).style);

	if (name === 'CSSKeyframesRule') {
		[...(rule as CSSKeyframesRule).cssRules].forEach((frame) =>
			namedElementsOfRule(frame, (rule as CSSKeyframesRule).name)
		);
		return;
	}

	if (name === 'CSSKeyframeRule')
		return frameNamedElements((rule as CSSKeyframeRule).style, keyframeName!);

	console.error('Unknown CSSRule', rule);
}

function frameNamedElements(style: CSSStyleDeclaration, keyframeName: string) {
	for (let i = 0; i < style.length; ++i) {
		if (style.item(i).startsWith('view-transition-')) {
			animations.add(keyframeName);
			console.log('animation', keyframeName);
		}
	}
}

function declNamedElements(style: CSSStyleDeclaration) {
	for (let i = 0; i < style.length; ++i) {
		if (style.item(i).startsWith('view-transition-')) return styledElements(style.parentRule);
	}
}

function styledElements(parent: CSSRule | null) {
	let selectors: string[] = ['&'];

	for (;;) {
		while (
			parent &&
			!(parent.constructor.name === 'CSSStyleRule' || parent.constructor.name === 'CSSScopeRule')
		) {
			parent = parent.parentRule;
		}

		if (parent) {
			selectors = collect(parent as CSSStyleRule | CSSScopeRule, selectors);
			parent = parent.parentRule;
			continue;
		}
		selectors.forEach((sel) => {
			let pseudoElement: string;
			const original = sel;
			let parsed = parse(sel, { context: 'selector' }) as Selector;
			while (parsed.children.last?.type === 'PseudoElementSelector') {
				pseudoElement = generate(parsed.children.last);
				pseudoElements.add(pseudoElement!);
				sel = generate(parsed).slice(0, -pseudoElement.length).trim();
				parsed = parse(sel, { context: 'selector' }) as Selector;
			}
			pseudoElement = original.slice(sel.length).trim();
			[...root.ownerDocument.querySelectorAll<HTMLElement>(sel)]
				.filter((el) => root.contains(el))
				.forEach((element) => elements.push({ element, pseudoElement }));
		});
		break;
	}
}

function collect(parent: CSSStyleRule | CSSScopeRule, selectors: string[]): string[] {
	const nested = selectors;
	selectors = [];
	if (parent.constructor.name === 'CSSStyleRule') {
		splitSelectorList((parent as CSSStyleRule).selectorText).forEach((sel) =>
			nested.forEach((nes) => selectors.push(nes.replaceAll(/&/g, sel)))
		);
	} else {
		const scopeRuleParent = parent as CSSScopeRule;
		const scopes = scopeRuleParent.start
			? splitSelectorList(scopeRuleParent.start)
			: [
					deriveCSSSelector(
						parent.parentStyleSheet?.ownerNode?.parentElement ?? root.ownerDocument.documentElement
					),
				];

		scopes.forEach((scope) =>
			nested.forEach((nes) => {
				let replaced = nes.replaceAll(/&|:scope/g, scope);
				replaced !== nes || (replaced = `${scope} ${nes}`);
				selectors.push(replaced);
			})
		);
	}
	return selectors;
}

const splitSelectorList = (s: string): string[] => {
	const res = [] as string[];
	(parse(s, { context: 'selectorList' }) as SelectorList).children.forEach((node) =>
		res.push(generate(node))
	);
	return res;
};

function deriveCSSSelector(element?: Element, useIds = true) {
	let path: string[] = [];
	while (element && element.nodeType === Node.ELEMENT_NODE) {
		let selector = element.nodeName.toLowerCase();
		if (useIds && element.id) {
			selector = '#' + element.id;
			path.unshift(selector);
			break;
		} else {
			let sibling = element;
			let nth = 1;
			while ((sibling = sibling.previousElementSibling as Element)) {
				if (sibling.nodeName.toLowerCase() === selector) nth++;
			}
			if (nth !== 1) {
				selector += ':nth-of-type(' + nth + ')';
			}
		}
		path.unshift(selector);
		element = element.parentNode as Element;
	}
	return path.join(' > ');
}
