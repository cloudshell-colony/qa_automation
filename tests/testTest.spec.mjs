import { closeModal, executeCLIcommand, overwriteAndSaveToFile } from "./functions/general.mjs";
import { test, expect } from "@playwright/test";
import { getSessionAPI, loginToAccount } from "./functions/accounts.mjs";
import { goToSpace } from "./functions/spaces.mjs";
import { getdeploymentFileAPI } from "./functions/executionHosts.mjs";
import fs from "fs";
import { exec } from "child_process";

const baseURL = process.env.baseURL;
const allAccountsPassword = process.env.allAccountsPassword;
const prefix = process.env.accountPrefix;
const adminAccount = process.env.account;
const adminEMail = process.env.adminEMail;
const repProvider = process.env.repProvider;
const spaceName = "QA-GMP1655982743";

// execution host parameters
const executionHostName = "eks09";
const executionHostNameSpace = "gmp-agent-test";



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

  test.skip('add execution host from space settings', async () => {
    await page.click('[data-test="settings-nav-tab"]');
    await page.click('button:has-text("Manage Cloud Accounts")');
    await page.click('[data-test="add-new-execution-host"]');
  });

  test.skip('enter execution host information to generate the yaml deployment file', async () => {
    await page.locator('[data-test="computeServiceName"]').fill(executionHostName);
    await page.click('[data-test="service-type-EKS"]');
    await page.fill('[data-test="agentNameSpace"]', executionHostNameSpace);

    await page.fill('.react-tagsinput-input', executionHostNameSpace);
    await page.click('[data-test="submit-button"]');
    await page.waitForLoadState();

  });

  test.skip('Create execution host and add to Space', async () => {
    // get session for API call
    const session = await getSessionAPI(adminEMail, allAccountsPassword, baseURL, adminAccount);
    const response = await getdeploymentFileAPI(session, baseURL, executionHostName, executionHostNameSpace);
    await overwriteAndSaveToFile("deploymentFile.yaml", response);
  });

  test.skip('apply the execution host yaml file to K8S', async () => {
    // seperating the commands to different tests in order to "fource" sync actions
    const applyExecutionHost = await executeCLIcommand("kubectl apply -f deploymentFile.yaml");
  });

  test.skip('complete the actions in the GUI after execution host agent was created in K8S', async () => {

    await page.click('[data-test="submit-button"]');
    await page.waitForLoadState();
    await page.waitForSelector('[data-test="agent-connected"]', { timeout: 180000 });
    // expect(await page.locator('[data-test="agent-connected"]')).toContain('You have successfully connected the Agent to Torque');
    await page.click('[data-test="submit-button"]');
  });

  test('enter add execution host to page', async () => {
    goToSpace(page, spaceName);
    await page.click('[data-test="settings-nav-tab"]');
    await page.click('[data-test="manage-cloud-accounts-button-wrapper"]');
    await page.click('[data-testid="moreMenu"]');
    await page.click('[data-test="add-host-to-space-more-menu-option"]');
  });

  test('add execution host to space', async () => {
    await page.click(`[class~="select-space"]`);
    await page.type(`[class~="select-space"]`, spaceName);
    await page.keyboard.press("Enter");

    await page.fill('[data-test="namespace"]', executionHostNameSpace);
    await page.click('[data-test="submit-button"]');
    await page.pause();
  });



  test.skip('page functions auto complete', async ({ page }) => {
    await page.waitForLoadState
    await page.waitForNavigation
    await page.waitForSelector
    await page.waitForLoadState
    await page.mouse.move()
    await page.pause();
    await page.waitForTimeout
    page.locator().selectOption
  });

});

  // await page.pause();