import {waitForElementToDisappear} from '../selectors.mjs';
import {expect} from '@playwright/test';

export default async (page, spaceName, fail=false) => {
    await page.waitForSelector('[role=rowgroup]');
    const spaces = await page.$$("[class=scrollable-container] tbody tr");
    const len = await spaces.length;
    await page.locator(`[data-test=space-row-${spaceName}]`).locator("[data-testid=moreMenu]").click();
    await page.locator(`[data-test=space-row-${spaceName}]`).locator('text=Delete').click();
    if (!fail){
        await page.fill(`[data-test=spaceName]`, spaceName);
        await page.locator('text=Yes').click();
        await waitForElementToDisappear(page, "spaceName");
        const newSpaces = await page.$$("[class=scrollable-container] tbody tr");
        expect(len).toBe(await newSpaces.length + 1);
    }
    else {
        await page.fill(`[data-test=spaceName]`, "");
        await page.locator('text=Yes').click();
        await page.waitForSelector("[data-test=spaceName-has-error]");
        const error = await page.locator("[data-test=spaceName-has-error]").innerText();
        expect(error).toBe(`The name you entered does not match the name of the space.`);
        await page.locator("text=Cancel").click();
        await expect(page.locator(`[data-test=space-row-${spaceName}]`)).toBeVisible();
        const newSpaces = await page.$$("[class=scrollable-container] tbody tr");
        expect(len).toBe(await newSpaces.length);
    }
    
};