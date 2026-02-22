import { test, expect, type Locator, type Page } from '@playwright/test';

async function longTap(locator: Locator, page: Page): Promise<void> {
	const box = await locator.boundingBox();
	if (!box) throw new Error('Could not get bounding box for long-tap');
	const centerX = box.x + box.width / 2;
	const centerY = box.y + box.height / 2;

	await page.mouse.move(centerX, centerY);
	await page.mouse.down();
	await page.waitForTimeout(650);
	await page.mouse.up();
}

async function expectDockedLayout(page: Page, side: 'n' | 's' | 'e' | 'w', resizeHandleBox: { x: number; y: number; width: number; height: number; } | null): Promise<void> {
	const specimen = page.locator('#specimen');
	const dragBar = page.locator('#dragBar');
	const dock = page.locator('#dock');

	await expect(specimen).toBeVisible();
	await expect(dragBar).toBeVisible();
	await expect(dock).toBeVisible();

	const viewport = await page.evaluate(() => ({ width: innerWidth, height: innerHeight }));
	const specimenBox = await specimen.boundingBox();
	const dragBarBox = await dragBar.boundingBox();
	const dockBox = await dock.boundingBox();
	if (!specimenBox || !dragBarBox || !dockBox || !resizeHandleBox) throw new Error('Missing docked layout bounds');

	const sumWidth = specimenBox.width + dragBarBox.width + dockBox.width;
	const sumHeight = specimenBox.height + dragBarBox.height + dockBox.height;

	if (side === 'n' || side === 's') {
		expect(Math.abs(resizeHandleBox.y - dragBarBox.y)).toBeLessThan(6);
		expect(Math.abs(sumHeight - viewport.height)).toBeLessThan(6);
		expect(dragBarBox.height).toBeGreaterThan(0);
		if (side === 'n') {
			expect(Math.abs(dragBarBox.y - (specimenBox.y + specimenBox.height))).toBeLessThan(3);
			expect(specimenBox.y).toBeLessThan(dockBox.y);
		} else {
			expect(Math.abs(dragBarBox.y - (dockBox.y + dockBox.height))).toBeLessThan(3);
			expect(dockBox.y).toBeLessThan(specimenBox.y);
		}
	} else {
		expect(Math.abs(resizeHandleBox.x - dragBarBox.x)).toBeLessThan(6);
		expect(Math.abs(sumWidth - viewport.width)).toBeLessThan(6);
		expect(dragBarBox.width).toBeGreaterThan(0);
		if (side === 'w') {
			expect(Math.abs(dragBarBox.x - (specimenBox.x + specimenBox.width))).toBeLessThan(3);
			expect(specimenBox.x).toBeLessThan(dockBox.x);
		} else {
			expect(Math.abs(dragBarBox.x - (dockBox.x + dockBox.width))).toBeLessThan(3);
			expect(dockBox.x).toBeLessThan(specimenBox.x);
		}
	}
}


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



test('chamber window can minimize and restore', async ({ page }) => {
	await page.goto('/e2e/same-page/');
	const chamberWindow = page.locator('.window');
	const minimizeBtn = page.locator('#minimize-btn');
	const windowContent = chamberWindow.locator('.window-content');

	await expect(chamberWindow).toBeVisible();
	await expect(minimizeBtn).toBeVisible();
	await expect(minimizeBtn).toHaveAttribute('title', 'Minimize');
	const initialBox = await chamberWindow.boundingBox();

	if (!initialBox) throw new Error('Missing window bounds before minimize');

	await minimizeBtn.click();
	await expect(chamberWindow).toHaveClass(/minimized/);
	await expect(minimizeBtn).toHaveAttribute('title', 'Restore');
	await expect(chamberWindow).toHaveCSS('height', '37px');
	await expect(chamberWindow).toHaveCSS('width', '72px');
	await expect(windowContent).toHaveCSS('height', '0px');

	await minimizeBtn.click();
	await expect(chamberWindow).not.toHaveClass(/minimized/);
	await expect(minimizeBtn).toHaveAttribute('title', 'Minimize');
	await expect(windowContent).not.toHaveCSS('height', '0px');
	await expect
		.poll(async () => (await chamberWindow.boundingBox())?.height ?? 0)
		.toBeGreaterThan(initialBox.height * 0.8);
});

test('chamber window can be dragged', async ({ page }) => {
	await page.goto('/e2e/same-page/');
	const chamberWindow = page.locator('.window');
	const header = page.locator('#window-header');

	await expect(chamberWindow).toBeVisible();
	await expect(header).toBeVisible();

	const before = await chamberWindow.boundingBox();
	const headerBox = await header.boundingBox();
	if (!before || !headerBox) throw new Error('Missing window bounds for drag test');

	const startX = headerBox.x + headerBox.width / 2;
	const startY = headerBox.y + headerBox.height / 2;
	await page.mouse.move(startX, startY);
	await page.mouse.down();
	await page.mouse.move(startX + 50, startY + 40);
	await page.mouse.up();

	await expect
		.poll(async () => {
			const after = await chamberWindow.boundingBox();
			if (!after) return false;
			return Math.abs(after.x - before.x) > 20 || Math.abs(after.y - before.y) > 20;
		})
		.toBe(true);
});

