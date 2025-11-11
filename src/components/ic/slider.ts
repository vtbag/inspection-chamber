
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
	<div class="horizontal-slider-container">
	<div class="slider-track">
		<input type="range" id="${id}" name="${name}" min="0" max="500" value="0" step="1">
		<div class="slider-fill"></div>
	</div>
	<div class="slider-value">
		<div class="min">0ms</div><div class="current">0ms</div><div class="max">500ms</div>
	</div>
	</div>`;
}
export function setMaxValue(id: string, max: number,onInput: (event: Event) => void) {
	const input = document.querySelector<HTMLInputElement>(`#${id}`);
	input!.max = ""+max;
	document.querySelector<HTMLElement>(`.horizontal-slider-container:has(#${id}) .slider-value .max`)!.innerText = `${max}ms`;
	const current = document.querySelector<HTMLElement>(`.horizontal-slider-container:has(#${id}) .slider-value .current`)!;
	input?.addEventListener('input', (e)=>{
		current.innerText = `${input.value}ms`;
		onInput(e);
	})
}