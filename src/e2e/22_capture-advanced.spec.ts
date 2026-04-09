import { test, expect } from '@playwright/test';
import { openCaptureView } from './capture-test-helpers';
import { CHAMBER_CONFIG } from './chamber-config';

/**
 * Gets all group summaries including text from ::after pseudo-elements
 */
async function getGroupSummaries(captureView: any): Promise<string[]> {
	return await captureView
		.locator(CHAMBER_CONFIG.selectors.captureView.groupsContainer)
		.locator(CHAMBER_CONFIG.selectors.captureView.summary)
		.evaluateAll((elements: Element[]) => {
			return elements.map((el) => {
				const text = el.textContent || '';
				console.log('Summary textContent:', text);
				const after = window.getComputedStyle(el, '::after').content;
				const afterText = after === 'none' ? '' : after.replace(/^["']|["']$/g, '');
				// Also get ::after from strong element inside (for "(with children)" text)
				const strong = el.querySelector('strong');
				const strongAfter = strong ? window.getComputedStyle(strong, '::after').content : 'none';
				const strongAfterText =
					strongAfter === 'none' ? '' : strongAfter.replace(/^["']|["']$/g, '');
				return text + afterText + strongAfterText;
			});
		});
}

test.describe('Capture Mode: Advanced Tests (Chrome-only)', () => {
	test.beforeEach(({ browserName }) => {
		test.skip(browserName !== 'chromium', 'view-transition-group and nested groups require Chrome');
	});

	test('3.1: view-transition-group: contain', async ({ page }) => {
		const { captureView } = await openCaptureView(page, 'test-3-1', '/e2e/capture-advanced/');

		// Verify basic capture happened
		await expect(captureView).toContainText(/Same-document call/i);

		// Verify expected groups exist
		const summaries = await getGroupSummaries(captureView);

		expect(summaries.some((s) => s.includes('root'))).toBe(true);
		expect(summaries.some((s) => s.includes('hero'))).toBe(true);
		expect(summaries.some((s) => s.includes('container'))).toBe(true);
		expect(summaries.some((s) => s.includes('child'))).toBe(true);

		// Verify container has view-transition-group: contain (shown as badge)
		expect(
			summaries.some((s) => s.includes('container') && s.includes('[grouping: contain]'))
		).toBe(true);

		// Verify hierarchy - child should be nested under container
		const containerGroup = captureView
			.locator('summary')
			.filter({ hasText: /^Group container/ })
			.locator('..');
		await containerGroup.click(); // Expand if needed
		await expect(containerGroup).toContainText('Group child');
	});

	test('3.2: view-transition-group: nearest', async ({ page }) => {
		const { captureView } = await openCaptureView(page, 'test-3-2', '/e2e/capture-advanced/');

		await expect(captureView).toContainText(/Same-document call/i);

		const summaries = await getGroupSummaries(captureView);

		expect(summaries.some((s) => s.includes('root'))).toBe(true);
		expect(summaries.some((s) => s.includes('hero'))).toBe(true);
		expect(summaries.some((s) => s.includes('parent'))).toBe(true);
		expect(summaries.some((s) => s.includes('child'))).toBe(true);
		// Verify parent has view-transition-group: contain
		expect(summaries.some((s) => s.includes('parent (with children)'))).toBe(true);

		// Verify child has view-transition-group: nearest
		expect(summaries.some((s) => s.includes('child') && s.includes('[grouping: nearest]'))).toBe(
			true
		);

		// Verify hierarchy - child should be nested under parent
		const parentGroup = captureView
			.locator('summary')
			.filter({ hasText: /^Group parent/ })
			.locator('..');
		await parentGroup.click();
		await expect(parentGroup).toContainText('Group child');
	});

	test('3.3: view-transition-group: <custom-ident>', async ({ page }) => {
		const { captureView } = await openCaptureView(page, 'test-3-3', '/e2e/capture-advanced/');

		await expect(captureView).toContainText(/Same-document call/i);

		const summaries = await getGroupSummaries(captureView);

		expect(summaries.some((s) => s.includes('root'))).toBe(true);
		expect(summaries.some((s) => s.includes('hero'))).toBe(true);
		expect(summaries.some((s) => s.includes('target'))).toBe(true);
		expect(summaries.some((s) => s.includes('child'))).toBe(true);

		// Verify child has view-transition-group: target (pointing to target group)
		expect(summaries.some((s) => s.includes('child') && s.includes('[grouping: target]'))).toBe(
			true
		);

		// Verify target has view-transition-group: contain (allows children)
		expect(summaries.some((s) => s.includes('target (with children)'))).toBe(true);

		// Verify hierarchy - child should be nested under target
		const targetGroup = captureView
			.locator('summary')
			.filter({ hasText: /^Group target/ })
			.locator('..');
		await targetGroup.click();
		await expect(targetGroup).toContainText('Group child');
	});

	test('3.4: Multiple nesting levels (3+ deep)', async ({ page }) => {
		const { captureView } = await openCaptureView(page, 'test-3-4', '/e2e/capture-advanced/');

		await expect(captureView).toContainText(/Same-document call/i);

		const summaries = await getGroupSummaries(captureView);
		expect(summaries.some((s) => s.includes('root'))).toBe(true);
		expect(summaries.some((s) => s.includes('hero'))).toBe(true);
		expect(summaries.some((s) => s.includes('level1 [grouping: horschd] (with children)'))).toBe(
			true
		);
		expect(summaries.some((s) => s.includes('level2 (with children)'))).toBe(true);
		expect(summaries.some((s) => s.includes('level3 [grouping: nearest]'))).toBe(true);
		expect(summaries.some((s) => s.includes('level3b [grouping: level1]'))).toBe(true);

		// Verify nesting hierarchy: level1 contains level2, level2 contains level3
		const level1Group = captureView
			.locator('summary')
			.filter({ hasText: /^Group level1/ })
			.locator('..');
		await level1Group.click();
		await expect(level1Group).toContainText('Group level2');
		await expect(level1Group).toContainText('Group level3b');

		const level2Group = level1Group
			.locator('summary')
			.filter({ hasText: /^Group level2/ })
			.locator('..');
		await level2Group.click();
		await expect(level2Group).toContainText('Group level3');
	});

	test.skip('3.6: view-transition-scope: auto (hides descendants)', async ({ page }) => {
		page.on('console', (msg) => {
			console.log('Console message:', msg.text());
		});
		const { captureView } = await openCaptureView(page, 'test-3-6', '/e2e/capture-advanced/');

		await expect(captureView).toContainText(/Same-document call/i);

		const summaries = await getGroupSummaries(captureView);

		expect(summaries.length).toBe(2);
		expect(summaries.some((s) => s.includes('root'))).toBe(true);
		expect(summaries.some((s) => s.includes('hero'))).toBe(true);

		// Verify hidden-by-scope is NOT in the summaries (hidden by scope boundary)
		expect(
			summaries.some((s) => s.includes('hidden-by-scope, hidden by view-transition-scope'))
		).toBe(true);

		const root = captureView
			.locator('summary')
			.filter({ hasText: /^Group root/ })
			.locator('..');
		await root.click();
		await expect(root).toContainText('Group hidden-by-scope');
	});
});
