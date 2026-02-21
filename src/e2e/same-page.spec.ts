import { test, expect } from '@playwright/test';

test('same-page demo supports layout/shuffle/theme transitions @same', async ({ page }) => {
	await page.goto('/e2e/same-page/');
	const frameLocator = page.locator('iframe').first();
	await expect(frameLocator).toBeVisible();
	const mainFrame = await frameLocator.contentFrame();
	expect(mainFrame).not.toBeNull();
	const frame = mainFrame!;

	await expect(frame.locator('#title')).toHaveText('Same-page VT Playground');

	const getOrder = () =>
		frame
			.locator('#board .card')
			.evaluateAll((els) => els.map((el) => (el as HTMLElement).dataset.card ?? ''));

	const beforeOrder = await getOrder();

	await frame.locator('#toggle-layout').click();
	await expect(frame.locator('html')).toHaveAttribute('data-layout', 'stack');
	await expect(frame.locator('#status')).toHaveText(/same-page-layout/);

	await frame.locator('#shuffle-cards').click();
	await expect(frame.locator('#status')).toHaveText(/same-page-shuffle/);

	const afterOrder = await getOrder();
	const rotatedOrder = [...beforeOrder.slice(1), beforeOrder[0]];
	await expect(afterOrder).toEqual(rotatedOrder);

	await frame.locator('#toggle-theme').click();
	await expect(frame.locator('#status')).toHaveText(/same-page-theme/);
	await expect(frame.locator('html')).toHaveCSS('color-scheme', /^(light|dark)$/);
});
