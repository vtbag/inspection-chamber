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
export function ledGroup(leds: LEDs) {
	return `
		<div class="input-led-group ${leds.className}" style="view-transition-name:ilg-${leds.groupName};	 --vtc: led-group">
		${leds.alternatives
			.map(
				(alt) => `
			<div class="input-led-item">
				<input type="radio" name="${leds.groupName}" value="${alt.value}" id="${alt.id}" ${leds.checked === alt.value ? 'checked' : ''}>
				<label for="${alt.id}">
					<span class="led"></span>
            <span class="radio-text">${alt.label}</span>
				</label>
			</div>`
			)
			.join('')}
		</div>`;
}