test('chamber switches to docking mode on north edge long-tap', async ({ page }) => {
	await page.goto('/e2e/same-page/');
	const chamberWindow = page.locator('.window');
	const dragBar = page.locator('#dragBar');
	const dock = page.locator('#dock');

	await expect(chamberWindow).toBeVisible();
	await expect(dragBar).toHaveCount(0);
	await expect(dock).toHaveCount(0);

	const resizeHandle = chamberWindow.locator('.resize-handle.edge.n').first();
	await expect(resizeHandle).toBeVisible();
	const resizeHandleBox = await resizeHandle.boundingBox();


	await longTap(resizeHandle, page);
	await expectDockedLayout(page, 'n', resizeHandleBox);
	await expect(chamberWindow).toHaveCount(0);
});

test('chamber switches to docking mode on south edge long-tap', async ({ page }) => {
	await page.goto('/e2e/same-page/');
	const chamberWindow = page.locator('.window');
	const dragBar = page.locator('#dragBar');
	const dock = page.locator('#dock');

	await expect(chamberWindow).toBeVisible();
	await expect(dragBar).toHaveCount(0);
	await expect(dock).toHaveCount(0);

	const resizeHandle = chamberWindow.locator('.resize-handle.edge.s').first();
	await expect(resizeHandle).toBeVisible();
	const resizeHandleBox = await resizeHandle.boundingBox();

	await longTap(resizeHandle, page);
	await expectDockedLayout(page, 's', resizeHandleBox);
	await expect(chamberWindow).toHaveCount(0);
});

test('chamber switches to docking mode on east edge long-tap', async ({ page }) => {
	await page.goto('/e2e/same-page/');
	const chamberWindow = page.locator('.window');
	const dragBar = page.locator('#dragBar');
	const dock = page.locator('#dock');

	await expect(chamberWindow).toBeVisible();
	await expect(dragBar).toHaveCount(0);
	await expect(dock).toHaveCount(0);

	const resizeHandle = chamberWindow.locator('.resize-handle.edge.e').first();
	await expect(resizeHandle).toBeVisible();
	const resizeHandleBox = await resizeHandle.boundingBox();

	await longTap(resizeHandle, page);
	await expectDockedLayout(page, 'e', resizeHandleBox);
	await expect(chamberWindow).toHaveCount(0);
});

test('chamber switches to docking mode on west edge long-tap', async ({ page }) => {
	await page.goto('/e2e/same-page/');
	const chamberWindow = page.locator('.window');
	const dragBar = page.locator('#dragBar');
	const dock = page.locator('#dock');

	await expect(chamberWindow).toBeVisible();
	await expect(dragBar).toHaveCount(0);
	await expect(dock).toHaveCount(0);

	const resizeHandle = chamberWindow.locator('.resize-handle.edge.w').first();
	await expect(resizeHandle).toBeVisible();
	const resizeHandleBox = await resizeHandle.boundingBox();

	await longTap(resizeHandle, page);
	await expectDockedLayout(page, 'w', resizeHandleBox);
	await expect(chamberWindow).toHaveCount(0);
});

test('chamber switches back to window mode on drag-bar long-tap', async ({
	page,
}) => {
	await page.goto('/e2e/same-page/');
	const chamberWindow = page.locator('.window');
	const dragBar = page.locator('#dragBar');
	const dock = page.locator('#dock');

	await expect(chamberWindow).toBeVisible();

	const resizeHandle = chamberWindow.locator('.resize-handle.edge.n').first();
	await longTap(resizeHandle, page);

	await page.waitForTimeout(200);
	await expect(dragBar).toBeVisible();
	await expect(dock).toBeVisible();
	await expect(chamberWindow).toHaveCount(0);

	await longTap(dragBar, page);

	await page.waitForTimeout(500);
	await expect(chamberWindow).toBeVisible();
	await expect(dragBar).toHaveCount(0);
	await expect(dock).toHaveCount(0);
});


test('slower changes view transition animation playbackRate', async ({ page }) => {
	onmessage = (event) => {
		if (event.data === 'slow-down') {
			document.getAnimations().forEach((animation) => {
				animation.playbackRate = 0.025;
			});
		}
	};
	await page.goto('/e2e/same-page/');

	const resizeHandle = page.locator('.window .resize-handle.edge.n').first();
	await expect(resizeHandle).toBeVisible();
	await longTap(resizeHandle, page);


	const frameLocator = page.locator('iframe').first();
	await expect(frameLocator).toBeVisible();
	const mainFrame = await frameLocator.contentFrame();
	expect(mainFrame).not.toBeNull();
	const frame = mainFrame!;

	const chamberFrameLocator = page.locator('iframe').nth(1);
	await expect(chamberFrameLocator).toBeVisible();
	const chamberFrameHandle = await chamberFrameLocator.contentFrame();
	expect(chamberFrameHandle).not.toBeNull();
	const chamberFrame = chamberFrameHandle!;

	const hasSlowerPlaybackRate = async () =>
		frame.locator('html').evaluate(() =>
			document.getAnimations().length > 0 &&
			document
				.getAnimations()
				.every((animation) => (console.log(animation.playbackRate), animation.playbackRate === 0.025))
		);

	await chamberFrame.getByRole('radio', { name: 'Analyze animations' }).check();
	await chamberFrame.getByRole('radio', { name: 'Run' }).check();
	await chamberFrame.getByRole('radio', { name: 'Normal' }).check();

	await chamberFrame.locator('#slower').click();
	await expect(chamberFrame.locator('#slower')).toBeChecked();
	await frame.locator('#toggle-layout').click();
	await expect.poll(hasSlowerPlaybackRate, { timeout: 3000 }).toBe(true);
});