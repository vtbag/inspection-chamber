import { test, expect } from '@playwright/test';

test('Start page loads', async ({ page }) => {
  await page.goto('http://localhost:4321/p1/'); // Change port if needed
  await expect(page).toHaveTitle("Page 1");
});

test('get Animations', async ({ page }) => {
  await page.goto('http://localhost:4321/animations/'); // Change port if needed
  await expect(page).toHaveTitle("Animations");
});
