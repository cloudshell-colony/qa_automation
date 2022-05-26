const { clickButton, fillInput, waitForElement } = require("../selectors");
const {expect } = require('@playwright/test');

module.exports = async (page, spaceName, newName) => {
    await clickButton(page, "space-tab", 30000, true);
    await waitForElement(page, "tablerow-0");
    const spaces = await page.$$("[class=scrollable-container] tbody tr");
    const len = await spaces.length;
    await page.locator("tr", {
        hasText: spaceName
    }).locator("[data-testid=moreMenu]").click();
    await page.locator('text=Edit').click();
    await fillInput(page, "spaceName", newName);
    await page.locator('text=Apply').click();
    const newSpaces = await page.$$("[class=scrollable-container] tbody tr");
    expect(len).toBe(await newSpaces.length);
}