import { test, expect } from "@playwright/test";
import { createAccount, DeleteAcountUI, loginToAccount, validateSbLauncher } from "./functions/accounts.mjs";
import { launchSampleBlueprint } from "./functions/blueprints.mjs";
import { startSampleSandbox, endSandbox, validateSBisActive } from "./functions/sandboxes.mjs";

const baseURL = process.env.baseURL;
const allAccountsPassword = process.env.allAccountsPassword;
const prefix = process.env.accountPrefix;
const sampleBP = "MySql";
const timestemp = Math.floor(Date.now() / 1000);
const accountName = prefix.concat(timestemp);
const email = prefix.concat("@").concat(timestemp).concat(".com");

// generating new order of samples every day
// sample names are :  "Bitnami", "MySql" or "Helm" ; case insensative
const day = (new Date()).getDay();
const placeA = (day % 3);
const placeB = ((day + 1) % 3);
const placeC = ((day + 2) % 3);
const sbOrder = [];
sbOrder[placeA] = "Helm"
sbOrder[placeB] = "MySql"
sbOrder[placeC] = "Bitnami"

test.describe.serial('onboarding flow', () => {
  let page;
  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
  });

  test.afterAll(async () => {
    // DeleteAcountUI(accountName, page, baseURL);
    await page.close();
  });

  test.skip('create new account', async () => {
    await createAccount(page, email, accountName, allAccountsPassword, baseURL);
    await page.waitForURL(`${baseURL}/Sample`);
    await page.waitForSelector('[data-test="launch-\[Sample\]MySql Terraform Module"]');
    // comment out screenshot validation due to docker image path issue - windows vs ubuntu
    // await expect(page).toHaveScreenshot({ maxDiffPixels: 4000 });
  });

  test('login to account to by pass localhost issue', async () => {
    await loginToAccount(page, "gilad.m@quali.com", "qa", allAccountsPassword, baseURL);
  });

  test('sample sandbox launcher contain three samples', async () => {
    await validateSbLauncher(page, baseURL);
  });

  test('start sample sandbox from "sample sandbox launcher"', async () => {
    console.log(`starting \"${sbOrder[0]}\" sample SB from quick launcher`);
    await startSampleSandbox(page, sbOrder[0]);
  });

  test.skip('validate sample SB started from quick launcher is active', async () => {
    await validateSBisActive(page);
  });

  test('redirect to blueprint catyalog page for next step', async () => {
    page.click('[data-test="blueprints-nav-link"]')
    await page.waitForNavigation();
  });

  test('start sample sandbox from blueprints page', async () => {
    const BPfromBPPage = await launchSampleBlueprint(page, sbOrder[1]);
  });

  test.skip('validate sample SB started from blueprint catalog page is active', async () => {
    await validateSBisActive(page);
  });

  test('redirect to sandbox catyalog page for next step', async () => {
    page.click('[data-test="sandboxes-nav-link""]')
    await page.waitForNavigation();
  });

  test('start sample sandbox from sandbox page', async () => {
    await page.click('[data-test="create-sandbox-btn"]');
    const BPfromBPPage = await launchSampleBlueprint(page, sbOrder[1]);
  });

  test.skip('validate sample SB started from sandbox catalog page is active', async () => {
    await validateSBisActive(page);
  });










  test.skip('End launched sample sandbox', async () => {
    const sandboxName = "Sample Environment"; //default name when launching from sample sandbox launcher
    await endSandbox(page);
    await page.waitForSelector(`tr:has-text("${sandboxName}")`, { has: page.locator("data-testid=moreMenu") });
    let visi = page.isVisible(`tr:has-text("${sandboxName}")`, { has: page.locator("data-testid=moreMenu") });
    expect(await page.locator(`tr:has-text("${sandboxName}")`, { has: page.locator("data-testid=moreMenu") })).toContainText("Terminating");
    while (await visi) {
      await page.waitForTimeout(50);
      visi = page.isVisible(`tr:has-text("${sandboxName}")`);
    }
    await page.click(`[data-toggle=true]`); //Need UI to add data-test for this button
    await page.click(`tr:has-text("${sandboxName}")`);
    await page.waitForSelector("[data-test=sandbox-page-content]");
    const items = await page.locator('[data-test="grain-kind-indicator"]');
    for (let i = 0; i < await items.count(); i++) {
      await items.nth(i).click();
    }
    const destroy = await page.locator('text=/DestroyCompleted/');
    const uninstall = await page.locator('text=/UninstallCompleted/');
    for (let i = 0; i < await destroy.count(); i++) {
      expect(destroy.nth(i)).toContainText(/Completed/);
      console.log("found Completed destroy");
    };
    for (let i = 0; i < await uninstall.count(); i++) {
      expect(uninstall.nth(i)).toContainText(/Completed/);
      console.log("found Completed uninstall");
    };
  });

});