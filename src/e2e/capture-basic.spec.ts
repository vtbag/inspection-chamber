import { test, expect } from '@playwright/test';
import { runCaptureTest } from './capture-test-helpers';
import { captureTestConfig } from './capture-test-config';

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
});
