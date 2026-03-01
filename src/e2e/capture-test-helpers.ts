import { expect, type Locator, type Page } from '@playwright/test';

/**
 * Perform a long tap (1 second press) on a locator
 */
async function longTap(locator: Locator, page: Page): Promise<void> {
	const box = await locator.boundingBox();
	if (!box) throw new Error('Could not get bounding box for long-tap');
	const centerX = box.x + box.width / 2;
	const centerY = box.y + box.height / 2;

	await page.mouse.move(centerX, centerY);
	await page.mouse.down();
	await page.waitForTimeout(1000);
	await page.mouse.up();
}

/**
 * Navigate to capture-basic test page, long-tap to open chamber, return frame locators
 */
async function frames(page: Page) {
	// Use 'commit' instead of default 'load' because IC's attach.js calls
	// document.open() via requestIdleCallback, which in Firefox can abort
	// pending module scripts and prevent the load event from ever firing.
	await page.goto('/e2e/capture-basic/', { waitUntil: 'commit' });

	const resizeHandle = page.locator('.window .resize-handle.edge.s').first();
	await expect(resizeHandle).toBeVisible();
	await longTap(resizeHandle, page);
	await page.waitForTimeout(500);

	const frameLocator = page.locator('iframe').nth(1);
	await expect(frameLocator).toBeVisible();
	const frame = frameLocator.contentFrame();

	const chamberFrameLocator = page.locator('iframe').nth(0);
	await expect(chamberFrameLocator).toBeVisible();
	const chamberFrame = chamberFrameLocator.contentFrame();

	return { frame, chamberFrame };
}

/**
 * Open capture view: set up frames, enable capture mode, trigger transition with given type
 */
export async function openCaptureView(page: Page, testType: string) {
	const { frame, chamberFrame } = await frames(page);

	// Close welcome panel if open
	const welcomeDetails = chamberFrame.locator('vtbag-ic-welcome details').first();
	if ((await welcomeDetails.count()) > 0) {
		await welcomeDetails.locator('summary').first().click();
		await expect(welcomeDetails).toHaveJSProperty('open', false);
	}

	// Enable capture mode
	const captureCheckbox = chamberFrame.locator('#capture');
	if ((await captureCheckbox.count()) > 0 && !(await captureCheckbox.isChecked())) {
		await captureCheckbox.click({ force: true });
	}

	// Trigger the transition for this test type
	await frame.locator(`#trigger-${testType}`).click();

	const captureView = chamberFrame.locator('vtbag-ic-view-transition-capture');
	await expect(captureView).toBeVisible({ timeout: 10000 });

	return { captureView };
}

/**
 * Verify capture header (call type, timestamp, transition types)
 * When oldTypes/newTypes are omitted, type assertions are skipped (browser support varies).
 */
export async function verifyCaptureHeader(
	captureView: Locator,
	options: { selector: string; oldTypes?: string; newTypes?: string }
) {
	await expect(captureView).toContainText(
		new RegExp(`Same-document call on ${options.selector}, started at \\d{2}:\\d{2}:\\d{2}.\\d{3}`)
	);
	if (options.oldTypes !== undefined) {
		await expect(captureView).toContainText(
			new RegExp(
				`Active view transition types during capture of old images: ${options.oldTypes}`,
				'i'
			)
		);
	}
	if (options.newTypes !== undefined) {
		await expect(captureView).toContainText(
			new RegExp(
				`Active view transition types during capture of new images: ${options.newTypes}`,
				'i'
			)
		);
	}
}

/**
 * Verify captured groups count and names in display order
 */
export async function verifyCapturedGroups(captureView: Locator, expectedGroups: string[]) {
	await expect(captureView.locator('summary').first()).toHaveText(/Named elements/i);

	const capturedGroups = captureView.locator('.content > details');
	await expect(capturedGroups.first()).toBeVisible();
	expect(await capturedGroups.count()).toBe(expectedGroups.length);

	const groupSummaries = await capturedGroups.locator('summary').allTextContents();
	expectedGroups.forEach((groupName, idx) => {
		expect(groupSummaries[idx]).toBe(`Group ${groupName}`);
	});
}

/**
 * Verify old and new image elements are displayed for given selectors
 */
export async function verifyImageElements(captureView: Locator, selectors: string[]) {
	for (const selector of selectors) {
		await expect(captureView).toContainText(new RegExp(`old image element: ${selector}`, 'i'));
		await expect(captureView).toContainText(new RegExp(`new image element: ${selector}`, 'i'));
	}
}

/**
 * Click devtools print icon and verify console output
 */
