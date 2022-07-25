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

export const launchBlueprint = async (page, BPFullName) => {
    await page.click(`[data-test="tf-based-blueprint-row-${BPFullName}"] button:has-text("Launch Sandbox")`);
    const sandboxName = await page.getAttribute("[data-test=sandboxName]", "value");
    console.log(`the new sandbox name is: ${sandboxName}`);
    const result = sandboxName.includes(BPFullName, 0);
    expect(result, `the sandbox name: \"${sandboxName}\" should have started with the BP name: \"${BPFullName}\"`).toBeTruthy();
    return sandboxName;
};

export const launchSampleBlueprint = async (page, BPFirstWord) => {
    let dataTest = "";
    switch (BPFirstWord.toLowerCase()) {
        case "helm":
            dataTest = '[data-test="blueprint-row-Helm Application with MySql and S3 Deployed by Terraform"]';
            break;
        case "mysql":
            dataTest = '[data-test="blueprint-row-MySql Terraform Module"]';
            break;
        case "bitnami":
            dataTest = '[data-test="blueprint-row-Bitnami Nginx Helm Chart"]';
            break;
        default:
            console.log("invalid sample sandbox name");
            break;
    }
    await page.click(`${dataTest} button:has-text("Launch Sandbox")`);
    const sandboxName = await page.getAttribute("[data-test=sandboxName]", "value");
    console.log(`the new sandbox name is: ${sandboxName}`);
    const result = sandboxName.includes(BPFirstWord, 0);
    expect(result, `the sandbox name: \"${sandboxName}\" should have started with the BP name: \"${BPFirstWord}\"`).toBeTruthy();
    await page.locator('[data-test="wizard-next-button"]').click();
    await page.waitForSelector('[data-test="sandbox-info-column"]');
    return sandboxName;
};

