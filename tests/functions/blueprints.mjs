import { expect } from "@playwright/test";
import fetch from "node-fetch";
import { selectFromDropbox, validateAPIResponseis200 } from "./general.mjs";
import { goToSandboxListPage } from "./sandboxes.mjs";


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

export const goToBlueprintPage = async (page) => {
    await page.click('[data-test="blueprints-nav-link"]');
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
        // await page.waitForSelector('div:has-text("Launch Environment")', { timeout: 3000 });
        await page.waitForSelector('[data-test="launch-environment-from-blueprint"]', { timeout: 3000 });
        const BPList = page.locator("tr", { has: page.locator("data-testid=moreMenu") });
        const num = await BPList.count();
        return num;
    }
};

export const enterBlueprintPage = async (page) => {
    page.click('[data-test="blueprints-nav-link"]');
    await page.waitForNavigation();
    const imThere = await page.isVisible('[data-test="space-blueprints-tab-test"]', { timeout: 3000 });
    expect(await imThere, "Looks like we are not in Bluprints list page as expected").toBe(true);
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

export const launchAutoGeneratedBlueprint = async (page, BPFullName, inputsDict = {}) => {
    await page.click(`[data-test="tf-based-blueprint-row-${BPFullName}"] [data-test="launch-environment-from-blueprint"]`);
    const sandboxName = await blueprintLauncher(page, BPFullName, inputsDict);
    return sandboxName;
};

export const launchBlueprintFromBPList = async (page, BPFullName, inputsDict = {}) => {
    await page.click(`[data-test="blueprint-row-${BPFullName}"] [data-test="launch-environment-from-blueprint"]`);
    const sandboxName = await blueprintLauncher(page, BPFullName, inputsDict);
    return sandboxName;
};

export const launchSampleBlueprintFromSandboxPage = async (page, sampleFullName, inputsDict = {}) => {
    await page.click('[data-test="create-sandbox-btn"]');
    await page.click(`[data-test="blueprint-tile-[Sample]${sampleFullName}"]`);
    const sandboxName = await blueprintLauncher(page, sampleFullName, inputsDict);
    return sandboxName;
};

export const launchSampleBlueprintFromCatalogPage = async (page, sampleFullName, inputsDict = {}) => {
    await page.click('[data-test="catalog-nav-link"]');
    await page.click(`[data-test="catalog-bp-[Sample]${sampleFullName}"] [data-test="launch-environment-from-blueprint"]`);
    const sandboxName = await blueprintLauncher(page, sampleFullName, inputsDict);
    return sandboxName;
};

export const launchBlueprintFromSandboxPage = async (page, BPFullName, inputsDict = {}) => {
    await page.click('[data-test="create-sandbox-btn"]');
    await page.click(`[data-test="blueprint-tile-${BPFullName}"]`);
    const sandboxName = await blueprintLauncher(page, BPFullName, inputsDict);
    return sandboxName;
};

const blueprintLauncher = async (page, BPFullName, inputsDict) => {
    const sandboxName = await page.getAttribute("[data-test=sandboxName]", "value");
    console.log(`the new sandbox name is: ${sandboxName}`);
    const result = sandboxName.includes(BPFullName, 0);
    expect(result, `the sandbox name: \"${sandboxName}\" should have started with the BP name: \"${BPFullName}\"`).toBeTruthy();
    for (const [key, val] of Object.entries(inputsDict)) {
        console.log(`Entering value "${val}" for sandbox input with selector "${key}"`)
        try {
            await page.fill(`[data-test="${key}"]`, val, { timeout: 1000 });
        }
        catch {
            await selectFromDropbox(page, key, val);
        }
    }
    await page.keyboard.press("Tab"); // Needed for the page to realise last input was filled
    await page.click('[data-test="wizard-next-button"]');
    //await page.waitForSelector('[data-test="sandbox-info-column"]');
    return sandboxName;
}

export const getBlueprintErrors = async (page, BPName) => {
    await page.waitForSelector(`[data-test=blueprint-row-${BPName}]`);
    const bpRow = await page.locator(`[data-test=blueprint-row-${BPName}]`);
    const errList = [];
    const list = await bpRow.locator("ol li");
    const count = await list.count();
    for (let i = 0; i < count; i++) {
        console.log(`Received error: "` + await list.nth(i).innerText() + `" from "${BPName}" blueprint`);
        errList.push(await list.nth(i))
    };
    return errList;
}

/*
errList should contain the locators of the errors, as returned by the getBlueprintErrors function
expectedErrors should be a list of strings representing part of the expected error message
*/
export const validateBlueprintErrors = async (page, BPName, errList, expectedErrors) => {
    expect.soft(errList.length, `Blueprint "${BPName}" has ${errList.length} error messages instead of expected ${expectedErrors.length}`).toBe(expectedErrors.length);
    const bpRow = await page.locator(`[data-test=blueprint-row-${BPName}]`);
    // expect.soft(bpRow.locator(`button:has-Text("Launch Environment")`), `Launch Environment button is not disabled on blueprint "${BPName}"`).toBeDisabled();
    expect.soft(bpRow.locator(`[data-test="launch-environment-from-blueprint"]`), `Launch Environment button is not disabled on blueprint "${BPName}"`).toBeDisabled();
    for (let i = 0; i < expectedErrors.length; i++) {
        expect.soft(errList[i], `Wrong error returned from "${BPName}" blueprint`).toContainText(expectedErrors[i]);
    }
};

export const launchBlueprintAPI = async (session, baseURL, BPName, spaceName, inputs, duration = "PT2H") => {
    const timestemp = Math.floor(Date.now() / 1000);
    const data = {
        "sandbox_name": `${BPName}-${timestemp}`,
        "blueprint_name": `${BPName}`,
        "inputs": inputs,
        "duration": duration,
        "automation": false,
        "artifacts": {},
        "activity_type": 'other',
        "notes": '',
        "source": { "is_editable": true }
    }
    const response = await fetch(`${baseURL}/api/spaces/${spaceName}/environments`, {
        "method": "POST",
        "body": JSON.stringify(data),
        "headers": {
            'Authorization': `Bearer ${session}`,
            'Content-Type': 'application/json',
            'Accept': '*/*'
        }
    });
    return response;
}

export const getBlueprintCandidatesFromRepoAPI = async (session, baseURL, space, repoName) => {
    const response = await fetch(`${baseURL}/api/spaces/${space}/blueprint_candidates?repository_name=${repoName}`, {
        "method": "GET",
        "headers": {
            'Authorization': `Bearer ${session}`,
            'Content-Type': 'application/json',
        }
    });
    return response;
};

export const generateBlueprintsFromCandidatesAPI = async (session, baseURL, space, blueprintCandidates, repoName) => {
    const data = {
        "blueprint_candidates": blueprintCandidates,
        "repository_name": repoName
    }
    const response = await fetch(`${baseURL}/api/spaces/${space}/blueprints`, {
        "method": "POST",
        "body": JSON.stringify(data),
        "headers": {
            'Authorization': `Bearer ${session}`,
            'Content-Type': 'application/json',
        }
    });
    return response;
};

export const generateAllRepoBlueprintsAPI = async (session, baseURL, space, repoName) => {
    let response = await getBlueprintCandidatesFromRepoAPI(session, baseURL, space, repoName);
    await validateAPIResponseis200(response);
    console.log(`Got blueprint list from repo ${repoName}`);
    let blueprints = await response.json();
    response = await generateBlueprintsFromCandidatesAPI(session, baseURL, space, blueprints, repoName);
    return response;
}