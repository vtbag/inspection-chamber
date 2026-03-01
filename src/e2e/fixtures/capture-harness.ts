/**
 * Shared Playwright fixtures and helpers for capture/animation testing.
 * Consolidates duplicate setup logic from capture-test-helpers and same-page.spec.
 *
 * TESTING GUIDELINE: Radio buttons and checkboxes
 * ================================================
 * Always interact with form inputs via their associated <label> elements, never the <input> directly.
 * This prevents Firefox pointer interception issues where child elements in labels block clicks on inputs.
 * Pattern: locator('label[for="input-id"]').click() ✓  NOT  locator('#input-id').click() ✗
 */

import { expect, type FrameLocator, type Locator, type Page } from '@playwright/test';
import { CHAMBER_CONFIG, getTimeout } from '../chamber-config';
/**
 * Perform a long tap (press and hold) on a locator.
 * Used to trigger chamber docking and mode transitions.
 *
 * @param locator - Element to long-tap
 * @param page - Page context for mouse events
 * @param holdMs - Duration to hold in milliseconds (default: from config)
 */
export async function longTap(
	locator: Locator,
	page: Page,
	holdMs: number = getTimeout('longTap')
): Promise<void> {
	const box = await locator.boundingBox();
	if (!box) throw new Error('Could not get bounding box for long-tap');
	const centerX = box.x + box.width / 2;
	const centerY = box.y + box.height / 2;

	await page.mouse.move(centerX, centerY);
	await page.mouse.down();
	await page.waitForTimeout(holdMs);
	await page.mouse.up();
}

/**
 * Options for setting up test frames.
 */
export interface SetupFramesOptions {
	/** URL path to navigate to (e.g., '/e2e/capture-basic/') */
	url: string;
	/** Wait condition for page load */
	waitUntil?: 'load' | 'commit' | 'domcontentloaded';
	/** Whether to auto-long-tap the resize handle to open chamber */
	openChamber?: boolean;
	/** Selector for resize handle (default: from config) */
	resizeHandleSelector?: string;
	/** Index of test frame iframe (default: from config) */
	testFrameIndex?: number;
	/** Index of chamber frame iframe (default: from config) */
	chamberFrameIndex?: number;
}

/**
 * Return value from frame setup.
 */
export interface FrameHandles {
	frame: FrameLocator;
	chamberFrame: FrameLocator;
	page: Page;
}

/**
 * Set up test and chamber frames by navigating to a page and opening chamber.
 *
 * @param page - Playwright page
 * @param options - Setup options
 * @returns Frame locators and page context
 *
 * @example
 * const { frame, chamberFrame } = await setupFrames(page, {
 *   url: '/e2e/capture-basic/',
 *   openChamber: true
 * });
 */
export async function setupFrames(page: Page, options: SetupFramesOptions): Promise<FrameHandles> {
	const {
		url,
		waitUntil = 'commit', // Use 'commit' to handle IC's document.open() via requestIdleCallback
		openChamber = true,
		resizeHandleSelector = CHAMBER_CONFIG.selectors.window.resizeHandle,
		testFrameIndex = CHAMBER_CONFIG.selectors.testFrame.index,
		chamberFrameIndex = CHAMBER_CONFIG.selectors.chamberFrame.index,
	} = options;

	await page.goto(url, { waitUntil });

	// Long-tap resize handle to open chamber (if requested)
	if (openChamber) {
		const resizeHandle = page.locator(resizeHandleSelector).first();
		await expect(resizeHandle).toBeVisible();
		await longTap(resizeHandle, page);
		await page.waitForTimeout(getTimeout('afterLongTap'));
	}

	// Get test frame (contains test content)
	const frameLocator = page.locator('iframe').nth(testFrameIndex);
	await expect(frameLocator).toBeVisible();
	const frame = frameLocator.contentFrame();
	if (!frame) throw new Error(`Test frame not found at index ${testFrameIndex}`);

	// Get chamber frame (contains inspection chamber UI)
	const chamberFrameLocator = page.locator('iframe').nth(chamberFrameIndex);
	await expect(chamberFrameLocator).toBeVisible();
	const chamberFrame = chamberFrameLocator.contentFrame();
	if (!chamberFrame) throw new Error(`Chamber frame not found at index ${chamberFrameIndex}`);

	return { frame, chamberFrame, page };
}

/**
 * Close the welcome panel in chamber if it's open.
 *
 * @param chamberFrame - Chamber frame locator
 */
