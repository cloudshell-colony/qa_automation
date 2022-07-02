import { closeModal } from "./functions/general.mjs";
import { test, expect } from "@playwright/test";
import { getSessionAPI, loginToAccount } from "./functions/accounts.mjs";
import { goToSpace } from "./functions/spaces.mjs";
import { getdeploymentFile } from "./functions/executionHost.mjs";
import fs from "fs";
import { exec } from "child_process";

const baseURL = process.env.baseURL;
const allAccountsPassword = process.env.allAccountsPassword;
const prefix = process.env.accountPrefix;
const adminAccount = process.env.account;
const adminEMail = process.env.adminEMail;
const repProvider = process.env.repProvider;
const spaceName = prefix.concat("1655972406");

test.describe.serial('test my tests', () => {
  let page;
  let context;
  test.beforeAll(async ({ browser }) => {
    context = await browser.newContext();
    page = await context.newPage();
  });

  test.afterAll(async () => {
    await page.close();
  });

  test('login to account', async () => {
    await loginToAccount(page, adminEMail, adminAccount, allAccountsPassword, baseURL);
    await page.waitForSelector('[data-test="launch-\[Sample\]MySql Terraform Module"]');
    await closeModal(page);
  });

  test('enter space', async () => {
    goToSpace(page, spaceName);
    await page.waitForNavigation();
    const url = await page.url();
    expect(url).toContain(spaceName);
  });

  test('add execution host from space settings', async () => {
    await page.click('[data-test="settings-nav-tab"]');
    await page.click('button:has-text("Manage Cloud Accounts")');
    await page.click('[data-test="add-new-execution-host"]');
    await page.locator('[data-test="computeServiceName"]').fill('eks');
    await page.click('[data-test="service-type-EKS"]');
    await page.fill('[data-test="agentNameSpace"]', "gmp-agent");

    await page.fill('.react-tagsinput-input', "gmp-agent");
    await page.click('[data-test="submit-button"]');
    await page.waitForLoadState();

  });

  test('Get deployment file body', async () => {
    const session = await getSessionAPI(adminEMail, allAccountsPassword, baseURL, adminAccount);
    const response = await getdeploymentFile(session, baseURL);
    expect(response.status).toBe(200);
    expect(response.ok).toBeTruthy();
    const responseBody = await response.text();
    fs.writeFile('deploymentFile.yaml', responseBody, function (err) {
      if (err) throw err;
      console.log('deploymentFile.yaml was saved');
    });
    exec("kubectl apply -f deploymentFile.yaml", (error, stdout, stderr) => {
      if (error) {
        console.log(`error: ${error.message}`);
        expect(error).toBeNull();
        return;
      }
      if (stderr) {
        console.log(`stderr: ${stderr}`);
        expect(error).toBeNull();
        return;
      }
      console.log(`stdout: ${stdout}`);

    });
  });




  test('add execution host to space', async () => {
    await page.pause();
  });



  test.skip('page functions auto complete', async ({ page }) => {
    await page.waitForLoadState
    await page.waitForNavigation
    await page.waitForSelector
    await page.mouse.move()
    await page.pause();
    await page.waitForTimeout
  });

});

  // await page.pause();