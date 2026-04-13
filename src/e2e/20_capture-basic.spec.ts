import { expect, test } from '@playwright/test';

function createConsoleHandler() {
	let capturedData: any = null;
	const consoleHandler = (msg: any) => {
		if (msg.type() === 'log' && msg.args().length > 0) {
			msg
				.args()
				.at(-1)
				?.jsonValue()
				.then((value: any) => {
					if (Array.isArray(value)) {
						capturedData = value;
					}
				})
				.catch(() => {});
		}
	};
	return { consoleHandler, getCapturedData: () => capturedData };
}

test.describe('Capture Basic Restart', () => {

	test('none: captures no groups when no view-transition-name is set', async ({ page }) => {
		await page.goto('/e2e/capture-basic/', { waitUntil: 'commit' });

		const southResizeHandle = page.locator('div.resize-handle.edge.s').first();
		await expect(southResizeHandle).toBeVisible();
		const box = (await southResizeHandle.boundingBox())!;
		await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
		await page.mouse.down();
		await page.waitForTimeout(700);
		await page.mouse.up();

		const chamberFrame = page.locator('iframe').nth(0).contentFrame()!;
		const testFrame = page.locator('iframe').nth(1).contentFrame()!;

		const welcomeSummary = chamberFrame.locator('vtbag-ic-welcome details summary').first();
		(await welcomeSummary.isVisible()) && (await welcomeSummary.click());

		const captureToggle = chamberFrame.locator('#capture').first();
		await expect(captureToggle).toBeVisible();
		(await captureToggle.isChecked()) ||
			(await chamberFrame.locator('label[for="capture"]').first().click());
		await expect(captureToggle).toBeChecked();

		await testFrame.locator('#trigger-none').click();

		const captureView = chamberFrame.locator('vtbag-ic-view-transition-capture');
		await expect(captureView).toBeVisible();
		const headerText = await captureView.locator('h3').innerText();
		expect(headerText).toMatch(/Same-document call on :root, started at \d{2}:\d{2}:\d{2}\.\d{3}/);

		const oldTypesText = await captureView.locator('p').first().innerText();
		expect(oldTypesText).toMatch(
			/Active view transition types during capture of old images: none/i
		);

		const newTypesText = await captureView.locator('p').nth(1).innerText();
		expect(newTypesText).toMatch(
			/Active view transition types during capture of new images: none/i
		);

		const nestedDetails = chamberFrame.locator(
			'vtbag-ic-view-transition-capture .content > details'
		);
		await expect(nestedDetails).toHaveCount(0);

		const flatList = chamberFrame.locator('vtbag-ic-view-transition-capture #flat-capture-list');
		await expect(flatList).toBeVisible();
		await expect(flatList.locator('summary')).toContainText('Flat, alphabetic list');
		await flatList.locator('summary').click();
		await page.waitForTimeout(300);
		await expect(flatList.locator('span[data-link]')).toHaveCount(0);

		const { consoleHandler, getCapturedData } = createConsoleHandler();
		page.on('console', consoleHandler);
		const devtoolsBtn = chamberFrame.locator('span.devtools').first();
		await expect(devtoolsBtn).toBeVisible();
		await devtoolsBtn.click();

		await page.waitForTimeout(500);
		page.off('console', consoleHandler);

		const capturedData = getCapturedData();
		expect(capturedData).toBeTruthy();
		expect(Array.isArray(capturedData)).toBe(true);
		expect(capturedData.length).toBe(0);
	});


	test('root: captures group root with old and new element', async ({ page }) => {
		await page.goto('/e2e/capture-basic/', { waitUntil: 'commit' });

		const southResizeHandle = page.locator('div.resize-handle.edge.s').first();
		await expect(southResizeHandle).toBeVisible();
		const box = (await southResizeHandle.boundingBox())!;
		await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
		await page.mouse.down();
		await page.waitForTimeout(700);
		await page.mouse.up();

		const chamberFrame = page.locator('iframe').nth(0).contentFrame()!;
		const testFrame = page.locator('iframe').nth(1).contentFrame()!;

		const welcomeSummary = chamberFrame.locator('vtbag-ic-welcome details summary').first();
		(await welcomeSummary.isVisible()) && (await welcomeSummary.click());

		const captureToggle = chamberFrame.locator('#capture').first();
		await expect(captureToggle).toBeVisible();
		(await captureToggle.isChecked()) ||
			(await chamberFrame.locator('label[for="capture"]').first().click());
		await expect(captureToggle).toBeChecked();

		await testFrame.locator('#trigger-root').click();

		const captureView = chamberFrame.locator('vtbag-ic-view-transition-capture');
		await expect(captureView).toBeVisible();
		const headerText = await captureView.locator('h3').innerText();
		expect(headerText).toMatch(/Same-document call on :root, started at \d{2}:\d{2}:\d{2}\.\d{3}/);

		const oldTypesText = await captureView.locator('p').first().innerText();
		expect(oldTypesText).toMatch(
			/Active view transition types during capture of old images: root/i
		);

		const newTypesText = await captureView.locator('p').nth(1).innerText();
		expect(newTypesText).toMatch(
			/Active view transition types during capture of new images: root/i
		);

		const nestedDetails = chamberFrame.locator(
			'vtbag-ic-view-transition-capture .content > details'
		);
		await expect(nestedDetails.first()).toBeVisible();
		await nestedDetails.first().locator('summary').click();

		const nestedDetailsText = (await nestedDetails.allInnerTexts()).join('\n');
		expect(nestedDetailsText).toMatch(/Group\s+root/i);
		expect(nestedDetailsText).toMatch(/Old image element:\s*:root/i);
		expect(nestedDetailsText).toMatch(/New image element:\s*:root/i);

		const flatList = chamberFrame.locator('vtbag-ic-view-transition-capture #flat-capture-list');
		await expect(flatList).toBeVisible();
		await expect(flatList.locator('summary')).toContainText('Flat, alphabetic list');
		await flatList.locator('summary').click();
		await page.waitForTimeout(300); 
		const flatListText = await flatList.innerText();
		expect(flatListText).toMatch(/root/i);

		const { consoleHandler, getCapturedData } = createConsoleHandler();
		page.on('console', consoleHandler);
		const devtoolsBtn = chamberFrame.locator('span.devtools').first();
		await expect(devtoolsBtn).toBeVisible();
		await devtoolsBtn.click();

		await page.waitForTimeout(500);
		page.off('console', consoleHandler);

		const capturedData = getCapturedData();
		expect(capturedData).toBeTruthy();
		expect(Array.isArray(capturedData)).toBe(true);
		expect(capturedData.length).toBe(1);

		const rootEntry = capturedData[0];
		expect(rootEntry.name).toBe('root');
		expect(rootEntry.oldNamedElement).toBeTruthy();
		expect(rootEntry.newNamedElement).toBeTruthy();
		expect(rootEntry.oldNamedElement.element).toBeTruthy();
		expect(rootEntry.newNamedElement.element).toBeTruthy();
	});

	test('old-only: captures group with old but no new element', async ({ page }) => {
		await page.goto('/e2e/capture-basic/', { waitUntil: 'commit' });

		const southResizeHandle = page.locator('div.resize-handle.edge.s').first();
		await expect(southResizeHandle).toBeVisible();
		const box = (await southResizeHandle.boundingBox())!;
		await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
		await page.mouse.down();
		await page.waitForTimeout(700);
		await page.mouse.up();

		const chamberFrame = page.locator('iframe').nth(0).contentFrame()!;
		const testFrame = page.locator('iframe').nth(1).contentFrame()!;

		const welcomeSummary = chamberFrame.locator('vtbag-ic-welcome details summary').first();
		(await welcomeSummary.isVisible()) && (await welcomeSummary.click());

		const captureToggle = chamberFrame.locator('#capture').first();
		await expect(captureToggle).toBeVisible();
		(await captureToggle.isChecked()) ||
			(await chamberFrame.locator('label[for="capture"]').first().click());
		await expect(captureToggle).toBeChecked();

		await testFrame.locator('#trigger-old-only').click();

		const captureView = chamberFrame.locator('vtbag-ic-view-transition-capture');
		await expect(captureView).toBeVisible();
		const headerText = await captureView.locator('h3').innerText();
		expect(headerText).toMatch(/Same-document call on :root, started at \d{2}:\d{2}:\d{2}\.\d{3}/);

		const oldTypesText = await captureView.locator('p').first().innerText();
		expect(oldTypesText).toMatch(
			/Active view transition types during capture of old images: old-only/i
		);

		const newTypesText = await captureView.locator('p').nth(1).innerText();
		expect(newTypesText).toMatch(
			/Active view transition types during capture of new images: old-only/i
		);

		const nestedDetails = chamberFrame.locator(
			'vtbag-ic-view-transition-capture .content > details'
		);
		await expect(nestedDetails.first()).toBeVisible();
		await nestedDetails.first().locator('summary').click();

		const nestedDetailsText = (await nestedDetails.allInnerTexts()).join('\n');
		expect(nestedDetailsText).toMatch(/Group\s+old-only/i);
		expect(nestedDetailsText).toMatch(/Old image element:\s*#element-a/i);
		expect(nestedDetailsText).not.toMatch(/New image element:/i);

		const flatList = chamberFrame.locator('vtbag-ic-view-transition-capture #flat-capture-list');
		await expect(flatList).toBeVisible();
		await expect(flatList.locator('summary')).toContainText('Flat, alphabetic list');
		await flatList.locator('summary').click();
		await page.waitForTimeout(300);
		
		const flatListText = await flatList.innerText();
		expect(flatListText).toMatch(/old-only/i);

		const { consoleHandler, getCapturedData } = createConsoleHandler();
		page.on('console', consoleHandler);
		const devtoolsBtn = chamberFrame.locator('span.devtools').first();
		await expect(devtoolsBtn).toBeVisible();
		await devtoolsBtn.click();

		await page.waitForTimeout(500);
		page.off('console', consoleHandler);

		const capturedData = getCapturedData();
		expect(capturedData).toBeTruthy();
		expect(Array.isArray(capturedData)).toBe(true);
		expect(capturedData.length).toBe(1);

		const oldOnlyEntry = capturedData[0];
		expect(oldOnlyEntry.name).toBe('old-only');
		expect(oldOnlyEntry.oldNamedElement).toBeTruthy();
		expect(oldOnlyEntry.newNamedElement).toBeFalsy();
		expect(oldOnlyEntry.oldNamedElement.element).toBeTruthy();
	});

	test('hidden: captures old element, reports hidden new element, and toggles skipped visibility', async ({
		page,
	}) => {
		await page.goto('/e2e/capture-basic/', { waitUntil: 'commit' });

		const southResizeHandle = page.locator('div.resize-handle.edge.s').first();
		await expect(southResizeHandle).toBeVisible();
		const box = (await southResizeHandle.boundingBox())!;
		await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
		await page.mouse.down();
		await page.waitForTimeout(700);
		await page.mouse.up();

		const chamberFrame = page.locator('iframe').nth(0).contentFrame()!;
		const testFrame = page.locator('iframe').nth(1).contentFrame()!;

		const welcomeSummary = chamberFrame.locator('vtbag-ic-welcome details summary').first();
		(await welcomeSummary.isVisible()) && (await welcomeSummary.click());

		const captureToggle = chamberFrame.locator('#capture').first();
		await expect(captureToggle).toBeVisible();
		(await captureToggle.isChecked()) ||
			(await chamberFrame.locator('label[for="capture"]').first().click());
		await expect(captureToggle).toBeChecked();

		await testFrame.locator('#trigger-hidden').click();

		const captureView = chamberFrame.locator('vtbag-ic-view-transition-capture');
		await expect(captureView).toBeVisible();
		const headerText = await captureView.locator('h3').innerText();
		expect(headerText).toMatch(/Same-document call on :root, started at \d{2}:\d{2}:\d{2}\.\d{3}/);

		const oldTypesText = await captureView.locator('p').first().innerText();
		expect(oldTypesText).toMatch(
			/Active view transition types during capture of old images: hidden/i
		);

		const newTypesText = await captureView.locator('p').nth(1).innerText();
		expect(newTypesText).toMatch(
			/Active view transition types during capture of new images: hidden/i
		);

		const hideUndiscoverable = captureView.locator('#hide-undiscoverable');
		await expect(hideUndiscoverable).toBeVisible();
		await expect(hideUndiscoverable).toBeChecked();

		const contentDetails = chamberFrame.locator('.content');
		const nestedDetails = chamberFrame.locator('.content > details');

		await expect(nestedDetails.first()).toBeVisible();
		await nestedDetails.first().locator('summary').click();
		await chamberFrame.locator('#flat-capture-list summary').click();

		const hiddenText = (await contentDetails.allInnerTexts()).join('\n');
		expect(hiddenText).toMatch(/Group\s+hidden/i);
		expect(hiddenText).toMatch(/Old image element:\s*#element-a/i);
		expect(hiddenText).not.toMatch(/New image element:/i);
		await expect(chamberFrame.locator('#flat-capture-list span.hidden')).not.toBeVisible();

		await chamberFrame.locator('label[for="hide-undiscoverable"]').click();
		await expect(hideUndiscoverable).not.toBeChecked();
		await page.waitForTimeout(100);
		chamberFrame.locator('.content > details').nth(1).locator('summary').click();
		await expect(chamberFrame.locator('#flat-capture-list span.hidden')).toBeVisible();
		await page.waitForTimeout(900);

		const revealedText = (await chamberFrame.locator('.content').allInnerTexts()).join('\n');
		expect(revealedText).toMatch(/Group\s+hidden/i);
		expect(revealedText).toMatch(/Old image element:\s*#element-a/i);
		expect(revealedText).toMatch(/Group\s+hidden skipped as #element-a hides &/i);
		expect(revealedText).toMatch(/New image element:\s*#element-a/i);

		const flatList = chamberFrame.locator('vtbag-ic-view-transition-capture #flat-capture-list');
		await expect(flatList).toBeVisible();
		await expect(flatList.locator('summary')).toContainText('Flat, alphabetic list');

		const flatListText = await flatList.innerText();
		expect(flatListText).toMatch(/hidden/i);

		const { consoleHandler, getCapturedData } = createConsoleHandler();
		page.on('console', consoleHandler);
		const devtoolsBtn = chamberFrame.locator('span.devtools').first();
		await expect(devtoolsBtn).toBeVisible();
		await devtoolsBtn.click();

		await page.waitForTimeout(500);
		page.off('console', consoleHandler);

		const capturedData = getCapturedData();
		expect(capturedData).toBeTruthy();
		expect(Array.isArray(capturedData)).toBe(true);
		expect(capturedData.length).toBe(2);

		let entry: any = capturedData[0];
		expect(entry.name).toBe('hidden');
		expect(entry.oldNamedElement).toBeTruthy();
		expect(entry.newNamedElement).toBeFalsy();
		expect(entry.oldNamedElement.element).toBeTruthy();
		expect(entry.newHiddenBy).toBeFalsy();

		entry = capturedData[1];
		expect(entry.name).toBe('hidden');
		expect(entry.oldNamedElement).toBeFalsy();
		expect(entry.newNamedElement).toBeTruthy();
		expect(entry.newNamedElement.element).toBeTruthy();
		expect(entry.newHiddenBy.element).toBeTruthy();
	});

	test('new-only: captures group with new but no old element', async ({ page }) => {
		await page.goto('/e2e/capture-basic/', { waitUntil: 'commit' });

		const southResizeHandle = page.locator('div.resize-handle.edge.s').first();
		await expect(southResizeHandle).toBeVisible();
		const box = (await southResizeHandle.boundingBox())!;
		await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
		await page.mouse.down();
		await page.waitForTimeout(700);
		await page.mouse.up();

		const chamberFrame = page.locator('iframe').nth(0).contentFrame()!;
		const testFrame = page.locator('iframe').nth(1).contentFrame()!;

		const welcomeSummary = chamberFrame.locator('vtbag-ic-welcome details summary').first();
		(await welcomeSummary.isVisible()) && (await welcomeSummary.click());

		const captureToggle = chamberFrame.locator('#capture').first();
		await expect(captureToggle).toBeVisible();
		(await captureToggle.isChecked()) ||
			(await chamberFrame.locator('label[for="capture"]').first().click());
		await expect(captureToggle).toBeChecked();

		await testFrame.locator('#trigger-new-only').click();

		const captureView = chamberFrame.locator('vtbag-ic-view-transition-capture');
		await expect(captureView).toBeVisible();
		const headerText = await captureView.locator('h3').innerText();
		expect(headerText).toMatch(/Same-document call on :root, started at \d{2}:\d{2}:\d{2}\.\d{3}/);

		const oldTypesText = await captureView.locator('p').first().innerText();
		expect(oldTypesText).toMatch(
			/Active view transition types during capture of old images: new-only/i
		);

		const newTypesText = await captureView.locator('p').nth(1).innerText();
		expect(newTypesText).toMatch(
			/Active view transition types during capture of new images: new-only/i
		);

		const nestedDetails = chamberFrame.locator(
			'vtbag-ic-view-transition-capture .content > details'
		);
		await expect(nestedDetails.first()).toBeVisible();
		await nestedDetails.first().locator('summary').click();

		const nestedDetailsText = (await nestedDetails.allInnerTexts()).join('\n');
		expect(nestedDetailsText).toMatch(/Group\s+new-only/i);
		expect(nestedDetailsText).not.toMatch(/Old image element:/i);
		expect(nestedDetailsText).toMatch(/New image element:\s*#element-b/i);

		const flatList = chamberFrame.locator('vtbag-ic-view-transition-capture #flat-capture-list');
		await expect(flatList).toBeVisible();
		await expect(flatList.locator('summary')).toContainText('Flat, alphabetic list');
		await flatList.locator('summary').click();
		await page.waitForTimeout(300);
		
		const flatListText = await flatList.innerText();
		expect(flatListText).toMatch(/new-only/i);

		const { consoleHandler, getCapturedData } = createConsoleHandler();
		page.on('console', consoleHandler);
		const devtoolsBtn = chamberFrame.locator('span.devtools').first();
		await expect(devtoolsBtn).toBeVisible();
		await devtoolsBtn.click();

		await page.waitForTimeout(500);
		page.off('console', consoleHandler);

		const capturedData = getCapturedData();
		expect(capturedData).toBeTruthy();
		expect(Array.isArray(capturedData)).toBe(true);
		expect(capturedData.length).toBe(1);

		const newOnlyEntry = capturedData[0];
		expect(newOnlyEntry.name).toBe('new-only');
		expect(newOnlyEntry.oldNamedElement).toBeFalsy();
		expect(newOnlyEntry.newNamedElement).toBeTruthy();
		expect(newOnlyEntry.newNamedElement.element).toBeTruthy();
	});
});
