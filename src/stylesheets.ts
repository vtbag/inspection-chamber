function walkSheets(sheets: CSSStyleSheet[], withStyleRule: (rule: CSSStyleRule) => void) {
	sheets.forEach((sheet) => {
		try {
			walkRules([...sheet.cssRules], withStyleRule);
		} catch (e) {
			// silent catch
		}
	});
}

function walkRules(rules: CSSRule[], withStyleRule: (rule: CSSStyleRule) => void) {
	rules.forEach((rule) => {
		if (rule.constructor.name === 'CSSStyleRule') {
			withStyleRule(rule as CSSStyleRule);
		} else if ('cssRules' in rule) {
			walkRules([...(rule.cssRules as CSSRuleList)], withStyleRule);
		} else if ('styleSheet' in rule) {
			walkSheets([rule.styleSheet as CSSStyleSheet], withStyleRule);
		}
	});
}

export function setTransitionNames() {
	const elementNames = new Map<HTMLElement, string>();
	const doc = top!.__vtbag.inspectionChamber!.frameDocument!;
	setName(doc.documentElement, 'root');

	walkSheets([...doc.styleSheets], (rule) => {
		const name = rule.style.getPropertyValue('view-transition-name');
		if (name) {
			doc.querySelectorAll<HTMLElement>(rule.selectorText).forEach((e) => setName(e, name));
		}
	});

	doc
		.querySelectorAll<HTMLElement>('[style*="view-transition-name"')
		.forEach((el) => setName(el, el.style.viewTransitionName));

	const nameSet = new Set(elementNames.values());
	nameSet.delete('none');
	return nameSet;

	function setName(el: HTMLElement, name: string) {
		if (name == 'none') {
			el.removeAttribute("data-vtbag-transition-name");
		} else {
			el.dataset.vtbagTransitionName = name;
		}
		elementNames.set(el, name);
	}
}
