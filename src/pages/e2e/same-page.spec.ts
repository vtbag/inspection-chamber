import { test, expect } from '@playwright/test';

if (process.env.VTBAG_ASTRO_BUILD !== '1') {
	test('same-page demo supports layout/shuffle/theme transitions @same', async ({ page }) => {
		await page.goto('/e2e/same-page/');
		await page.waitForTimeout(300);
		const useFrame = (await page.locator('iframe').count()) > 0;
		if (useFrame) {
			await expect(page.locator('iframe').first()).toBeVisible();
		}

		const mainFrame = useFrame ? page.frameLocator('iframe').first() : page;

		await expect(mainFrame.locator('#title')).toHaveText('Same-page VT Playground');

		const getStatus = () => mainFrame.locator('#status').innerText();
		const getOrder = () =>
			mainFrame
				.locator('#board .card')
				.evaluateAll((els) => els.map((el) => (el as HTMLElement).dataset.card ?? ''));

		const beforeOrder = await getOrder();

		await mainFrame.locator('#toggle-layout').click();
		await expect
			.poll(async () =>
				mainFrame.locator('html').evaluate((el) => (el as HTMLElement).dataset.layout)
			)
			.toBe('stack');
		await expect.poll(async () => getStatus()).toContain('same-page-layout');

		await mainFrame.locator('#shuffle-cards').click();
		await expect.poll(async () => getStatus()).toContain('same-page-shuffle');

		const afterOrder = await getOrder();
		const rotatedOrder = [...beforeOrder.slice(1), beforeOrder[0]];
		await expect(afterOrder).toEqual(rotatedOrder);

		await mainFrame.locator('#toggle-theme').click();
		await expect.poll(async () => getStatus()).toContain('same-page-theme');
		await expect
			.poll(async () =>
				mainFrame.locator('html').evaluate((el) => (el as HTMLElement).style.colorScheme)
			)
			.toMatch(/^(light|dark)$/);
	});
}
