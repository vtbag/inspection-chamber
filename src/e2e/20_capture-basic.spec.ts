import { expect, test, type Page } from '@playwright/test';

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

async function switchToDockedView(page: Page) {
	const southResizeHandle = page.locator('div.resize-handle.edge.s').first();
	await expect(southResizeHandle).toBeVisible();

	await page.evaluate(() => {
		dispatchEvent(new CustomEvent('longTap', { detail: { side: 's' } }));
	});

	await expect(page.locator('#dragBar')).toBeVisible();
	await expect(page.locator('iframe').nth(0)).toBeVisible();
	await expect(page.locator('iframe').nth(1)).toBeVisible();
}

test.describe('Capture Basic', () => {
	test('none: captures no groups when no view-transition-name is set', async ({ page }) => {
		await page.goto('/e2e/capture-basic/', { waitUntil: 'commit' });
		await switchToDockedView(page);

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
		await switchToDockedView(page);

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
		await switchToDockedView(page);

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

	test('hidden: reports hidden new element, and toggles visibility of undiscoverables', async ({
		page,
	}) => {
		await page.goto('/e2e/capture-basic/', { waitUntil: 'commit' });
		await switchToDockedView(page);

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
		expect(revealedText).toMatch(/Group\s+hidden, discovery blocked by #element-a/i);
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
		expect(entry.hiddenBy).toBeFalsy();

		entry = capturedData[1];
		expect(entry.name).toBe('hidden');
		expect(entry.oldNamedElement).toBeFalsy();
		expect(entry.newNamedElement).toBeTruthy();
		expect(entry.newNamedElement.element).toBeTruthy();
		expect(entry.hiddenBy.element).toBeTruthy();
	});

	test('more-hidden: captures multiple hidden scenarios and toggles undiscoverables', async ({
		page,
	}) => {
		await page.goto('/e2e/capture-basic/', { waitUntil: 'commit' });
		await switchToDockedView(page);

		const chamberFrame = page.locator('iframe').nth(0).contentFrame()!;
		const testFrame = page.locator('iframe').nth(1).contentFrame()!;

		const welcomeSummary = chamberFrame.locator('vtbag-ic-welcome details summary').first();
		(await welcomeSummary.isVisible()) && (await welcomeSummary.click());

		const captureToggle = chamberFrame.locator('#capture').first();
		await expect(captureToggle).toBeVisible();
		(await captureToggle.isChecked()) ||
			(await chamberFrame.locator('label[for="capture"]').first().click());
		await expect(captureToggle).toBeChecked();

		await testFrame.locator('#trigger-more-hidden').click();

		const captureView = chamberFrame.locator('vtbag-ic-view-transition-capture');
		await expect(captureView).toBeVisible();
		const headerText = await captureView.locator('h3').innerText();
		expect(headerText).toMatch(/Same-document call on :root, started at \d{2}:\d{2}:\d{2}\.\d{3}/);

		const oldTypesText = await captureView.locator('p').first().innerText();
		expect(oldTypesText).toMatch(
			/Active view transition types during capture of old images: more-hidden/i
		);

		const newTypesText = await captureView.locator('p').nth(1).innerText();
		expect(newTypesText).toMatch(
			/Active view transition types during capture of new images: more-hidden/i
		);

		const hideUndiscoverable = captureView.locator('#hide-undiscoverable');
		await expect(hideUndiscoverable).toBeVisible();
		await expect(hideUndiscoverable).toBeChecked();

		const visibleDetailsBeforeToggle = chamberFrame.locator('.content > details:visible');
		await expect(visibleDetailsBeforeToggle).toHaveCount(2);
		await expect(visibleDetailsBeforeToggle.first().locator('summary')).toHaveText(
			'Group old-hidden'
		);
		await expect(visibleDetailsBeforeToggle.nth(1).locator('summary')).toHaveText(
			'Group old-b-1'
		);
		await visibleDetailsBeforeToggle.first().locator('summary').click();
		await expect(visibleDetailsBeforeToggle.first()).toContainText(
			'Old image element: #trigger-more-hidden > span'
		);

		await chamberFrame.locator('#flat-capture-list summary').click();

		const hiddenEntriesBeforeToggle = chamberFrame.locator('#flat-capture-list span.hidden');
		await expect(hiddenEntriesBeforeToggle).toHaveCount(8);
		await expect(hiddenEntriesBeforeToggle.first()).not.toBeVisible();

		await chamberFrame.locator('label[for="hide-undiscoverable"]').click();
		await expect(hideUndiscoverable).not.toBeChecked();
		await page.waitForTimeout(100);

		const allDetails = chamberFrame.locator('.content > details');
		const detailCount = await allDetails.count();
		for (let i = 0; i < detailCount; i++) {
			const detail = allDetails.nth(i);
			const isOpen = await detail.evaluate((node) => (node as HTMLDetailsElement).open);
			if (!isOpen) {
				await detail.evaluate((node) => {
					const summary = (node as HTMLDetailsElement).querySelector(
						'summary'
					) as HTMLElement | null;
					summary?.click();
				});
				await expect
					.poll(async () => detail.evaluate((node) => (node as HTMLDetailsElement).open))
					.toBe(true);
			}
		}
		await page.waitForTimeout(500);

		const detailTexts = await chamberFrame.locator('.content > details').allInnerTexts();
		expect(detailTexts.length).toBe(10);
		let detailText = detailTexts[0].replace(/\s+/g, ' ').trim();
		expect(detailText).toMatch(/Group old-hidden/i);
		expect(detailText).toMatch(/Old image element: #trigger-more-hidden > span/i);

		detailText = detailTexts[1].replace(/\s+/g, ' ').trim();
		expect(detailText).toMatch(/Group old-a, discovery blocked by #element-a/i);
		expect(detailText).toMatch(/Old image element: #element-a/i);

		detailText = detailTexts[2].replace(/\s+/g, ' ').trim();
		expect(detailText).toMatch(/Group old-a, discovery blocked by #element-a/i);
		expect(detailText).toMatch(/Old image element: #element-a > p/i);

		detailText = detailTexts[3].replace(/\s+/g, ' ').trim();
		expect(detailText).toMatch(/Group old-b-1/i);
		expect(detailText).toMatch(/Old image element: #element-b/i);

		detailText = detailTexts[4].replace(/\s+/g, ' ').trim();
		expect(detailText).toMatch(/Group old-b-2, discovery blocked by #element-b/i);
		expect(detailText).toMatch(/Old image element: #element-b > p/i);

		detailText = detailTexts[5].replace(/\s+/g, ' ').trim();
		expect(detailText).toMatch(/Group new-hidden, discovery blocked by #trigger-hidden/i);
		expect(detailText).toMatch(/New image element: #trigger-hidden/i);

		detailText = detailTexts[6].replace(/\s+/g, ' ').trim();
		expect(detailText).toMatch(/Group new-hidden, discovery blocked by #trigger-hidden/i);
		expect(detailText).toMatch(/New image element: #trigger-hidden > span/i);

		detailText = detailTexts[7].replace(/\s+/g, ' ').trim();
		expect(detailText).toMatch(/Group new-a, discovery blocked by #element-a/i);
		expect(detailText).toMatch(/New image element: #element-a/i);

		detailText = detailTexts[8].replace(/\s+/g, ' ').trim();
		expect(detailText).toMatch(/Group new-a, discovery blocked by #element-a/i);
		expect(detailText).toMatch(/New image element: #element-a > p/i);

		detailText = detailTexts[9].replace(/\s+/g, ' ').trim();
		expect(detailText).toMatch(/Group new-b, discovery blocked by #element-b/i);
		expect(detailText).toMatch(/New image element: #element-b/i);

		const flatList = chamberFrame.locator('vtbag-ic-view-transition-capture #flat-capture-list');
		await expect(flatList).toBeVisible();
		await expect(flatList.locator('summary')).toContainText('Flat, alphabetic list');

		const flatListText = await flatList.innerText();
		expect(flatListText).toBe(
			'Flat, alphabetic list\nnew-a,new-a,new-b,new-hidden,new-hidden,old-a,old-a,old-b-1,old-b-2,old-hidden'
		);

		const flatListEntries = await chamberFrame
			.locator('#flat-capture-list span[data-link]')
			.allInnerTexts();
		const normalizedEntries = flatListEntries.map((entry) => entry.trim());
		const alphabeticEntries = [...normalizedEntries].sort((a, b) => a.localeCompare(b));
		expect(normalizedEntries).toEqual(alphabeticEntries);

		const hiddenEntriesAfterToggle = chamberFrame.locator('#flat-capture-list span.hidden');
		await expect(hiddenEntriesAfterToggle).toHaveCount(8);
		await expect(hiddenEntriesAfterToggle.first()).toBeVisible();

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
		expect(capturedData.length).toBe(10);

		let entry = capturedData[0];
		expect(entry.name).toBe('old-hidden');
		expect(entry.oldNamedElement).toBeTruthy();
		expect(entry.newNamedElement).toBeFalsy();
		expect(entry.hiddenBy).toBeFalsy();

		entry = capturedData[1];
		expect(entry.name).toBe('old-a');
		expect(entry.oldNamedElement).toBeTruthy();
		expect(entry.newNamedElement).toBeFalsy();
		expect(entry.hiddenBy).toBeTruthy();

		entry = capturedData[2];
		expect(entry.name).toBe('old-a');
		expect(entry.oldNamedElement).toBeTruthy();
		expect(entry.newNamedElement).toBeFalsy();
		expect(entry.hiddenBy).toBeTruthy();

		entry = capturedData[3];
		expect(entry.name).toBe('old-b-1');
		expect(entry.oldNamedElement).toBeTruthy();
		expect(entry.newNamedElement).toBeFalsy();
		expect(entry.hiddenBy).toBeFalsy();

		entry = capturedData[4];
		expect(entry.name).toBe('old-b-2');
		expect(entry.oldNamedElement).toBeTruthy();
		expect(entry.newNamedElement).toBeFalsy();
		expect(entry.hiddenBy).toBeTruthy();

		entry = capturedData[5];
		expect(entry.name).toBe('new-hidden');
		expect(entry.oldNamedElement).toBeFalsy();
		expect(entry.newNamedElement).toBeTruthy();
		expect(entry.hiddenBy).toBeTruthy();

		entry = capturedData[6];
		expect(entry.name).toBe('new-hidden');
		expect(entry.oldNamedElement).toBeFalsy();
		expect(entry.newNamedElement).toBeTruthy();
		expect(entry.hiddenBy).toBeTruthy();

		entry = capturedData[7];
		expect(entry.name).toBe('new-a');
		expect(entry.oldNamedElement).toBeFalsy();
		expect(entry.newNamedElement).toBeTruthy();
		expect(entry.hiddenBy).toBeTruthy();

		entry = capturedData[8];
		expect(entry.name).toBe('new-a');
		expect(entry.oldNamedElement).toBeFalsy();
		expect(entry.newNamedElement).toBeTruthy();
		expect(entry.hiddenBy).toBeTruthy();

		entry = capturedData[9];
		expect(entry.name).toBe('new-b');
		expect(entry.oldNamedElement).toBeFalsy();
		expect(entry.newNamedElement).toBeTruthy();
		expect(entry.hiddenBy).toBeTruthy();
	});

	test('new-only: captures group with new but no old element', async ({ page }) => {
		await page.goto('/e2e/capture-basic/', { waitUntil: 'commit' });
		await switchToDockedView(page);

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
