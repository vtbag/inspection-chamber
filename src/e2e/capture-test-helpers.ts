import { expect, type FrameLocator, type Locator, type Page } from '@playwright/test';
import { CHAMBER_CONFIG } from './chamber-config';
import {
	setupFrames,
	closeWelcomePanelIfOpen,
	ensureCaptureModeEnabled,
	waitForCaptureView,
} from './fixtures/capture-harness';
import type {
	CaptureTestConfig,
	GroupIdentityExpectation,
	GroupPresence,
} from './capture-test-config';

/**
 * Trigger a view transition by clicking the trigger button for a given test type.
 */
async function triggerCaptureTransition(frame: FrameLocator, testType: string): Promise<void> {
	await frame.locator(`#trigger-${testType}`).click();
}

/**
 * Open capture view: set up frames, enable capture mode, trigger transition with given type
 */
export async function openCaptureView(page: Page, testType: string) {
	const { frame, chamberFrame } = await setupFrames(page, {
		url: '/e2e/capture-basic/',
		waitUntil: 'commit', // Handle IC's document.open() via requestIdleCallback
		openChamber: true,
	});

	await closeWelcomePanelIfOpen(chamberFrame);
	await ensureCaptureModeEnabled(chamberFrame);
	await triggerCaptureTransition(frame, testType);
	const captureView = await waitForCaptureView(chamberFrame);

	return { captureView, chamberFrame };
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
type CaptureIdentityDataAttribute =
	| { name: string; value: string }
	| { name: string; oldValue: string; newValue: string };

type CaptureIdentityOptions = {
	groupName: string;
	dataAttribute: CaptureIdentityDataAttribute;
	expectSameElement?: boolean;
};

type VerifyDevtoolsOptions = {
	targetTag: string;
	expectedGroups: string[];
	oldOnlyGroups?: string[];
	newOnlyGroups?: string[];
	verifyIdentity?: CaptureIdentityOptions;
	verifyIdentities?: CaptureIdentityOptions[];
};

type CaptureTextAssertion = {
	pattern: RegExp;
	present: boolean;
};

type RunCaptureTestOptions = {
	testType: string;
	config?: CaptureTestConfig;
	header?: {
		selector: string;
		oldTypes?: string;
		newTypes?: string;
	};
	imageSelectors?: string[];
	textAssertions?: CaptureTextAssertion[];
	expectError?: boolean;
};

function toDevtoolsIdentity(
	groupName: string,
	identity: GroupIdentityExpectation
): CaptureIdentityOptions {
	if (identity.oldValue === identity.newValue) {
		return {
			groupName,
			dataAttribute: {
				name: identity.attributeName,
				value: identity.oldValue,
			},
			expectSameElement: identity.expectSameElement,
		};
	}

	return {
		groupName,
		dataAttribute: {
			name: identity.attributeName,
			oldValue: identity.oldValue,
			newValue: identity.newValue,
		},
		expectSameElement: identity.expectSameElement,
	};
}

function groupNamesByPresence(
	groups: { name: string; presence: GroupPresence }[],
	presence: GroupPresence
) {
	return groups.filter((group) => group.presence === presence).map((group) => group.name);
}

export async function runCaptureTest(page: Page, options: RunCaptureTestOptions): Promise<void> {
	const { captureView } = await openCaptureView(page, options.testType);

	// For error cases, skip capture verification and only check text assertions
	if (options.expectError) {
		for (const assertion of options.textAssertions ?? []) {
			if (assertion.present) {
				await expect(captureView).toContainText(assertion.pattern);
			} else {
				await expect(captureView).not.toContainText(assertion.pattern);
			}
		}
		return;
	}

	if (!options.config) {
		throw new Error('config is required when expectError is not true');
	}

	if (options.header) {
		await verifyCaptureHeader(captureView, options.header);
	}

	const expectedGroups = options.config.groups.map((group) => group.name);
	await verifyCapturedGroups(captureView, expectedGroups);

	if (options.imageSelectors && options.imageSelectors.length > 0) {
		await verifyImageElements(captureView, options.imageSelectors);
	}

	for (const assertion of options.textAssertions ?? []) {
		if (assertion.present) {
			await expect(captureView).toContainText(assertion.pattern);
		} else {
			await expect(captureView).not.toContainText(assertion.pattern);
		}
	}

	const oldOnlyGroups = groupNamesByPresence(options.config.groups, 'old-only');
	const newOnlyGroups = groupNamesByPresence(options.config.groups, 'new-only');
	const verifyIdentities = options.config.groups
		.filter((group) => !!group.identity)
		.map((group) => toDevtoolsIdentity(group.name, group.identity!));

	await verifyDevtoolsConsoleOutput(page, captureView, {
		targetTag: options.config.targetTag,
		expectedGroups,
		oldOnlyGroups: oldOnlyGroups.length > 0 ? oldOnlyGroups : undefined,
		newOnlyGroups: newOnlyGroups.length > 0 ? newOnlyGroups : undefined,
		verifyIdentity: verifyIdentities[0],
		verifyIdentities: verifyIdentities.length > 1 ? verifyIdentities.slice(1) : undefined,
	});
}

async function waitForDevtoolsLog(page: Page, captureView: Locator) {
	const consoleEvent = page.waitForEvent('console', {
		predicate: (msg) =>
			msg.text().includes(CHAMBER_CONFIG.console.inspectionChamberMarker) &&
			msg.text().includes(CHAMBER_CONFIG.console.viewTransitionMarker),
	});

	await captureView.locator(CHAMBER_CONFIG.selectors.captureView.devtoolsButton).click();
	return consoleEvent;
}

function verifyDevtoolsMessageText(logText: string) {
	expect(logText).toContain(CHAMBER_CONFIG.console.inspectionChamberMarker);
	expect(logText).toContain(CHAMBER_CONFIG.console.viewTransitionMarker);
	expect(logText).toContain(CHAMBER_CONFIG.console.startedAtPattern);
	expect(logText).toContain(CHAMBER_CONFIG.console.codeLocationPattern);
	expect(logText).toContain(CHAMBER_CONFIG.console.elementsCapturedPattern);
}

async function findTargetElementTag(args: any[]): Promise<string | null> {
	for (const arg of args) {
		try {
			const tag = await arg.evaluate((node: any) =>
				node?.nodeType === 1 ? node.tagName.toLowerCase() : null
			);
			if (tag) {
				return tag;
			}
		} catch {
			/* not an element */
		}
	}
	return null;
}

async function findCaptureArg(args: any[], expectedGroups: string[]): Promise<any | null> {
	const expectedSorted = [...expectedGroups].sort();

	for (const arg of args) {
		try {
			const match = await arg.evaluate((obj: any, expected: string[]) => {
				if (!obj || typeof obj !== 'object' || obj.nodeType) {
					return false;
				}

				const keys = Object.keys(obj).sort();
				if (keys.length !== expected.length) {
					return false;
				}

				for (let i = 0; i < keys.length; i++) {
					if (keys[i] !== expected[i]) {
						return false;
					}
				}

				return expected.every((name) => {
					const group = obj[name];
					if (!group || typeof group !== 'object') {
						return false;
					}
					const oldElem = group.oldNamedElement?.element;
					const newElem = group.newNamedElement?.element;
					const oldOk = !oldElem || typeof oldElem === 'object';
					const newOk = !newElem || typeof newElem === 'object';
					return oldOk && newOk;
				});
			}, expectedSorted);

			if (match) {
				return arg;
			}
		} catch {
			/* not our object */
		}
	}
	return null;
}

async function getCaptureKeys(captureArg: any): Promise<string[]> {
	return captureArg.evaluate((obj: any) => Object.keys(obj).sort());
}

async function verifyGroupPresence(captureArg: any, options: VerifyDevtoolsOptions): Promise<void> {
	const oldOnly = new Set(options.oldOnlyGroups ?? []);
	const newOnly = new Set(options.newOnlyGroups ?? []);

	for (const groupName of options.expectedGroups) {
		if (oldOnly.has(groupName)) {
			const hasOldOnly = await captureArg.evaluate(
				(captured: Record<string, any>, name: string) =>
					!!captured[name]?.oldNamedElement && !captured[name]?.newNamedElement,
				groupName
			);
			expect(hasOldOnly).toBe(true);
			continue;
		}

		if (newOnly.has(groupName)) {
			const hasNewOnly = await captureArg.evaluate(
				(captured: Record<string, any>, name: string) =>
					!captured[name]?.oldNamedElement && !!captured[name]?.newNamedElement,
				groupName
			);
			expect(hasNewOnly).toBe(true);
			continue;
		}

		const hasNamedElements = await captureArg.evaluate(
			(captured: Record<string, any>, name: string) =>
				!!captured[name]?.oldNamedElement && !!captured[name]?.newNamedElement,
			groupName
		);
		expect(hasNamedElements).toBe(true);
	}
}

async function verifyGroupIdentity(
	captureArg: any,
	verifyIdentity: CaptureIdentityOptions
): Promise<void> {
	const dataAttr = verifyIdentity.dataAttribute;
	const oldValue = 'value' in dataAttr ? dataAttr.value : dataAttr.oldValue;
	const newValue = 'value' in dataAttr ? dataAttr.value : dataAttr.newValue;

	const identityResult = await captureArg.evaluate(
		(
			captured: Record<string, any>,
			opts: { groupName: string; attrName: string; oldValue: string; newValue: string }
		) => {
			const group = captured[opts.groupName];
			if (!group) return { error: 'Group not found' };

			const oldElem = group.oldNamedElement?.element;
			const newElem = group.newNamedElement?.element;

			if (!oldElem || !newElem) return { error: 'Elements not found' };
			if (
				typeof oldElem.getAttribute !== 'function' ||
				typeof newElem.getAttribute !== 'function'
			) {
				return { error: 'Named elements are not attribute-capable nodes' };
			}

			return {
				oldDataAttr: oldElem.getAttribute(opts.attrName),
				newDataAttr: newElem.getAttribute(opts.attrName),
				isSameObject: oldElem === newElem,
			};
		},
		{
			groupName: verifyIdentity.groupName,
			attrName: verifyIdentity.dataAttribute.name,
			oldValue,
			newValue,
		}
	);

	if ('error' in identityResult) {
		throw new Error(`Element identity verification failed: ${identityResult.error}`);
	}
	expect(identityResult.oldDataAttr).toBe(oldValue);
	expect(identityResult.newDataAttr).toBe(newValue);
	const expectSame = verifyIdentity.expectSameElement ?? true;
	expect(identityResult.isSameObject).toBe(expectSame);
}

export async function verifyDevtoolsConsoleOutput(
	page: Page,
	captureView: Locator,
	options: VerifyDevtoolsOptions
): Promise<void> {
	const devtoolsLog = await waitForDevtoolsLog(page, captureView);
	verifyDevtoolsMessageText(devtoolsLog.text());

	const args = devtoolsLog.args();
	expect(args.length).toBeGreaterThan(0);

	const targetTag = await findTargetElementTag(args);
	expect(targetTag).toBe(options.targetTag);

	const captureArg = await findCaptureArg(args, options.expectedGroups);
	expect(captureArg).not.toBeNull();

	if (!captureArg) {
		return;
	}

	await verifyGroupPresence(captureArg, options);

	if (options.verifyIdentity) {
		await verifyGroupIdentity(captureArg, options.verifyIdentity);
	}

	for (const identity of options.verifyIdentities ?? []) {
		await verifyGroupIdentity(captureArg, identity);
	}

	const capturedKeys = await getCaptureKeys(captureArg);
	expect(capturedKeys).toEqual([...options.expectedGroups].sort());
}
