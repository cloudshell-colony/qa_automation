import { clickButton, fillInput, waitForElement } from '../selectors.mjs';
import {expect } from '@playwright/test';
import goToSpaces from '../goToSpaces.mjs';


export default async (page, spaceName, exists=false) => {
    await goToSpaces(page);
    const spaces = await page.$$("[class=scrollable-container] tbody tr");
    const len = await spaces.length;
    await clickButton(page, "create-new-space");
    await waitForElement(page, "create-new-space-popup");
    await fillInput(page, "create-new-space-popup", spaceName);
    await clickButton(page, "create-space");
    //if name is empty proper error should be displayed
    if(spaceName == ""){
        await waitForElement(page, "name-has-error");
        const msg = await page.locator("[data-test=name-has-error]").innerText();
        expect(msg).toBe("The Space Name field is required.");
        await clickButton(page, 'close-modal');
    }
    //if space doesn't already exist then it should be created
    else if(!exists){
        await waitForElement(page, `setup-modal-container`, 3000);
        await clickButton(page, 'close-modal');
    }
    //if space already exists we should get an error
    //need to add catch response
    else{
        await page.waitForSelector("[data-testid=error-details-text]");
        const error = await page.locator("[data-testid=error-details-text]").innerText();
        expect(error).toBe(`Space name ${spaceName} is already taken. Please try a different one`);
        await clickButton(page, 'close-popup');
        await clickButton(page, 'close-modal');
        const newSpaces = await page.$$("[class=scrollable-container] tbody tr");
        expect(len).toBe(await newSpaces.length);
    }
};