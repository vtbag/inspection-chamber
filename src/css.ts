import { type Selector, type SelectorList, parse, generate } from 'css-tree';
import { deriveCSSSelector } from './components/ic/element-selector';

const animations = new Set<string>();
const elements: Map<
	HTMLElement,
	{
		element: HTMLElement;
		pseudoElement: string;
		selector: string;
	}
> = new Map();
const pseudoElements = new Set<string>();
let root: HTMLElement;

export const allRoots: Set<HTMLElement> = new Set();

export function namedElements(viewTransitionRoot: HTMLElement = document.documentElement) {
	root = viewTransitionRoot;
	elements.clear();

	allRoots.forEach(
		(r) =>
			root.contains(r) &&
			!elements.has(r) &&
			elements.set(r, {
				element: r,
				pseudoElement: undefined!,
				selector: 'transitionRoot',
			})
	);
	root.querySelectorAll<HTMLElement>('[style*=view-transition-]').forEach((el) => {
		const element = el as HTMLElement;
		const viewTransitionName = element.style.viewTransitionName;
		viewTransitionName &&
			viewTransitionName !== 'none' &&
			!elements.has(el) &&
			elements.set(el, {
				element: el,
				pseudoElement: undefined!,
				selector: 'element.style',
			});
	});
	animations.clear();
	pseudoElements.clear();
	[...root.ownerDocument.styleSheets, ...root.ownerDocument.adoptedStyleSheets].forEach((sheet) =>
		namedElementsOfSheet(sheet)
	);
	return { elements, animations: [...animations], pseudoElements: [...pseudoElements] };
}

function namedElementsOfSheet(sheet: CSSStyleSheet) {
	try {
		if (sheet.disabled) return;
		[...sheet.cssRules].forEach((rule) => namedElementsOfRule(rule));
	} catch (e) {
		console.info('[inspection-chamber] Could not access (cross-origin?) stylesheet', sheet, e);
	}
}

function namedElementsOfRule(rule: CSSRule, keyframeName?: string) {
	const name = rule.constructor.name;
	if (
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

	if (name === 'CSSKeyframeRule')
		return frameNamedElements((rule as CSSKeyframeRule).style, keyframeName!);

	if ('style' in rule) {
		declNamedElements((rule as CSSStyleRule).style);
		if (name === 'CSSNestedDeclarations') return;
		// fall through to grouping rule to check nested rules
	}
	if ('cssRules' in rule) {
		[...(rule as CSSGroupingRule).cssRules].forEach((rule) => namedElementsOfRule(rule));
		return;
	}

	if (name === 'CSSKeyframesRule') {
		[...(rule as CSSKeyframesRule).cssRules].forEach((frame) =>
			namedElementsOfRule(frame, (rule as CSSKeyframesRule).name)
		);
		return;
	}

	console.error('[inspection-chamber] Unknown CSSRule', rule);
}

function frameNamedElements(style: CSSStyleDeclaration, keyframeName: string) {
	for (let i = 0; i < style.length; ++i) {
		if (style.item(i).startsWith('view-transition-')) {
			animations.add(keyframeName);
			console.warn('[inspection-chamber] animation', keyframeName);
		}
	}
}

function declNamedElements(style: CSSStyleDeclaration) {
	for (let i = 0; i < style.length; ++i) {
		if (style.item(i) === 'view-transition-name') return selectedElements(style.parentRule);
	}
}

function selectedElements(parent: CSSRule | null) {
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
				.forEach(
					(element) =>
						elements.has(element) ||
						elements.set(element, { element, pseudoElement, selector: original })
				);
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
