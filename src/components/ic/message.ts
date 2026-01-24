export function message(
	severity: 'error' | 'warning' | 'info',
	message: string,
	references?: any[]
) {
	parent.__vtbag.ic2?.chamberWindow?.document.dispatchEvent(
		new CustomEvent('ic-show-message', { detail: { severity, message, references } })
	);
}
