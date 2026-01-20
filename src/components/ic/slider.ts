export function slider(id: string, name: string): string {
	return `
<div class="horizontal-slider-container" style="view-transition-name: hsc-${id}; --vtc: slider">
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
	const container = input?.closest('.horizontal-slider-container') as HTMLElement;
	container.querySelector<HTMLElement>(`.slider-value .max`)!.innerText = `${max}ms`;

	set(input!, now, container);
	input?.addEventListener('input', (e) => {
		set(input, parseInt(input.value, 10), container);
		onInput(e);
	});
}

export function setCurrentValue(id: string, value: number) {
	const input = document.querySelector<HTMLInputElement>(`#${id}`);
	const container = input?.closest('.horizontal-slider-container') as HTMLElement;
	if (input && container) {
		set(input, value, container);
	}
}

function set(input: HTMLInputElement, value: number, container: HTMLElement) {
	const fill = container.querySelector<HTMLElement>(`.slider-fill`);
	const current = container.querySelector<HTMLElement>(`.slider-value .current`)!;
	input.value = '' + value;
	fill?.style.setProperty(
		'width',
		`calc(${(value / Number(input.max)) * 100}% + 3px)`
	);
	current.innerText = `${value}ms`;
}