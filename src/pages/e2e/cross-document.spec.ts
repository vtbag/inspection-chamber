import { test, expect } from '@playwright/test';

if (process.env.VTBAG_ASTRO_BUILD !== '1') {
	test('cross-document demo navigates forward and back with VT types @cross', async ({
		page,
		browserName,
	}) => {
		test.skip(
			browserName === 'firefox',
			'Cross-document view transitions are not enabled for Firefox in this suite yet.'
		);

		await page.goto('/e2e/cross-a/');
		await page.waitForTimeout(300);
		const useFrame = (await page.locator('iframe').count()) > 0;
		if (useFrame) {
			await expect(page.locator('iframe').first()).toBeVisible();
		}
		const mainFrame = useFrame ? page.frameLocator('iframe').first() : page;
		await expect(mainFrame.locator('#page-id')).toHaveText('Page A');

		await mainFrame.locator('#go-next').click();
		await expect(mainFrame.locator('#page-id')).toHaveText('Page B');
		await expect.poll(async () => mainFrame.locator('#direction').innerText()).toBe('forwards');

		await mainFrame.locator('#go-prev').click();
		await expect(mainFrame.locator('#page-id')).toHaveText('Page A');
		await expect.poll(async () => mainFrame.locator('#direction').innerText()).toBe('backwards');
	});
}
