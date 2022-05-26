const { clickButton, fillInput, waitForElement, waitForElementToDisappear } = require("../selectors");
const {expect } = require('@playwright/test');

module.exports = async (page, spaceName, fail=false) => {
    await clickButton(page, "space-tab", 30000, true);
    await waitForElement(page, "tablerow-0");
    const spaces = await page.$$("[class=scrollable-container] tbody tr");
    const len = await spaces.length;
    await page.locator("tr", {
        hasText: spaceName
    }).locator("[data-testid=moreMenu]").click();
    await page.locator('text=Delete').click();
    if (!fail){
        await fillInput(page, "spaceName", spaceName);
        await page.locator('text=Yes').click();
        await waitForElementToDisappear(page, "spaceName");
        const newSpaces = await page.$$("[class=scrollable-container] tbody tr");
        expect(len).toBe(await newSpaces.length + 1);
    }
    else {
        await fillInput(page, "spaceName", "");
        await page.locator('text=Yes').click();
        await page.waitForSelector("[data-test=spaceName-has-error]");
        const error = await page.locator("[data-test=spaceName-has-error]").innerText();
        expect(error).toBe(`The name you entered does not match the name of the space.`);
        await page.locator("text=Cancel").click();
        await expect(page.locator("[data-test=tablerow-0]")).toBeVisible();
        const newSpaces = await page.$$("[class=scrollable-container] tbody tr");
        expect(len).toBe(await newSpaces.length);
    }
    
};