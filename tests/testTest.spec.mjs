import { addCaptchaBypass } from "./functions/general.mjs";
import { test, expect } from "@playwright/test";
import { createAccount, loginToAccount } from "./functions/accounts.mjs";

const baseURL = process.env.baseURL;
const allAccountsPassword = process.env.allAccountsPassword;
const prefix = process.env.accountPrefix;
const adminAccount = process.env.account;
const adminEMail = process.env.adminEMail;

test.describe('test my tests', () => {
  
  // test('create new account', async ({ page }) => {
  //   const timestemp = Math.floor(Date.now() / 1000);
  //   const accountName = prefix.concat(timestemp);
  //   const email = prefix.concat("@").concat(timestemp).concat(".com");
  //   await createAccount(page, email, accountName, allAccountsPassword, baseURL);
  //   await page.waitForURL('http://www.colony.localhost/Sample');
  //   await expect(page).toHaveScreenshot({ maxDiffPixels: 3000 });
  // });

  let page;
  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    
  });
  
  test.afterAll(async () => {
    await page.close();
  });

  test('login', async () => {
    await loginToAccount( page, adminEMail, adminAccount, allAccountsPassword, baseURL );
    await page.waitForURL('http://www.colony.localhost/Sample');
    });

  test('start sample sandbox from "sample sandbox launcher"', async ( ) => {
    // await page.click('[data-test="launch-[Sample]Bitnami Nginx Helm Chart"]');
    // await page.locator(/^data-test="launch-\[Sample\]Bitnami/).click();
    const bitnami = await page.locator(/data-test="launch-\[Sample\]Bitnami/);
    console.log(await bitnami);
    console.log(JSON.stringify(await bitnami));
    await page.pause();
    await bitnami.click();
    await page.locator('[data-test="inputs\.replicaCount"]').fill("2");
    await page.locator('[data-test="wizard-next-button"]').click();
    await page.waitForSelector('[data-test="sandbox-info-column"]');
    await page.locator('[data-test="grain-kind-indicator"]').click();
    await page.waitForSelector('[data-test="sandbox-info-column"] div:has-text("Sandbox StatusActive")');
    expect(await page.locator(/PrepareCompletedStarted/)).toContainText(/Completed/);
    expect(await page.locator('text=/InstallCompletedStarted')).toContainText(/Completed/);
    expect(await page.locator("'Sandbox StatusActive'")).toContainText(/Active/);
    await page.pause();

  });




  // test('start sample sandbox from "sample sandbox launcher"', async () => {
  //   await page.click('[data-test="launch-[Sample]Bitnami Nginx Helm Chart"]');
  //   const res = await page.locator('.select-days .duration-input__control .duration-input__indicators .duration-input__indicator').click();
  //   console.log("*******");
  //   console.log(await res);
  //   console.log("*******");
  //   await page.locator(/option-1/).click();
  //   await page.locator('.select-hours .duration-input__control .duration-input__indicators .duration-input__indicator').click();
  //   await page.locator('#react-select-9-option-1').click();
  //   await page.locator('.select-minutes .duration-input__control .duration-input__indicators .duration-input__indicator').click();
  //   await page.locator('#react-select-10-option-1').click();
  //   await page.locator('.duration-input__indicators').first().click();
  //   await page.locator('#react-select-7-option-1').click();

  //   await page.waitForTimeout(30000);

  // });

});  