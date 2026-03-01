/**
 * Centralized configuration for Inspection Chamber test selectors and timeouts.
 * Single source of truth for DOM queries and timing constants.
 */

export const CHAMBER_CONFIG = {
	/**
	 * DOM Selectors for chamber UI elements
	 */
	selectors: {
		// Test page frame (the actual test content)
		testFrame: {
			index: 1,
			description: 'iframe containing test page content',
		},

		// Inspection chamber iframe
		chamberFrame: {
			index: 0,
			description: 'iframe containing inspection chamber',
		},

		// Window controls
		window: {
			resizeHandle: '.window .resize-handle.edge.s',
			description: 'South resize handle of the window',
		},

		// Chamber UI elements
		chamber: {
			welcomePanel: 'vtbag-ic-welcome details',
			welcome: {
				summary: 'summary',
				description: 'Welcome panel details element',
			},

			captureCheckbox: '#capture',
			captureCheckboxDescription: 'Checkbox to enable capture mode',

			viewTransitionCapture: 'vtbag-ic-view-transition-capture',
			vtcDescription: 'View transition capture display element',
		},

		// Capture view elements
		captureView: {
			summary: 'summary',
			summaryDescription: 'Header summary of capture view',

			groupsContainer: '.content > details',
			groupsDescription: 'Container for captured group details',

			devtoolsButton: 'summary .devtools',
			devtoolsDescription: 'Button to print capture to devtools console',
		},
	},

	/**
	 * Timing constants (in milliseconds)
	 */
	timeouts: {
		// Long tap duration (press and hold)
		longTap: 1000,
		longTapDescription: 'Duration of long-tap on resize handle (ms)',

		// Delay after long-tap to allow animation/state settling
		afterLongTap: 500,
		afterLongTapDescription: 'Delay after long-tap to settle state (ms)',

		// Timeout for capture view to appear
		captureView: 10000,
		captureViewDescription: 'Max time to wait for capture view to appear (ms)',

		// Console event wait timeout
		consoleEvent: 5000,
		consoleEventDescription: 'Max time to wait for console event (ms)',
	},

	/**
	 * Console event predicates
	 */
	console: {
		inspectionChamberMarker: '[inspection chamber]',
		viewTransitionMarker: 'View transition on',
		startedAtPattern: 'was started at',
		codeLocationPattern: 'from this code location',
		elementsCapturedPattern: 'It captured the following elements',
	},
} as const;

/**
 * Helper to get selector by path
 * @example getSelectorPath('chamber', 'captureCheckbox')
 */
export function getSelectorPath(...path: string[]): string {
	let current: any = CHAMBER_CONFIG.selectors;
	for (const segment of path) {
		if (segment in current) {
			current = current[segment];
		}
	}
	if (typeof current === 'string') {
		return current;
	}
	throw new Error(`Selector path not found: ${path.join('.')}`);
}

/**
 * Helper to get timeout value
 * @example getTimeout('longTap')
 */
export function getTimeout(key: keyof typeof CHAMBER_CONFIG.timeouts): number {
	const value = CHAMBER_CONFIG.timeouts[key];
	return typeof value === 'number' ? value : 0;
}

export type ChamberConfig = typeof CHAMBER_CONFIG;
