import { test, expect } from '@playwright/test';
import {
	openCaptureView,
	verifyCaptureHeader,
	verifyCapturedGroups,
	verifyImageElements,
	verifyDevtoolsConsoleOutput,
} from './capture-test-helpers';

test.describe('Capture Mode: Basic Tests', () => {
	test('1.1: Basic capture with single named element', async ({ page }) => {
		const { captureView } = await openCaptureView(page, 'test-1-1');

		await verifyCaptureHeader(captureView, { selector: ':root' });
		await verifyCapturedGroups(captureView, ['root', 'hero']);
		await verifyImageElements(captureView, [':root', '#hero']);
		await verifyDevtoolsConsoleOutput(page, captureView, {
			targetTag: 'html',
			expectedGroups: ['root', 'hero'],
		});
	});

	test('1.2: Old-only element (hidden in new state)', async ({ page }) => {
		const { captureView } = await openCaptureView(page, 'test-1-2');

		await verifyCaptureHeader(captureView, { selector: ':root' });

		await verifyCapturedGroups(captureView, ['root', 'hero', 'old-only-element']);

		await verifyImageElements(captureView, [':root', '#hero']);
		await expect(captureView).toContainText(/old image element: #old-only/i);
		await expect(captureView).not.toContainText(/new image element: #old-only/i);

		await verifyDevtoolsConsoleOutput(page, captureView, {
			targetTag: 'html',
			expectedGroups: ['root', 'hero', 'old-only-element'],
			oldOnlyGroups: ['old-only-element'],
		});
	});


	test('1.3: New-only element (created in new state)', async ({ page }) => {
		const { captureView } = await openCaptureView(page, 'test-1-3');

		await verifyCaptureHeader(captureView, { selector: ':root' });

		await verifyCapturedGroups(captureView, ['root', 'hero', 'new-only-element']);

		await verifyImageElements(captureView, [':root', '#hero']);
		await expect(captureView).not.toContainText(/old image element: #new-only/i);
		await expect(captureView).toContainText(/new image element: #new-only/i);

		await verifyDevtoolsConsoleOutput(page, captureView, {
			targetTag: 'html',
			expectedGroups: ['root', 'hero', 'new-only-element'],
			newOnlyGroups: ['new-only-element'],
		});
	});
});
