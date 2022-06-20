import { addCaptchaBypass, closeModal } from "./functions/general.mjs";
import { test, expect } from "@playwright/test";
import { createAccount, loginToAccount } from "./functions/accounts.mjs";
import { startSampleSandbox } from "./functions/sandboxes.mjs";

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

  test.only('login', async () => {
    await loginToAccount(page, adminEMail, adminAccount, allAccountsPassword, baseURL);
    await page.waitForURL('http://www.colony.localhost/Sample');
    await page.pause();
  });


  const sandbox = "helm";
  test('start sample sandbox from "sample sandbox launcher"', async () => {
    await startSampleSandbox(page, sandbox)
    const items = await page.locator('[data-test="grain-kind-indicator"]');
    for (let i = 0; i < await items.count(); i++) {
      await items.nth(i).click();
    }
    await page.waitForSelector('[data-test="sandbox-info-column"] div:has-text("Sandbox StatusActive")');
    expect(await page.locator('[data-test="sandbox-info-column"]')).toContainText("Sandbox StatusActive");
    const prepare = await page.locator('text=/PrepareCompleted.*/');
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


  test.only('Enter top active sandbox', async () => {
    // check if "sample sandbox launcher" is open and cklose it:
    closeModal();


  });

  // await page.pause();

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

  // });

});  