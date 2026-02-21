import { test, expect } from '@playwright/test';

test.beforeEach(({ browserName }) => {
	test.skip(
		browserName === 'firefox',
		'Cross-document view transitions are not enabled for Firefox in this suite yet.'
	);
});

test('cross-document demo navigates forward and back with VT types', async ({ page }) => {
	await page.goto('/e2e/cross-a/');
	const frameLocator = page.locator('iframe').first();
	await expect(frameLocator).toBeVisible();
	const mainFrame = await frameLocator.contentFrame();
	expect(mainFrame).not.toBeNull();
	const frame = mainFrame!;
	await expect(frame.locator('#page-id')).toHaveText('Page A');

	await frame.locator('#go-next').click();
	await expect(frame.locator('#page-id')).toHaveText('Page B');
	await expect(frame.locator('#direction')).toHaveText('forwards');

	await frame.locator('#go-prev').click();
	await expect(frame.locator('#page-id')).toHaveText('Page A');
	await expect(frame.locator('#direction')).toHaveText('backwards');
});

test('cross-document chamber window can minimize and restore', async ({ page }) => {
	await page.goto('/e2e/cross-a/');
	const chamberWindow = page.locator('.window');
	const minimizeBtn = page.locator('#minimize-btn');

	await expect(chamberWindow).toBeVisible();
	await expect(minimizeBtn).toBeVisible();
	await expect(minimizeBtn).toHaveAttribute('title', 'Minimize');

	await minimizeBtn.click();
	await expect(chamberWindow).toHaveClass(/minimized/);
	await expect(minimizeBtn).toHaveAttribute('title', 'Restore');

	await minimizeBtn.click();
	await expect(chamberWindow).not.toHaveClass(/minimized/);
	await expect(minimizeBtn).toHaveAttribute('title', 'Minimize');
});


