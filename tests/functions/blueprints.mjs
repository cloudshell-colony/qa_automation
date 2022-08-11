import { expect } from "@playwright/test";
import fetch from "node-fetch";
import { goToSpace } from "./spaces.mjs";


export const getPublishedBlueprints = async (session, space_name, myURL) => {

    const PBPList = await fetch(`${myURL}/api/spaces/${space_name}/blueprints`, {
        "method": "GET",
        "headers": {
            'Authorization': `Bearer ${session}`,
            'Content-Type': 'application/json'
        }
    });
    return (PBPList);
};

export const countBlueprintsInSpace = async (page, baseURL, space) => {
    //Assumes you are already in blueprints page
    await page.waitForResponse(`${baseURL}/api/spaces/${space}/blueprints`);
    //await page.waitForSelector("[data-test=space-blueprints-tab-test]");
    const visi = await page.isVisible('button:has-text("Add a Repository")', { timeout: 3000 });
    if (visi) {
        return 0;
    }
    else {
        await page.waitForSelector('div:has-text("Launch Sandbox")', { timeout: 3000 });
        const BPList = page.locator("tr", { has: page.locator("data-testid=moreMenu") });
        const num = await BPList.count();
        return num;
    }
};

export const enterBlueprintPage = async (page) => {
    page.click('[data-test="blueprints-nav-link"]');
    await page.waitForNavigation();
    const visi = await page.isVisible('button:has-text("Add a Repository")', { timeout: 3000 });
    if (!visi) {
        await page.waitForSelector('div:has-text("Launch Sandbox")');
        await page.waitForSelector('.main-table-container-scrollable');
    }
};

export const publishBlueprint = async (page, BPFullName) => {
    await page.waitForLoadState();
    const isPublished = await page.isVisible(`[data-test="tf-based-blueprint-row-${BPFullName}"] [data-toggle="true"]`)
    if (!isPublished) {
        console.log("publishing blueprint: " + BPFullName);
        await page.click(`[data-test="tf-based-blueprint-row-${BPFullName}"] [data-test="blueprint-publish-toggle"]`);
    } else {
        console.log(`bBueprint: ${BPFullName} was already published`);
    }
};

export const publishSampleBlueprint = async (page, BPFullName) => {
    await page.waitForLoadState();
    await page.click(`[data-test="blueprint-row-${BPFullName}"] [data-test="blueprint-publish-toggle"]`);
};

export const launchAutoGeneratedBlueprint = async (page, BPFullName) => {
    await page.click(`[data-test="tf-based-blueprint-row-${BPFullName}"] button:has-text("Launch Sandbox")`);
    const sandboxName = await page.getAttribute("[data-test=sandboxName]", "value");
    console.log(`the new sandbox name is: ${sandboxName}`);
    const result = sandboxName.includes(BPFullName, 0);
    expect(result, `the sandbox name: \"${sandboxName}\" should have started with the BP name: \"${BPFullName}\"`).toBeTruthy();
    return sandboxName;
};

export const launchBlueprintFromBPList = async (page, sampleFullName) => {
    await page.click(`[data-test="blueprint-row-${sampleFullName}"] button:has-text("Launch Sandbox")`);
    const sandboxName = await page.getAttribute("[data-test=sandboxName]", "value");
    console.log(`the new sandbox name is: ${sandboxName}`);
    const result = sandboxName.includes(sampleFullName, 0);
    expect(result, `the sandbox name: \"${sandboxName}\" should have started with the BP name: \"${sampleFullName}\"`).toBeTruthy();
    await page.locator('[data-test="wizard-next-button"]').click();
    await page.waitForSelector('[data-test="sandbox-info-column"]');
    return sandboxName;
};

export const launchBlueprintFromSandboxPage = async (page, sampleFullName) => {
    await page.click('[data-test="create-sandbox-btn"]');
    await page.click(`[data-test="blueprint-tile-[Sample]${sampleFullName}"]`);
    const sandboxName = await page.getAttribute("[data-test=sandboxName]", "value");
    console.log(`the new sandbox name is: ${sandboxName}`);
    const result = sandboxName.includes(sampleFullName, 0);
    expect(result, `the sandbox name: \"${sandboxName}\" should have started with the BP name: \"${sampleFullName}\"`).toBeTruthy();
    await page.locator('[data-test="wizard-next-button"]').click();
    await page.waitForSelector('[data-test="sandbox-info-column"]');
    return sandboxName;
};

export const getBlueprintErrors = async (page, BPName) => {
    await page.waitForSelector(`[data-test=blueprint-row-${BPName}]`);
    const bpRow = await page.locator(`[data-test=blueprint-row-${BPName}]`);
    const errList = [];
    const list = await bpRow.locator("ol li");
    const count = await list.count();
    for (let i =0; i< count; i++){
        console.log(`Received error: "` + await list.nth(i).innerText() + `" from "${BPName}" blueprint`);
        errList.push(await list.nth(i))
    };
    return errList;
}

/*
errList should contain the locators of the errors, as returned by the getBlueprintErrors function
expectedErrors should be a list of strings representing part of the expected error message
*/
export const validateBlueprintErrors = async(page, BPName, errList, expectedErrors) => {
    expect.soft(errList.length, `Blueprint "${BPName}" has ${errList.length} error messages instead of expected ${expectedErrors.length}`).toBe(expectedErrors.length);
    const bpRow = await page.locator(`[data-test=blueprint-row-${BPName}]`);
    expect.soft(bpRow.locator(`button:has-Text("Launch Sandbox")`), `Launch Sandbox button is not disabled on blueprint "${BPName}"`).toBeDisabled();
    for(let i =0; i<expectedErrors.length; i++){
        expect.soft(errList[i], `Wrong error returned from "${BPName}" blueprint`).toContainText(expectedErrors[i]);
    }
}

export const launchBlueprintWithInputs = async(page, BPName, inputsDict) => {
    await page.click(`[data-test="blueprint-row-${BPName}"] button:has-text("Launch Sandbox")`);
    for(const [key, val] of Object.entries(inputsDict)){
        console.log(`Entering value "${val}" for sandbox input with selector "${key}"`)
        if(key.startsWith("select")){ // Dropdown inputs like new execution host
            await page.click(`[class~="${key}"]`);
            await page.type(`[class~="${key}"]`, val);
            await page.keyboard.press("Enter");
        }
        else{
            await page.fill(`[data-test="${key}"]`, val);
        }
    }
    await page.keyboard.press("Tab"); // Needed for the page to realise last input was filled
    await page.click('[data-test="wizard-next-button"]');
}