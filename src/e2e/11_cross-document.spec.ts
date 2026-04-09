import { test, expect } from '@playwright/test';
import {
	setupFrames,
	closeWelcomePanelIfOpen,
	ensureCaptureModeEnabled,
	waitForCaptureView,
} from './fixtures/capture-harness';
import { clickCheck, verifyCapturedGroups } from './capture-test-helpers';

test.beforeEach(({ browserName }) => {
	test.skip(
		browserName === 'firefox',
		'Cross-document view transitions are not enabled for Firefox in this suite yet.'
	);
});

test('cross-document demo navigates forward and back with view transition types', async ({
	page,
}) => {
	await page.goto('/e2e/cross-a/');
	const frameLocator = page.locator('iframe').first();
	await expect(frameLocator).toBeVisible();
	const mainFrame = frameLocator.contentFrame();
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

test('cross-document capture: verifies root, page-title, and page-card groups', async ({
	page,
}) => {
	const { testFrame, chamberFrame } = await setupFrames(page, {
		url: '/e2e/cross-a/',
		openChamber: true,
	});

	await closeWelcomePanelIfOpen(chamberFrame);
	await ensureCaptureModeEnabled(chamberFrame);
	await testFrame.locator('#go-next').click();
	const captureView = await waitForCaptureView(chamberFrame);
	await expect(captureView).toContainText(
		/Cross-document navigation, started at \d{2}:\d{2}:\d{2}\.\d{3}/
	);
	await verifyCapturedGroups(captureView, ['root', 'page-title', 'page-card']);
	await expect(testFrame.locator('#page-id')).toHaveText('Page B');
});

test('old-only cross-document capture: verifies root, page-title, and page-card groups', async ({
	page,
}) => {
	const { testFrame, chamberFrame } = await setupFrames(page, {
		url: '/e2e/cross-a/',
		openChamber: true,
	});

	await closeWelcomePanelIfOpen(chamberFrame);
	await ensureCaptureModeEnabled(chamberFrame);
	await clickCheck(chamberFrame, chamberFrame.locator('label[for="old-only"]'), true);
	await testFrame.locator('#go-next').click();
	const captureView = await waitForCaptureView(chamberFrame);
	await expect(captureView).toContainText(
		/Cross-document navigation, started at \d{2}:\d{2}:\d{2}\.\d{3}/
	);
	await verifyCapturedGroups(captureView, ['root', 'page-title', 'page-card']);
	await expect(testFrame.locator('#page-id')).toHaveText('Page A');
});

test('frozen cross-document capture: verifies root, page-title, and page-card groups', async ({
	page,
}) => {
	const { testFrame, chamberFrame } = await setupFrames(page, {
		url: '/e2e/cross-a/',
		openChamber: true,
	});

	await closeWelcomePanelIfOpen(chamberFrame);
	await ensureCaptureModeEnabled(chamberFrame);
	await clickCheck(chamberFrame, chamberFrame.locator('label[for="freeze-types"]'), true);

	await testFrame.locator('#go-next').click();
	const captureView = await waitForCaptureView(chamberFrame);
	await expect(captureView).toContainText(
		/Cross-document navigation, started at \d{2}:\d{2}:\d{2}\.\d{3}/
	);
	await verifyCapturedGroups(captureView, ['root', 'page-title', 'page-card']);
	await expect(testFrame.locator('#page-id')).toHaveText('Page B');

	const viewTransition = await testFrame
		.locator(':root')
		.evaluate((element) => !!element.ownerDocument.activeViewTransition);
	expect(viewTransition).not.toBeNull();
});

test('frozen, old-only cross-document capture: verifies root, page-title, and page-card groups', async ({
	page,
}) => {
	const { testFrame, chamberFrame } = await setupFrames(page, {
		url: '/e2e/cross-a/',
		openChamber: true,
	});

	await closeWelcomePanelIfOpen(chamberFrame);
	await ensureCaptureModeEnabled(chamberFrame);
	await clickCheck(
		chamberFrame,
		chamberFrame.locator('label[for="old-only"], label[for="freeze-types"]'),
		true
	);
	await testFrame.locator('#go-next').click();
	const captureView = await waitForCaptureView(chamberFrame);
	await expect(captureView).toContainText(
		/Cross-document navigation, started at \d{2}:\d{2}:\d{2}\.\d{3}/
	);
	await verifyCapturedGroups(captureView, ['root', 'page-title', 'page-card']);
	await expect(testFrame.locator('#page-id')).toHaveText('Page A');

	const viewTransition = await testFrame
		.locator(':root')
		.evaluate((element) => !!element.ownerDocument.activeViewTransition);
	expect(viewTransition).not.toBeNull();
});
