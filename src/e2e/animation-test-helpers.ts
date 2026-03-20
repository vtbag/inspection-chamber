import { expect, type FrameLocator } from '@playwright/test';

/**
 * Open a specific details element in the animations component by its class name.
 * @param chamberFrame - The chamber frame locator
 * @param detailClass - The class of the details element (e.g., 'groups', 'pseudos')
 */
export async function openAnimationDetails(
	chamberFrame: FrameLocator,
	detailClass: string
): Promise<void> {
	const detail = chamberFrame.locator(`details.${detailClass}`);
	await detail.locator('summary').click();
	await expect(detail).toHaveAttribute('open', '');
}

/**
 * Verify that the animation groups section contains all expected group names in order.
 * @param chamberFrame - The chamber frame locator
 * @param expectedGroups - Array of expected group names in expected order
 */
export async function verifyAnimationGroups(
	chamberFrame: FrameLocator,
	expectedGroups: string[]
): Promise<void> {
	const groupsDetail = chamberFrame.locator('details.groups');

	// Ensure the details is open
	const isOpen = await groupsDetail.getAttribute('open');
	if (isOpen === null) {
		await groupsDetail.locator('summary').click();
		await expect(groupsDetail).toHaveAttribute('open', '');
	}

	const readGroups = async () => {
		const buttons = groupsDetail.locator('.children:visible > button[data-group]');
		const names = await buttons.allTextContents();
		return names.map((name) => name.trim()).filter(Boolean);
	};

	await expect.poll(readGroups, { timeout: 5000 }).toEqual(expectedGroups);
}

/**
 * Verify that the pseudo-elements tree contains expected pseudo-element types.
 * @param chamberFrame - The chamber frame locator
 * @param expectedPseudos - Array of expected pseudo-element types (e.g., ['group', 'image-pair', 'old', 'new'])
 * @param groupName - Optional group name to check within. If not provided, checks the entire tree.
 */
export async function verifyPseudoElements(
	chamberFrame: FrameLocator,
	expectedPseudos: string[],
	groupName?: string
): Promise<void> {
	const pseudosDetail = chamberFrame.locator('details.pseudos');

	// Ensure the details is open
	const isOpen = await pseudosDetail.getAttribute('open');
	if (isOpen === null) {
		await pseudosDetail.locator('summary').click();
		await expect(pseudosDetail).toHaveAttribute('open', '');
	}

	// Get the pseudo-elements text
	let pseudosText = await pseudosDetail.textContent();

	// If a specific group name is provided, verify within that context
	if (groupName) {
		// For now, just verify the group name appears in the text
		// A more sophisticated implementation could parse the tree structure
		expect(pseudosText).toContain(groupName);
	}

	// Verify each expected pseudo-element type is present
	for (const pseudo of expectedPseudos) {
		expect(pseudosText).toContain(pseudo);
	}
}
