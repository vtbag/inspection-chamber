import { test, expect } from '@playwright/test';
import { closeWelcomePanelIfOpen, setupFrames } from './fixtures/capture-harness';
import { clickCheck } from './capture-test-helpers';
import { verifyAnimationGroups, verifyPseudoElements } from './animation-test-helpers';

test.describe('Animation Analysis: Basic Tests', () => {
	test('1.1: Layout transition shows correct groups and pseudo-elements', async ({ page }) => {
		const { testFrame, chamberFrame } = await setupFrames(page, {
			url: '/e2e/same-page/',
			openChamber: true,
		});

		await closeWelcomePanelIfOpen(chamberFrame);
		await clickCheck(chamberFrame, chamberFrame.locator('label[for="freeze"]'), true);
		await testFrame.locator('#toggle-layout').click();

		const animationsComponent = chamberFrame.locator('vtbag-ic-animations');
		await expect(animationsComponent).toBeVisible();

		const expectedGroups = [
			'root',
			'app-header',
			'title',
			'card-alpha',
			'card-beta',
			'card-gamma',
			'card-delta',
			'status',
		];
		await verifyAnimationGroups(chamberFrame, expectedGroups);

		const expectedPseudos = ['group', 'image-pair', 'old', 'new'];
		await verifyPseudoElements(chamberFrame, expectedPseudos);
		await verifyPseudoElements(chamberFrame, expectedPseudos, 'root');
	});

	test('1.2: Shuffle transition shows card groups', async ({ page }) => {
		const { testFrame, chamberFrame } = await setupFrames(page, {
			url: '/e2e/same-page/',
			openChamber: true,
		});

		await closeWelcomePanelIfOpen(chamberFrame);
		await clickCheck(chamberFrame, chamberFrame.locator('label[for="freeze"]'), true);
		await testFrame.locator('#shuffle-cards').click();

		const animationsComponent = chamberFrame.locator('vtbag-ic-animations');
		await expect(animationsComponent).toBeVisible();

		await verifyAnimationGroups(chamberFrame, [
			'root',
			'app-header',
			'title',
			'card-alpha',
			'card-beta',
			'card-gamma',
			'card-delta',
			'status',
		]);

		await clickCheck(chamberFrame, chamberFrame.locator('label[for="next"]'), true);
		await testFrame.locator('#shuffle-cards').click();

		await verifyAnimationGroups(chamberFrame, [
			'root',
			'app-header',
			'title',
			'card-beta',
			'card-gamma',
			'card-delta',
			'card-alpha',
			'status',
		]);

		await clickCheck(chamberFrame, chamberFrame.locator('label[for="scope-sort-1-alpha"]'), true);

		await verifyAnimationGroups(chamberFrame, [
			'app-header',
			'card-alpha',
			'card-beta',
			'card-delta',
			'card-gamma',
			'root',
			'status',
			'title',
		]);

		await clickCheck(
			chamberFrame,
			chamberFrame.locator('label[for="scope-sort-1-paint-order"]'),
			true
		);

		await verifyAnimationGroups(chamberFrame, [
			'root',
			'app-header',
			'title',
			'card-beta',
			'card-gamma',
			'card-delta',
			'card-alpha',
			'status',
		]);
	});
});
