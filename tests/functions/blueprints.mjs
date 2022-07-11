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


export const publishBlueprint = async (page, BPFullName) => {
    await page.waitForLoadState();
    await page.click(`[data-test="tf-based-blueprint-row-${BPFullName}"] [data-test="blueprint-publish-toggle"]`);
};

export const publishSampleBlueprint = async (page, BPFullName) => {
    await page.waitForLoadState();
    await page.click(`[data-test="blueprint-row-${BPFullName}"] [data-test="blueprint-publish-toggle"]`);
};