export async function verifyDevtoolsConsoleOutput(
	page: Page,
	captureView: Locator,
	options: {
		targetTag: string;
		expectedGroups: string[];
		oldOnlyGroups?: string[];
		newOnlyGroups?: string[];
		verifyIdentity?: {
			groupName: string;
			dataAttribute:
				| { name: string; value: string }
				| { name: string; oldValue: string; newValue: string };
			expectSameElement?: boolean;
		};
	}
): Promise<void> {
	const consoleEvent = page.waitForEvent('console', {
		predicate: (msg) =>
			msg.text().includes('[inspection chamber]') && msg.text().includes('View transition on'),
	});

	await captureView.locator('summary .devtools').click();
	const devtoolsLog = await consoleEvent;

	// Verify console message text
	expect(devtoolsLog.text()).toContain('[inspection chamber]');
	expect(devtoolsLog.text()).toContain('View transition on');
	expect(devtoolsLog.text()).toContain('was started at');
	expect(devtoolsLog.text()).toContain('from this code location:');
	expect(devtoolsLog.text()).toContain('It captured the following elements');

	const args = devtoolsLog.args();
	expect(args.length).toBeGreaterThan(0);

	// Find the HTML element arg
	let targetTag: string | null = null;
	for (const arg of args) {
		try {
			const tag = await arg.evaluate((node: any) =>
				node?.nodeType === 1 ? node.tagName.toLowerCase() : null
			);
			if (tag) {
				targetTag = tag;
				break;
			}
		} catch {
			/* not an element */
		}
	}
	expect(targetTag).toBe(options.targetTag);

	// Find the captures object arg and verify group keys
	let capturedKeys: string[] | null = null;
	for (const arg of args) {
		try {
			const keys = await arg.evaluate((obj: any) => {
				if (obj && typeof obj === 'object' && !obj.nodeType) {
					const k = Object.keys(obj);
					return k.length > 0 ? k.sort() : null;
				}
				return null;
			});
			if (keys && keys.length === options.expectedGroups.length) {
				capturedKeys = keys;
				const oldOnly = new Set(options.oldOnlyGroups ?? []);
				const newOnly = new Set(options.newOnlyGroups ?? []);
				for (const groupName of options.expectedGroups) {
					if (oldOnly.has(groupName)) {
						const hasOldOnly = await arg.evaluate(
							(captured: Record<string, any>, name: string) =>
								!!captured[name]?.oldNamedElement && !captured[name]?.newNamedElement,
							groupName
						);
						expect(hasOldOnly).toBe(true);
					} else if (newOnly.has(groupName)) {
						const hasNewOnly = await arg.evaluate(
							(captured: Record<string, any>, name: string) =>
								!captured[name]?.oldNamedElement && !!captured[name]?.newNamedElement,
							groupName
						);
						expect(hasNewOnly).toBe(true);
					} else {
						const hasNamedElements = await arg.evaluate(
							(captured: Record<string, any>, name: string) =>
								!!captured[name]?.oldNamedElement && !!captured[name]?.newNamedElement,
							groupName
						);
						expect(hasNamedElements).toBe(true);
					}
				}

				// Optionally verify element identity
				if (options.verifyIdentity) {
					const dataAttr = options.verifyIdentity.dataAttribute;
					const oldValue = 'value' in dataAttr ? dataAttr.value : dataAttr.oldValue;
					const newValue = 'value' in dataAttr ? dataAttr.value : dataAttr.newValue;

					const identityResult = await arg.evaluate(
						(
							captured: Record<string, any>,
							opts: { groupName: string; attrName: string; oldValue: string; newValue: string }
						) => {
							const group = captured[opts.groupName];
							if (!group) return { error: 'Group not found' };

							const oldElem = group.oldNamedElement;
							const newElem = group.newNamedElement;

							if (!oldElem || !newElem) return { error: 'Elements not found' };

							return {
								oldDataAttr: oldElem.getAttribute(opts.attrName),
								newDataAttr: newElem.getAttribute(opts.attrName),
								isSameObject: oldElem === newElem,
							};
						},
						{
							groupName: options.verifyIdentity.groupName,
							attrName: options.verifyIdentity.dataAttribute.name,
							oldValue,
							newValue,
						}
					);

					if ('error' in identityResult) {
						throw new Error(`Element identity verification failed: ${identityResult.error}`);
					}
					expect(identityResult.oldDataAttr).toBe(oldValue);
					expect(identityResult.newDataAttr).toBe(newValue);
					// Check if expecting same or different element
					const expectSame = options.verifyIdentity.expectSameElement ?? true;
					expect(identityResult.isSameObject).toBe(expectSame);
				}

				break;
			}
		} catch {
			/* not our object */
		}
	}
	expect(capturedKeys).toEqual([...options.expectedGroups].sort());
}
