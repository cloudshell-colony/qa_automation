const { clickButton, fillInput, waitForElement, waitForInnerText, getElement } = require("../selectors");
const {expect } = require('@playwright/test');


module.exports = async (page, spaceName, exists=false) => {
    await clickButton(page, "space-tab", 30000, true);
    await waitForElement(page, "tablerow-0");
    const spaces = await page.$$("[class=scrollable-container] tbody tr");
    const len = await spaces.length;
    await clickButton(page, "create-new-space");
    await waitForElement(page, "create-new-space-popup");
    await fillInput(page, "create-new-space-popup", spaceName);
    await clickButton(page, "submit");
    //if name is empty proper error should be displayed
    if(spaceName == ""){
        await waitForElement(page, "name-has-error");
        const msg = await page.locator("[data-test=name-has-error]").innerText();
        expect(msg).toBe("The Space Name field is required.");
        await page.locator("text=Cancel").click();
    }
    //if space doesn't already exist then it should be created
    else if(!exists){
        await waitForElement(page, `tablerow-${len}`, 3000);
        const newSpaces = await page.$$("[class=scrollable-container] tbody tr");
        expect(len).toBe(await newSpaces.length - 1);
    }
    //if space already exists we should get an error
    //need to add catch response
    else{
        await page.waitForSelector("[data-testid=error-details-text]");
        const error = await page.locator("[data-testid=error-details-text]").innerText();
        expect(error).toBe(`Space name ${spaceName} is already taken. Please try a different one`);
        await clickButton(page, 'close-popup');
        const newSpaces = await page.$$("[class=scrollable-container] tbody tr");
        expect(len).toBe(await newSpaces.length);
    }
};