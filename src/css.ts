import { type Selector, type SelectorList, parse, generate } from 'css-tree';

const animations = new Set<string>();
const elements: { element: HTMLElement; pseudoElement: string }[] = [];
const pseudoElements = new Set<string>();
let root: HTMLElement;

export function namedElements(viewTransitionRoot: HTMLElement = document.documentElement) {
	root = viewTransitionRoot;
	elements.length = 0;
	animations.clear();
	pseudoElements.clear();
	[...document.styleSheets, ...document.adoptedStyleSheets].forEach((sheet) =>
		namedElementsOfSheet(sheet)
	);
	console.log('Named elements:', elements);
	console.log('Named animations:', animations);
	console.log('Pseudo-elements:', pseudoElements);
}

function namedElementsOfSheet(sheet: CSSStyleSheet) {
	if (sheet.disabled) return;
	[...sheet.cssRules].forEach((rule) => namedElementsOfRule(rule));
}

function namedElementsOfRule(rule: CSSRule, keyframeName?: string) {
	if (
		rule instanceof CSSImportRule ||
		rule instanceof CSSFontFaceRule ||
		rule instanceof CSSPageRule ||
		rule instanceof CSSNamespaceRule ||
		rule instanceof CSSKeyframesRule ||
		rule instanceof CSSCounterStyleRule ||
		rule instanceof CSSFontFeatureValuesRule ||
		rule instanceof CSSFontPaletteValuesRule ||
		rule instanceof CSSLayerStatementRule ||
		rule instanceof CSSPropertyRule ||
		(window['CSSViewTransitionRule'] && rule instanceof CSSViewTransitionRule)
	)
		return;

	if (rule instanceof CSSStyleRule) {
		if (!rule.cssText.includes('view-transition-name')) return;
		declNamedElements(rule.style);
		// fall through to grouping rule to check nested rules
	}
	if (rule instanceof CSSGroupingRule || rule instanceof CSSStyleRule) {
		[...rule.cssRules].forEach((rule) => namedElementsOfRule(rule));
		return;
	}

	if (rule instanceof CSSNestedDeclarations) return declNamedElements(rule.style);

	if (rule instanceof CSSKeyframesRule) {
		[...rule.cssRules].forEach((frame) => namedElementsOfRule(frame, rule.name));
		return;
	}

	if (rule instanceof CSSKeyframeRule) return frameNamedElements(rule.style, keyframeName!);

	console.error('Unknown CSSRule', rule);
}

function frameNamedElements(style: CSSStyleDeclaration, keyframeName: string) {
	for (let i = 0; i < style.length; ++i) {
		if (style.item(i) === 'view-transition-name') {
			animations.add(keyframeName);
			console.log('animation', keyframeName);
		}
	}
}

function declNamedElements(style: CSSStyleDeclaration) {
	for (let i = 0; i < style.length; ++i) {
		if (style.item(i) === 'view-transition-name') return styledElements(style.parentRule);
	}
}

function styledElements(parent: CSSRule | null) {
	let selectors: string[] = ['&'];

	for (;;) {
		while (parent && !(parent instanceof CSSStyleRule || parent instanceof CSSScopeRule)) {
			parent = parent.parentRule;
		}

		if (parent) {
			selectors = collect(parent, selectors);
			parent = parent.parentRule;
			continue;
		}
		selectors.forEach((sel) => {
			let pseudoElement: string;
			const parsed = parse(sel, { context: 'selector' }) as Selector;
			if (parsed.children.last?.type === 'PseudoElementSelector') {
				pseudoElement = generate(parsed.children.last);
				pseudoElements.add(pseudoElement!);
				sel = generate(parsed).slice(0, -pseudoElement.length).trim();
			}
			[...document.querySelectorAll<HTMLElement>(sel)]
				.filter((el) => root.contains(el))
				.forEach((element) => elements.push({ element, pseudoElement }));
		});
		break;
	}
}

function collect(parent: CSSStyleRule | CSSScopeRule, selectors: string[]): string[] {
	const nested = selectors;
	selectors = [];
	if (parent instanceof CSSStyleRule) {
		splitSelectorList(parent.selectorText).forEach((sel) =>
			nested.forEach((nes) => selectors.push(nes.replaceAll(/&/g, sel)))
		);
	} else {
		const scopes = parent.start
			? splitSelectorList(parent.start)
			: [
					deriveCSSSelector(
						parent.parentStyleSheet?.ownerNode?.parentElement ?? document.documentElement
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
