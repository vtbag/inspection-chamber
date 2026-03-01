import { expect, type Locator, type Page } from '@playwright/test';
import { CHAMBER_CONFIG, getTimeout, getSelectorPath } from './chamber-config';

/**
 * Perform a long tap (press) on a locator
 */
async function longTap(locator: Locator, page: Page): Promise<void> {
	const box = await locator.boundingBox();
	if (!box) throw new Error('Could not get bounding box for long-tap');
	const centerX = box.x + box.width / 2;
	const centerY = box.y + box.height / 2;

	await page.mouse.move(centerX, centerY);
	await page.mouse.down();
	await page.waitForTimeout(getTimeout('longTap'));
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

	const resizeHandle = page.locator(CHAMBER_CONFIG.selectors.window.resizeHandle).first();
	await expect(resizeHandle).toBeVisible();
	await longTap(resizeHandle, page);
	await page.waitForTimeout(getTimeout('afterLongTap'));

	const frameLocator = page.locator('iframe').nth(CHAMBER_CONFIG.selectors.testFrame.index);
	await expect(frameLocator).toBeVisible();
	const frame = frameLocator.contentFrame();

	const chamberFrameLocator = page
		.locator('iframe')
		.nth(CHAMBER_CONFIG.selectors.chamberFrame.index);
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
	const welcomeDetails = chamberFrame
		.locator(CHAMBER_CONFIG.selectors.chamber.welcomePanel)
		.first();
	if ((await welcomeDetails.count()) > 0) {
		await welcomeDetails.locator(CHAMBER_CONFIG.selectors.chamber.welcome.summary).first().click();
		await expect(welcomeDetails).toHaveJSProperty('open', false);
	}

	// Enable capture mode
	const captureCheckbox = chamberFrame.locator(CHAMBER_CONFIG.selectors.chamber.captureCheckbox);
	if ((await captureCheckbox.count()) > 0 && !(await captureCheckbox.isChecked())) {
		await captureCheckbox.click({ force: true });
	}

	// Trigger the transition for this test type
	await frame.locator(`#trigger-${testType}`).click();

	const captureView = chamberFrame.locator(CHAMBER_CONFIG.selectors.chamber.viewTransitionCapture);
	await expect(captureView).toBeVisible({ timeout: getTimeout('captureView') });

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
	await expect(
		captureView.locator(CHAMBER_CONFIG.selectors.captureView.summary).first()
	).toHaveText(/Named elements/i);

	const capturedGroups = captureView.locator(CHAMBER_CONFIG.selectors.captureView.groupsContainer);
	await expect(capturedGroups.first()).toBeVisible();
	expect(await capturedGroups.count()).toBe(expectedGroups.length);

	const groupSummaries = await capturedGroups
		.locator(CHAMBER_CONFIG.selectors.captureView.summary)
		.allTextContents();
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
			msg.text().includes(CHAMBER_CONFIG.console.inspectionChamberMarker) &&
			msg.text().includes(CHAMBER_CONFIG.console.viewTransitionMarker),
	});

	await captureView.locator(CHAMBER_CONFIG.selectors.captureView.devtoolsButton).click();
	const devtoolsLog = await consoleEvent;

	// Verify console message text
	expect(devtoolsLog.text()).toContain(CHAMBER_CONFIG.console.inspectionChamberMarker);
	expect(devtoolsLog.text()).toContain(CHAMBER_CONFIG.console.viewTransitionMarker);
	expect(devtoolsLog.text()).toContain(CHAMBER_CONFIG.console.startedAtPattern);
	expect(devtoolsLog.text()).toContain(CHAMBER_CONFIG.console.codeLocationPattern);
	expect(devtoolsLog.text()).toContain(CHAMBER_CONFIG.console.elementsCapuredPattern);

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
