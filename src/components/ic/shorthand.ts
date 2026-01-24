export interface Property {
	key: string;
	value: string;
	defaultValue: string;
	priority: string;
}

export function shorthands(properties: Property[]) {
	const map = new Map(properties.map(({ key, value }) => [key, value]));
	const out = new Map(map);

	const sides = ['top', 'right', 'bottom', 'left'];
	function makeShorthand(vals: (string | undefined)[]) {
		if (vals.every((v) => v === vals[0])) return vals[0] as string;
		if (vals[0] === vals[2] && vals[1] === vals[3]) return `${vals[0]} ${vals[1]}`;
		if (vals[1] === vals[3]) return `${vals[0]} ${vals[1]} ${vals[2]}`;
		return vals.join(' ');
	}

	function collapseGroup(keys: string[], outKey: string) {
		if (!keys.every((k) => map.has(k))) return;
		const vals = keys.map((k) => map.get(k)!);
		out.set(outKey, makeShorthand(vals));
		keys.forEach((k) => out.delete(k));
	}

	collapseGroup(
		sides.map((s) => `margin-${s}`),
		'margin'
	);
	collapseGroup(
		sides.map((s) => `padding-${s}`),
		'padding'
	);

	['color', 'width', 'style'].forEach((part) => {
		collapseGroup(
			sides.map((s) => `border-${s}-${part}`),
			`border-${part}`
		);
	});

	collapseGroup(
		[
			`border-top-left-radius`,
			`border-top-right-radius`,
			`border-bottom-right-radius`,
			`border-bottom-left-radius`,
		],
		'border-radius'
	);

	return [...out.entries()].map(([k, v]) => ({ key: k, value: v }));
}
