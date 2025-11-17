export type LEDs = {
	className: string;
	groupName: string;
	checked: string;
	alternatives: {
		id: string;
		value: String;
		label: String;
	}[];
};
export function slider(id: string, name: string): string {
	return `
<div class="horizontal-slider-container" style="view-transition-name: hsc-${id}">
	<div class="slider-track">
		<div class="slider-fill"></div>
		<input type="range" id="${id}" name="${name}" min="0" max="500" value="0" step="1">
	</div>
	<div class="slider-value">
		<div class="min">0ms</div><div class="current">0ms</div><div class="max">500ms</div>
	</div>
</div>`;
}
export function setMaxValue(id: string, max: number, now: number, onInput: (event: Event) => void) {
	const input = document.querySelector<HTMLInputElement>(`#${id}`);
	input!.max = '' + max;
	input!.value = '' + now;
	const container = document.querySelector<HTMLElement>(`.horizontal-slider-container:has(#${id}`)!;
	container.querySelector<HTMLElement>(`.slider-value .max`)!.innerText = `${max}ms`;
	const fill = container.querySelector<HTMLElement>(`.slider-fill`);
	const current = container.querySelector<HTMLElement>(`.slider-value .current`)!;
	current.innerText = `${input!.value}ms`;

	input?.addEventListener('input', (e) => {
		fill?.style.setProperty(
			'width',
			`calc(${(Number(input.value) / Number(input.max)) * 100}% + 3px)`
		);
		current.innerText = `${input.value}ms`;
		onInput(e);
	});
}

export function setCurrentValue(id: string, current: number) {
	const input = document.querySelector<HTMLInputElement>(`#${id}`)!;
	const container = document.querySelector<HTMLElement>(`.horizontal-slider-container:has(#${id}`)!;
	input.value = '' + current;
	container.querySelector<HTMLElement>(`.slider-value .current`)!.innerText = `${input.value}ms`;
	container.querySelector<HTMLElement>(`.slider-fill`)?.style.setProperty(
		'width',
		`calc(${(Number(input.value) / Number(input.max)) * 100}% + 3px)`
	);
}
