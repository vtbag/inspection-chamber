import { test, expect } from '@playwright/test';
import { runCaptureTest, openCaptureView } from './capture-test-helpers';
import { captureTestConfig } from './capture-test-config';
import { CHAMBER_CONFIG } from './chamber-config';

test.describe('Capture Mode: Basic Tests', () => {
	test('1.1: Basic capture with single named element', async ({ page }) => {
		await runCaptureTest(page, {
			testType: 'test-1-1',
			header: { selector: ':root' },
			imageSelectors: [':root', '#hero'],
			config: captureTestConfig().group('root').done().group('hero').done().build(),
		});
	});

	test('1.2: Old-only element (hidden in new state)', async ({ page }) => {
		await runCaptureTest(page, {
			testType: 'test-1-2',
			header: { selector: ':root' },
			imageSelectors: [':root', '#hero'],
			textAssertions: [
				{ pattern: /old image element: #old-only/i, present: true },
				{ pattern: /new image element: #old-only/i, present: false },
			],
			config: captureTestConfig()
				.group('root')
				.done()
				.group('hero')
				.done()
				.group('old-only-element')
				.oldOnly()
				.done()
				.build(),
		});
	});

	test('1.3: New-only element (created in new state)', async ({ page }) => {
		await runCaptureTest(page, {
			testType: 'test-1-3',
			header: { selector: ':root' },
			imageSelectors: [':root', '#hero'],
			textAssertions: [
				{ pattern: /old image element: #new-only/i, present: false },
				{ pattern: /new image element: #new-only/i, present: true },
			],
			config: captureTestConfig()
				.group('root')
				.done()
				.group('hero')
				.done()
				.group('new-only-element')
				.newOnly()
				.done()
				.build(),
		});
	});

	test('1.4: Same element old and new', async ({ page }) => {
		await runCaptureTest(page, {
			testType: 'test-1-4',
			config: captureTestConfig()
				.group('root')
				.done()
				.group('hero')
				.done()
				.group('persistent-element')
				.identitySame('data-test-element', 'same')
				.done()
				.build(),
		});
	});

	test('1.5: Different elements with same name', async ({ page }) => {
		await runCaptureTest(page, {
			testType: 'test-1-5',
			config: captureTestConfig()
				.group('root')
				.done()
				.group('hero')
				.done()
				.group('shared-element')
				.identityDifferent('data-test-element', 'a', 'b')
				.done()
				.build(),
		});
	});

	test('1.6: Pseudo-element ::before with view-transition-name', async ({ page }) => {
		await runCaptureTest(page, {
			testType: 'test-1-6',
			config: captureTestConfig()
				.group('root')
				.done()
				.group('hero')
				.done()
				.group('before-pseudo')
				.pseudoElement('::before')
				.done()
				.build(),
		});
	});

	test('1.7: Pseudo-elements ::before and ::after with view-transition-name', async ({ page }) => {
		const { captureView } = await openCaptureView(page, 'test-1-7');
		
		// Verify both pseudo-elements are captured
		const summaries = await captureView
			.locator(CHAMBER_CONFIG.selectors.captureView.groupsContainer)
			.locator(CHAMBER_CONFIG.selectors.captureView.summary)
			.allTextContents();
		
		// Check that both groups exist
		expect(summaries).toContain('Group before-pseudo');
		expect(summaries).toContain('Group after-pseudo');
		
		// Verify that ::before comes before ::after in the list
		const beforeIndex = summaries.findIndex((s) => s.includes('before-pseudo'));
		const afterIndex = summaries.findIndex((s) => s.includes('after-pseudo'));
		expect(beforeIndex).toBeLessThan(afterIndex);
		
		// Verify root and hero are also present
		expect(summaries).toContain('Group root');
		expect(summaries).toContain('Group hero');
	});

	test('1.8: Duplicate view-transition-name Detection', async ({ page }) => {
		const { captureView } = await openCaptureView(page, 'test-1-8');
		
		// When duplicate view-transition-names are detected, the transition fails
		// and the chamber shows "Cross-document navigation" as a fallback
		await expect(captureView).toContainText(/Cross-document navigation|duplicate|error/i);
	});
});
