import { expect, test } from '@playwright/test';

test.describe('Capture Basic Restart', () => {
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

        // Check capture view header
        const captureView = chamberFrame.locator('vtbag-ic-view-transition-capture');
        await expect(captureView).toBeVisible();
        const headerText = await captureView.locator('h3').innerText();
        expect(headerText).toMatch(/Same-document call on :root, started at \d{2}:\d{2}:\d{2}\.\d{3}/);

        const oldTypesText = await captureView.locator('p').first().innerText();
        expect(oldTypesText).toMatch(/Active view transition types during capture of old images: root/i);

        const newTypesText = await captureView.locator('p').nth(1).innerText();
        expect(newTypesText).toMatch(/Active view transition types during capture of new images: root/i);

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

        const flatListText = await flatList.innerText();
        expect(flatListText).toMatch(/root/i);

        // Capture devtools console output
        let capturedData: any = null;
        const consoleHandler = (msg: any) => {
            if (msg.type() === 'log' && msg.args().length > 0) {
                // Last argument is typically the logged object in devtools calls
                msg.args()
                    .at(-1)
                    ?.jsonValue()
                    .then((value: any) => {
                        if (Array.isArray(value)) {
                            capturedData = value;
                        }
                    })
                    .catch(() => {
                        // Ignore non-serializable objects
                    });
            }
        };

        page.on('console', consoleHandler);
        const devtoolsBtn = chamberFrame.locator('span.devtools').first();
        await expect(devtoolsBtn).toBeVisible();
        await devtoolsBtn.click();

        // Wait for captured data from console
        await page.waitForTimeout(500);
        page.off('console', consoleHandler);

        // Assertions on devtools logged data
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
});