export async function closeWelcomePanelIfOpen(chamberFrame: FrameLocator): Promise<void> {
	const welcomeDetails = chamberFrame
		.locator(CHAMBER_CONFIG.selectors.chamber.welcomePanel)
		.first();

	if ((await welcomeDetails.count()) === 0) {
		return;
	}

	// Wait for the summary to be visible and ready to click
	const summary = welcomeDetails.locator(CHAMBER_CONFIG.selectors.chamber.welcome.summary).first();
	await expect(summary).toBeVisible({ timeout: 5000 });
	
	// Click to close and wait for the details to actually close
	await summary.click();
	await expect(welcomeDetails).toHaveJSProperty('open', false, { timeout: 5000 });
}

/**
 * Enable or ensure capture mode is enabled in the chamber.
 *
 * @param chamberFrame - Chamber frame locator
 */
export async function ensureCaptureModeEnabled(chamberFrame: FrameLocator): Promise<void> {
	const captureCheckbox = chamberFrame.locator(CHAMBER_CONFIG.selectors.chamber.captureCheckbox);
	await expect
		.poll(async () => captureCheckbox.count(), { timeout: getTimeout('captureView') })
		.toBeGreaterThan(0);

	if (await captureCheckbox.isChecked()) {
		return;
	}

	// IMPORTANT: Always click labels, not inputs, for radio/checkbox interactions.
	// Reason: In Firefox, child elements (like <span class="radio-text">) inside the label
	// can intercept pointer events, causing clicks on the input to fail with "subtree intercepts".
	// The DOM structure is: <input id="X"> <label for="X"><span>...</span></label>
	// Clicking the label reliably toggles the associated input across all browsers.
	const captureLabel = chamberFrame.locator('label[for="capture"]');
	await expect(captureLabel).toBeVisible({ timeout: 5000 });
	await captureLabel.click();
	await expect(captureCheckbox).toBeChecked();
}

/**
 * Wait for the capture view to become visible.
 *
 * @param chamberFrame - Chamber frame locator
 * @returns Locator for the visible capture view
 */
export async function waitForCaptureView(chamberFrame: FrameLocator): Promise<Locator> {
	const captureView = chamberFrame.locator(CHAMBER_CONFIG.selectors.chamber.viewTransitionCapture);
	await expect(captureView).toBeVisible({ timeout: getTimeout('captureView') });
	return captureView;
}

/**
 * Open the capture view by:
 * 1. Setting up frames if not already done
 * 2. Closing welcome panel
 * 3. Enabling capture mode
 * 4. Waiting for capture view to appear
 *
 * @param page - Playwright page
 * @param options - Combined setup and capture options
 * @returns FrameHandles and visible capture view locator
 *
 * @example
 * const { frame, chamberFrame, captureView } = await openCaptureView(page, {
 *   url: '/e2e/same-page/',
 *   openChamber: true
 * });
 */
export async function openCaptureView(
	page: Page,
	options: SetupFramesOptions & { skipFrameSetup?: boolean }
): Promise<FrameHandles & { captureView: Locator }> {
	// Setup frames if not already done
	const handles = options.skipFrameSetup
		? (() => {
				const testFrame = page.locator('iframe').nth(options.testFrameIndex ?? 1).contentFrame();
				const chamberFrame = page.locator('iframe').nth(options.chamberFrameIndex ?? 0).contentFrame();
				if (!testFrame || !chamberFrame) throw new Error('Frames not available');
				return { frame: testFrame, chamberFrame, page };
			})()
		: await setupFrames(page, options);

	const { frame, chamberFrame } = handles;

	// Prepare chamber UI
	await closeWelcomePanelIfOpen(chamberFrame);
	await ensureCaptureModeEnabled(chamberFrame);

	// Wait for capture view
	const captureView = await waitForCaptureView(chamberFrame);

	return { frame, chamberFrame, captureView, page };
}

/**
 * Wait for a condition to become true with polling and timeout.
 *
 * @param page - Playwright page
 * @param condition - Async condition to poll
 * @param timeout - Timeout in milliseconds
 * @param errorMessage - Error message if condition times out
 */
export async function waitForCondition(
	page: Page,
	condition: () => Promise<boolean>,
	timeout: number = 3000,
	errorMessage: string = 'Timed out waiting for condition'
): Promise<void> {
	const startedAt = Date.now();
	const retryIntervalMs = 50;

	while (Date.now() - startedAt < timeout) {
		if (await condition()) return;
		await page.waitForTimeout(retryIntervalMs);
	}
	throw new Error(errorMessage);
}
