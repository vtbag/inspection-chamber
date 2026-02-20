import { test, expect } from '@playwright/test';

if (process.env.VTBAG_ASTRO_BUILD !== '1') {
	test('Start page loads', async ({ page }) => {
		await page.goto('/e2e/empty/');
		await expect(page).toHaveTitle('Empty Page');
	});
}
