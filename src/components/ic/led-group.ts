export type LEDs = {
	className: string;
	groupName: string;
	checked: string;
	alternatives: {
		id: string;
		value: String;
		label: String;
	}[];
	independent?: boolean;
};
export function ledGroup(leds: LEDs) {
	return `
	<div class="input-led-group ${leds.className}" style="display: grid; view-transition-name:ilg-${leds.groupName};	 --vtc: led-group">
		<div class="led-group-glass-pane" style="grid-area: 1 / 1; outline: 6px dotted light-dark(#fff8,#0008);background-color:light-dark(#fff8,#0008);"></div>
		<div style="grid-area: 1 / 1">
		${leds.alternatives
			.map(
				(alt, idx) => `
			<div class="input-led-item">
				<input type="${leds.independent ? 'checkbox' : 'radio'}" name="${leds.groupName}" value="${alt.value}" id="${alt.id}" ${leds.checked === alt.value ? 'checked' : ''}>
				<label for="${alt.id}">
					<span class="led" style="--vtn:lil-${leds.groupName}-${idx}"></span>
            <span class="radio-text" style="--vtn:lit-${leds.groupName}-${idx}">${alt.label}</span>
				</label>
			</div>`
			)
			.join('')}
		</div>
	</div>`;
}

export function disableLedGroup(element: HTMLElement, text: string) {
	const glass = element.querySelector<HTMLDivElement>('.led-group-glass-pane')!;
	glass.style.zIndex = '1';
	glass.addEventListener('click', () =>
		document.dispatchEvent(new CustomEvent('ic-show-message', { detail: text }))
	);
}
export function enableLedGroup(element: HTMLElement) {
	const glass = element.querySelector<HTMLDivElement>('.led-group-glass-pane')!;
	glass.style.zIndex = '';
}

export function hideLedGroup(element: HTMLElement) {
	element.style.display = 'none';
}
export function showLedGroup(element: HTMLElement) {
	element.style.display = 'grid';
}
