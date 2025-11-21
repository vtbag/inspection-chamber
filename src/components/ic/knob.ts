
export function knob(id: string, name: string): string {
	return `
<div class="rotary-body" style="view-transition-name: kc-${id}; view-transition-class: knob">
	<div for="${id}" class="rotary-knob">
		<div class="knob-ring"><span class="knob-indicator"></span></div>
		<input type="range" id="${id}" name="${name}" min="0" max="500" value="0" step="1">
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
	container
		.querySelector<HTMLElement>(`.slider-fill`)
		?.style.setProperty('width', `calc(${(Number(input.value) / Number(input.max)) * 100}% + 3px)`);
}
