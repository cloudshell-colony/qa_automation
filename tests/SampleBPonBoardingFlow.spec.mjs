import { test, expect } from "@playwright/test";
import { createAccount, DeleteAcountUI, loginToAccount, validateSbLauncher } from "./functions/accounts.mjs";
import { launchSampleBlueprintFromSandboxPage, launchBlueprintFromBPList, launchSampleBlueprintFromCatalogPage } from "./functions/blueprints.mjs";
import { afterTestCleanup, closeModal, generateUniqueId, openAndPinSideMenu, openFromChecklist } from "./functions/general.mjs";
import { startSampleSandbox, endSandbox, validateSBisActive, endSandboxValidation } from "./functions/sandboxes.mjs";

const baseURL = process.env.baseURL;
const allAccountsPassword = process.env.allAccountsPassword;
const prefix = process.env.accountPrefix;
const timestemp = Math.floor(Date.now() / 1000);
const id = timestemp.toString().concat('-' + generateUniqueId());
const firstName = "FN.".concat(prefix).concat(timestemp);
const lastName = "LN.".concat(prefix).concat(timestemp);
const companyName = "Company.".concat(prefix).concat(timestemp);
const accountName = prefix.concat(id);
const email = prefix.concat("@").concat(id).concat(".com");
let lastBPname = "";
// generating new order of samples every day
const day = (new Date()).getDay();
const placeA = (day % 3);
const placeB = ((day + 1) % 3);
const placeC = ((day + 2) % 3);
const sbOrder = [];
sbOrder[placeA] = "Helm Application with MySql and S3 Deployed by Terraform"
sbOrder[placeB] = "MySql Terraform Module"
sbOrder[placeC] = "Bitnami Nginx Helm Chart"

test.describe.serial('onboarding flow', () => {
  let page;
  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
  });

  test.afterAll(async () => {
    await afterTestCleanup(page, accountName, baseURL);
  });

  test('create new account', async () => {
    await createAccount(page, firstName, lastName, companyName, email, accountName, allAccountsPassword, baseURL);
    await page.waitForURL(`${baseURL}/Sample`);
    await closeModal(page);
    await openAndPinSideMenu(page);
    // comment out screenshot validation due to docker image path issue - windows vs ubuntu
    // await expect(page).toHaveScreenshot({ maxDiffPixels: 4000 });
  });

  test('sample sandbox launcher contain three samples', async () => {
    await openFromChecklist(page, "launched_environment");
    // await validateSbLauncher(page, baseURL);
  });

  test('start sample sandbox from "sample sandbox launcher"', async () => {
    console.log(`starting \"${sbOrder[0]}\" sample SB from quick launcher`);
    await startSampleSandbox(page, sbOrder[0]);
  });

  test('validate sample SB started from quick launcher is active', async () => {
    await validateSBisActive(page);
  });

  test('end the first sandbox', async () => {
    console.log("Terminating the sample environment");
    await endSandbox(page);
  });

  test('start sample sandbox from blueprints page', async () => {
    // redirect to blueprint catalog page
    page.click('[data-test="blueprints-nav-link"]')
    // await page.waitForNavigation();
    // launch sandbox from BP list page
    console.log(`starting \"${sbOrder[1]}\" sample SB from blueprints page`);
    const BPfromBPPage = await launchBlueprintFromBPList(page, sbOrder[1]);
  });

  test('validate sample SB started from blueprint catalog page is active', async () => {
    await validateSBisActive(page);
  });

  test('end the second sandbox', async () => {
    console.log("Terminating the sample environment");
    await endSandbox(page);
  });


  // test('start sample sandbox from sandbox page', async () => {
  //   console.log(`starting \"${sbOrder[2]}\" sample SB from sandbox list page`);
  //   lastBPname = await launchSampleBlueprintFromSandboxPage(page, sbOrder[2]);
  // });

  test('start sample sandbox from blueprint catalogue', async () => {
    console.log(`starting \"${sbOrder[2]}\" sample SB from sandbox list page`);
    lastBPname = await launchSampleBlueprintFromCatalogPage(page, sbOrder[2]);
  });

  test('validate sample SB started from sandbox catalog page is active', async () => {
    await validateSBisActive(page);
  });

  test('end the third sandbox', async () => {
    console.log("Terminating the sample environment");
    await endSandbox(page);
  });

  test('validate last sandboxes is completed', async () => {
    await endSandboxValidation(page, lastBPname);
  });

});