import { test, expect } from '@playwright/test';
import { openCaptureView } from './capture-test-helpers';
import { CHAMBER_CONFIG } from './chamber-config';

test.describe('Capture Mode: Properties Tests', () => {
	test('2.1: view-transition-name: auto (with ID)', async ({ page, browserName }) => {
		test.skip(browserName !== 'webkit', 'Only runs on webkit');
		const { captureView } = await openCaptureView(page, 'test-2-1', '/e2e/capture-properties/');
		const summaries = await captureView
			.locator(CHAMBER_CONFIG.selectors.captureView.groupsContainer)
			.locator(CHAMBER_CONFIG.selectors.captureView.summary)
			.allTextContents();
		expect(summaries).toContain('Group root');
		expect(summaries).toContain('Group hero');
		await expect(captureView).toContainText(/image element:.*#my-element/i);
	});

	test('2.2: view-transition-name: auto (without ID)', async ({ page, browserName }) => {
		test.skip(browserName !== 'webkit', 'Only runs on webkit');
		const { captureView } = await openCaptureView(page, 'test-2-2', '/e2e/capture-properties/');
		const summaries = await captureView
			.locator(CHAMBER_CONFIG.selectors.captureView.groupsContainer)
			.locator(CHAMBER_CONFIG.selectors.captureView.summary)
			.allTextContents();
		expect(summaries).toContain('Group root');
		expect(summaries).toContain('Group hero');
		await expect(captureView).toContainText(/group auto/i);
	});

	test('2.3: view-transition-name: match-element', async ({ page }) => {
		const { captureView } = await openCaptureView(page, 'test-2-3', '/e2e/capture-properties/');

		// Get all groups
		const summaries = await captureView
			.locator(CHAMBER_CONFIG.selectors.captureView.groupsContainer)
			.locator(CHAMBER_CONFIG.selectors.captureView.summary)
			.allTextContents();
		expect(summaries.length).toBe(3);
		expect(summaries).toContain('Group root');
		expect(summaries).toContain('Group hero');
		const matchGroup = summaries.find((s) => !s.includes('root') && !s.includes('hero'));
		expect(matchGroup).toBeTruthy();
		await expect(captureView).toContainText(/group match-element/i);
		await expect(captureView).toContainText(/old image element:.*#match-elem/i);
		await expect(captureView).toContainText(/old image element:.*#match-elem/i);
	});

	test('2.4: Single view-transition-class', async ({ page }) => {
		const { captureView } = await openCaptureView(page, 'test-2-4', '/e2e/capture-properties/');
		await expect(captureView).toContainText('Group box');
		await expect(captureView).toContainText(/Group\s+box\s+\[classes:\s*card\]/i);
	});

	test('2.5: Multiple view-transition-class', async ({ page }) => {
		const { captureView } = await openCaptureView(page, 'test-2-5', '/e2e/capture-properties/');
		await expect(captureView).toContainText('Group box');
		await expect(captureView).toContainText(/Group\s+box\s+\[classes:\s*card primary featured\]/i);
	});

	test('2.6: view-transition-class Priority (New over Old)', async ({ page }) => {
		const { captureView } = await openCaptureView(page, 'test-2-6', '/e2e/capture-properties/');
		await expect(captureView).toContainText('Group elem');
		await expect(captureView).toContainText(/Group\s+elem\s+\[classes:\s*new-class\]/i);
	});
});
