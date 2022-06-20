import { test, expect } from "@playwright/test";
import { createAccount } from "./functions/accounts.mjs";
import { startSampleSandbox } from "./functions/sandboxes.mjs";

const baseURL = process.env.baseURL;
const allAccountsPassword = process.env.allAccountsPassword;
const prefix = process.env.accountPrefix;

test.describe('onboarding flow', () => {
  let page;
  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
  });

  test.afterAll(async () => {
    await page.close();
  });

  test('create new account', async () => {
    const timestemp = Math.floor(Date.now() / 1000);
    const accountName = prefix.concat(timestemp);
    const email = prefix.concat("@").concat(timestemp).concat(".com");
    await createAccount(page, email, accountName, allAccountsPassword, baseURL);
    await page.waitForURL(`${baseURL}/Sample`);
    await expect(page).toHaveScreenshot({ maxDiffPixels: 3000 });

  });

  test('sample sandbox launcher contain three samples', async () => {
    expect(page.locator('[data-test="launch-\[Sample\]MySql Terraform Module"]')).toContainText('Launch');
    expect(page.locator('[data-test="launch-\[Sample\]Bitnami Nginx Helm Chart"]')).toContainText('Launch');
    expect(page.locator('[data-test="launch-[Sample]Helm Application with MySql and S3 Deployed by Terraform"]')).toContainText('Launch');
  });

  test('start sample sandbox from "sample sandbox launcher"', async () => {
    await startSampleSandbox(page, "helm");
    await page.waitForSelector('[data-test="sandbox-info-column"] div:has-text("Sandbox StatusActive")');
    const items = await page.locator('[data-test="grain-kind-indicator"]');
    for (let i = 0; i < await items.count(); i++) {
      await items.nth(i).click();
    }
    const prepare = await page.locator('text=/PrepareCompleted/');
    const install = await page.locator('text=/InstallCompleted/');
    const apply = await page.locator('text=/ApplyCompleted/');
    for (let i = 0; i < await prepare.count(); i++) {
      expect(prepare).toContainText(/Completed/)
    }
    for (let i = 0; i < await install.count(); i++) {
      expect(install).toContainText(/Completed/)
    }
    for (let i = 0; i < await apply.count(); i++) {
      expect(apply).toContainText(/Completed/)
    }
  });

});