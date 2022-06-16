import { test, expect } from "@playwright/test";
import { createAccount } from "./functions/accounts.mjs";

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
    await page.pause();
    await createAccount(page, email, accountName, allAccountsPassword, baseURL);
    await page.waitForURL('http://www.colony.localhost/Sample');
    await expect(page).toHaveScreenshot({ maxDiffPixels: 3000 });

  });

  test('sample sandbox launcher contain three samples', async () => {
    expect( page.locator('[data-test="launch-\[Sample\]MySql Terraform Module"]')).toContainText('Launch');
    expect( page.locator('[data-test="launch-\[Sample\]Bitnami Nginx Helm Chart"]')).toContainText('Launch');
    expect( page.locator('[data-test="launch-[Sample]Helm Application with MySql and S3 Deployed by Terraform"]')).toContainText('Launch');
  });

  test('start sample sandbox from "sample sandbox launcher"', async ( ) => {
    await page.click('[data-test="launch-[Sample]Bitnami Nginx Helm Chart"]');    
    await page.locator('[data-test="inputs\.replicaCount"]').fill("22");
    await page.locator('[data-test="wizard-next-button"]').click();
    await page.waitForSelector('[data-test="sandbox-info-column"]');
    await page.locator('[data-test="grain-kind-indicator"]').click();
    await page.waitForSelector('[data-test="sandbox-info-column"] div:has-text("Sandbox StatusActive")');
    await page.pause();
    expect(await page.locator(/PrepareCompletedStarted/)).toContainText(/Completed/);
    expect(await page.locator('text=/InstallCompletedStarted')).toContainText(/Completed/);
    expect(await page.locator("'Sandbox StatusActive'")).toContainText(/Active/);    
  });

});