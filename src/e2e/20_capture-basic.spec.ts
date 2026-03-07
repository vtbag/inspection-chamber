import { test, expect } from '@playwright/test';
import { runCaptureTest, openCaptureView, clickCheck } from './capture-test-helpers';
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
	test('1.1 Freeze: Basic capture with single named element', async ({ page }) => {
		const { chamberFrame, testFrame } = await runCaptureTest(page, {
			testType: 'test-1-1',
			beforeTriggerClicks: ['label[for="freeze-types"]'],
			header: { selector: ':root' },
			imageSelectors: [':root', '#hero'],
			config: captureTestConfig().group('root').done().group('hero').done().build(),
		});

		const messageComponent = chamberFrame.locator('vtbag-ic-message');
		await expect(messageComponent).toBeVisible();
		const messages = messageComponent.locator('.message');
		await expect(messages).toHaveCount(1);
		const firstMessage = messages.nth(0);
		await expect(firstMessage).toContainText(/Don't forget to resume them when done/i);

		const clearButton = firstMessage.locator('button.clear');
		await expect(clearButton).toBeVisible();
		await clearButton.click();
		await expect(messages).toHaveCount(0);

		const viewTransition = await testFrame
			.locator(':root')
			.evaluate((element) => !!element.ownerDocument.activeViewTransition);
		expect(viewTransition).not.toBeNull();

		await clickCheck(chamberFrame, chamberFrame.locator('label[for="freeze-types"]'), false);
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

	test('1.2 old-only: Old-only element (click old-only before transition)', async ({ page }) => {
		await runCaptureTest(page, {
			testType: 'test-1-2',
			beforeTriggerClicks: [{ selector: 'label[for="old-only"]', frame: 'chamber' }],
			header: { selector: ':root' },
			textAssertions: [
				{ pattern: /old image element: #old-only/i, present: true },
				{ pattern: /new image element:/i, present: false },
			],
			config: captureTestConfig()
				.group('root')
				.oldOnly()
				.done()
				.group('hero')
				.oldOnly()
				.done()
				.group('old-only-element')
				.oldOnly()
				.done()
				.build(),
		});
	});

	test('1.2 old-only + freeze: Old-only element (click old-only before transition)', async ({
		page,
	}) => {
		const { chamberFrame, testFrame } = await runCaptureTest(page, {
			testType: 'test-1-2',
			beforeTriggerClicks: ['label[for="old-only"]', 'label[for="freeze-types"]'],
			header: { selector: ':root' },
			textAssertions: [
				{ pattern: /old image element: #old-only/i, present: true },
				{ pattern: /new image element:/i, present: false },
			],
			config: captureTestConfig()
				.group('root')
				.oldOnly()
				.done()
				.group('hero')
				.oldOnly()
				.done()
				.group('old-only-element')
				.oldOnly()
				.done()
				.build(),
		});

		const messageComponent = chamberFrame.locator('vtbag-ic-message');
		const messages = messageComponent.locator('.message');
		const firstMessage = messages.nth(0);
		const clearButton = firstMessage.locator('button.clear');
		await clearButton.click();
		await expect(messages).toHaveCount(0);

		const viewTransition = await testFrame
			.locator(':root')
			.evaluate((element) => !!element.ownerDocument.activeViewTransition);
		expect(viewTransition).not.toBeNull();

		await clickCheck(chamberFrame, chamberFrame.locator('label[for="freeze-types"]'), false);
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

	test('1.3 old-only: New-only element (created in new state)', async ({ page }) => {
		await runCaptureTest(page, {
			testType: 'test-1-3',
			beforeTriggerClicks: [{ selector: 'label[for="old-only"]', frame: 'chamber' }],
			header: { selector: ':root' },
			textAssertions: [
				{ pattern: /old image element: #new-only/i, present: false },
				{ pattern: /new image element: #new-only/i, present: false },
			],
			config: captureTestConfig()
				.group('root')
				.oldOnly()
				.done()
				.group('hero')
				.oldOnly()
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

		const summaries = await captureView
			.locator(CHAMBER_CONFIG.selectors.captureView.groupsContainer)
			.locator(CHAMBER_CONFIG.selectors.captureView.summary)
			.allTextContents();

		expect(summaries).toContain('Group before-pseudo');
		expect(summaries).toContain('Group after-pseudo');
		const beforeIndex = summaries.findIndex((s) => s.includes('before-pseudo'));
		const afterIndex = summaries.findIndex((s) => s.includes('after-pseudo'));
		expect(beforeIndex).toBeLessThan(afterIndex);

		expect(summaries).toContain('Group root');
		expect(summaries).toContain('Group hero');
	});

	test('1.8: Duplicate view-transition-name Detection', async ({ page }) => {
		const { captureView, chamberFrame } = await openCaptureView(page, 'test-1-8');
		await expect(captureView).toContainText(/Same-document call/i);
		await expect(captureView).toContainText('Group duplicate');
		await expect(captureView).toContainText('old image element: #duplicate-a');
		await expect(captureView).toContainText('old-duplicates image element: #duplicate-b');
		const messageComponent = chamberFrame.locator('vtbag-ic-message');
		await expect(messageComponent).toBeVisible();
		const messages = messageComponent.locator('.message');
		await expect(messages).toHaveCount(2);
		const firstMessage = messages.nth(0);
		await expect(firstMessage).toContainText(/InvalidStateError/i);
		const secondMessage = messages.nth(1);
		await expect(secondMessage).toContainText(/duplicate.*name/i);

		const clearButton = firstMessage.locator('button.clear');
		await expect(clearButton).toBeVisible();
		await clearButton.click();
		await expect(messages).toHaveCount(1);

		const clearAllButton = messageComponent.locator('button.clear-all');
		await expect(clearAllButton).toBeVisible();
		await clearAllButton.click();
		await expect(messages).toHaveCount(0);
		await expect(messageComponent).toHaveCSS('display', 'none');
	});

	test('4.5: CSS escape sequences in view-transition-name', async ({ page }) => {
		const { captureView } = await openCaptureView(page, 'test-4-5');

		await expect(captureView).toContainText(/Same-document call/i);

		// Get all group summaries
		const summaries = await captureView
			.locator(CHAMBER_CONFIG.selectors.captureView.groupsContainer)
			.locator(CHAMBER_CONFIG.selectors.captureView.summary)
			.allTextContents();

		// Verify root and hero groups exist
		expect(summaries.some((s) => s.includes('root'))).toBe(true);
		expect(summaries.some((s) => s.includes('hero'))).toBe(true);

		// Verify the escaped name is unescaped correctly and displays as "!important"
		expect(summaries.some((s) => s.includes('!important'))).toBe(true);
	});
});
