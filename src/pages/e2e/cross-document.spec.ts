import { test, expect } from '@playwright/test';

if (process.env.VTBAG_ASTRO_BUILD !== '1') {
	test('cross-document chamber window can minimize and restore @cross', async ({
		page,
		browserName,
	}) => {
		test.skip(
			browserName === 'firefox',
			'Cross-document view transitions are not enabled for Firefox in this suite yet.'
		);

		await page.goto('/e2e/cross-a/');
		const chamberWindow = page.locator('.window');
		const minimizeBtn = page.locator('#minimize-btn');
		await expect(chamberWindow).toBeVisible();
		await expect(minimizeBtn).toHaveAttribute('title', 'Minimize');
		await minimizeBtn.evaluate((el) => (el as HTMLButtonElement).click());
		await expect(chamberWindow).toHaveClass(/minimized/);
		await expect(minimizeBtn).toHaveAttribute('title', 'Restore');
		await minimizeBtn.evaluate((el) => (el as HTMLButtonElement).click());
		await expect(chamberWindow).not.toHaveClass(/minimized/);
		await expect(minimizeBtn).toHaveAttribute('title', 'Minimize');
	});

	test('cross-document demo navigates forward and back with VT types @cross', async ({
		page,
		browserName,
	}) => {
		test.skip(
			browserName === 'firefox',
			'Cross-document view transitions are not enabled for Firefox in this suite yet.'
		);

		await page.goto('/e2e/cross-a/');
		await expect(page.locator('iframe').first()).toBeVisible();
		const mainFrame = page.locator('iframe').first().contentFrame();
		await expect(mainFrame.locator('#page-id')).toHaveText('Page A');

		await mainFrame.locator('#go-next').click();
		await expect(mainFrame.locator('#page-id')).toHaveText('Page B');
		await expect.poll(async () => mainFrame.locator('#direction').innerText()).toBe('forwards');

		await mainFrame.locator('#go-prev').click();
		await expect(mainFrame.locator('#page-id')).toHaveText('Page A');
		await expect.poll(async () => mainFrame.locator('#direction').innerText()).toBe('backwards');
	});
}
