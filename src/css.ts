import { type Selector, type SelectorList, parse, generate } from 'css-tree';
import { deriveCSSSelector } from './components/ic/element-selector';

const animations = new Set<string>();
const elements: {
	element: HTMLElement;
	pseudoElement: string;
	selector: string;
	property: string;
	value: string;
}[] = [];
const pseudoElements = new Set<string>();
let root: HTMLElement;

export const allRoots: Set<HTMLElement> = new Set();

export function namedElements(viewTransitionRoot: HTMLElement = document.documentElement) {
	root = viewTransitionRoot;
	elements.length = 0;

	allRoots.forEach(
		(r) =>
			root.contains(r) &&
			elements.push({
				element: r,
				pseudoElement: undefined!,
				selector: 'transitionRoot',
				property: 'view-transition-name',
				value: 'root',
			})
	);
	root.querySelectorAll<HTMLElement>('[style*=view-transition-]').forEach((el) => {
		const element = el as HTMLElement;
		const viewTransitionName = element.style.viewTransitionName;
		const viewTransitionClass = element.style.viewTransitionClass;
		const viewTransitionGroup = element.style.viewTransitionGroup;
		viewTransitionName !== 'none' && elements.push({
			element: el,
			pseudoElement: undefined!,
			selector: 'element.style',
			property: 'view-transition-name',
			value: viewTransitionName,
		});
		viewTransitionClass && elements.push({
			element: el,
			pseudoElement: undefined!,
			selector: 'element.style',
			property: 'view-transition-class',
			value: viewTransitionClass,
		});
		viewTransitionGroup && elements.push({
			element: el,
			pseudoElement: undefined!,
			selector: 'element.style',
			property: 'view-transition-group',
			value: viewTransitionGroup,
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

	if (name === 'CSSStyleRule') {
		if (!rule.cssText.includes('view-transition-')) return;
		declNamedElements((rule as CSSStyleRule).style);
		// fall through to grouping rule to check nested rules
	}
	if (
		name === 'CSSMediaRule' ||
		name === 'CSSupportsRule' ||
		name === 'CSScontainerRule' ||
		name === 'CSSStyleRule'
	) {
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
		if (style.item(i).startsWith('view-transition-'))
			return styledElements(style.parentRule, style.item(i), style[style.item(i) as any]);
	}
}

function styledElements(parent: CSSRule | null, property: string, value: string) {
	let selectors: string[] = ['&'];

	for (; ;) {
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
				.forEach((element) =>
					elements.push({ element, pseudoElement, selector: original, property, value })
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
