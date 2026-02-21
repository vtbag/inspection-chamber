import { test, expect } from '@playwright/test';

test('Start page loads', async ({ page }) => {
	await page.goto('/e2e/empty/');
	await expect(page).toHaveTitle('Empty Page');
});
