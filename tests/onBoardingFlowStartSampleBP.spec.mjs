import { test, expect } from "@playwright/test";
import { createAccount } from "./functions/accounts.mjs";
import { startSampleSandbox } from "./functions/sandboxes.mjs";

const baseURL = process.env.baseURL;
const allAccountsPassword = process.env.allAccountsPassword;
const prefix = process.env.accountPrefix;
const sampleBP = process.env.sampleBPToStart;
const timestemp = Math.floor(Date.now() / 1000);
const accountName = prefix.concat(timestemp);
const email = prefix.concat("@").concat(timestemp).concat(".com");

test.describe.serial('onboarding flow', () => {
  let page;
  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
  });

  test.afterAll(async () => {
    await page.close();
  });

  test('create new account', async () => {
    console.log('creating new account with name: ' + accountName);
    await createAccount(page, email, accountName, allAccountsPassword, baseURL);
    await page.waitForURL(`${baseURL}/Sample`);
    await page.waitForSelector('[data-test="launch-\[Sample\]MySql Terraform Module"]');
    await expect(page).toHaveScreenshot({ maxDiffPixels: 4000 });
  });

  test('sample sandbox launcher contain three samples', async () => {
    expect(page.locator('[data-test="launch-\[Sample\]MySql Terraform Module"]')).toContainText('Launch');
    expect(page.locator('[data-test="launch-\[Sample\]Bitnami Nginx Helm Chart"]')).toContainText('Launch');
    expect(page.locator('[data-test="launch-[Sample]Helm Application with MySql and S3 Deployed by Terraform"]')).toContainText('Launch');
  });

  test('start sample sandbox from "sample sandbox launcher"', async () => {
    await startSampleSandbox(page, sampleBP);
    await page.waitForSelector('[data-test="sandbox-info-column"] div:has-text("Sandbox StatusActive")', { timeout: 120000 });
    expect(await page.isVisible('[data-test="sandbox-info-column"] div:has-text("Sandbox StatusActive")', 500)).toBeTruthy();
    const items = await page.locator('[data-test="grain-kind-indicator"]');
    for (let i = 0; i < await items.count(); i++) {
      await items.nth(i).click();
    }
    const prepare = await page.locator('text=/PrepareCompleted/');
    const install = await page.locator('text=/InstallCompleted/');
    const apply = await page.locator('text=/ApplyCompleted/');
    // refactor to use forEach
    // prepare.forEach((line) => { expect(line).toContainText(/Completed/)});

    for (let i = 0; i < await prepare.count(); i++) {
      expect(prepare.nth(i)).toContainText(/Completed/);
      console.log("found Completed prepare");
    };
    for (let i = 0; i < await install.count(); i++) {
      expect(install.nth(i)).toContainText(/Completed/)
      console.log("found Completed install");
    };
    for (let i = 0; i < await apply.count(); i++) {
      expect(apply.nth(i)).toContainText(/Completed/)
      console.log("found Completed apply");
    };
  });

  test.skip('End launched sample sandbox', async() => {
    const sandboxName = "Sample Environment"; //default name when launching from sample sandbox launcher
    await endSandbox(page);
    await page.waitForSelector(`tr:has-text("${sandboxName}")`, {has: page.locator("data-testid=moreMenu")});  
    let visi = page.isVisible(`tr:has-text("${sandboxName}")`, {has: page.locator("data-testid=moreMenu")});
    expect(await page.locator(`tr:has-text("${sandboxName}")`, {has: page.locator("data-testid=moreMenu")})).toContainText("Terminating");
    while(await visi){
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