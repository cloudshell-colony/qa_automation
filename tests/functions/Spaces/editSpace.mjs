import { clickButton, fillInput, waitForElement } from '../selectors.mjs';
import {expect }from '@playwright/test';

export default async (page, spaceName, newName) => {
    await page.waitForSelector('[role=rowgroup]');
    const spaces = await page.$$("[class=scrollable-container] tbody tr");
    const len = await spaces.length;
    await page.locator(`[data-test=space-row-${spaceName}]`).locator("[data-testid=moreMenu]").click();
    await page.locator(`[data-test=space-row-${spaceName}]`).locator('text=Edit').click();
    await fillInput(page, "spaceName", newName);
    await page.locator('text=Apply').click();
    await page.locator(`[data-test=space-row-${newName}]`)
    const newSpaces = await page.$$("[class=scrollable-container] tbody tr");
    expect(len).toBe(await newSpaces.length);
}