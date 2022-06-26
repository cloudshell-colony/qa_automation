import { addCaptchaBypass, closeModal } from "./functions/general.mjs";
import { test, expect } from "@playwright/test";
import { createAccount, loginToAccount } from "./functions/accounts.mjs";
import { startSampleSandbox } from "./functions/sandboxes.mjs";
import goToAdminConsole from "./functions/goToAdminConsole.mjs";
import { goToSpace } from "./functions/spaces.mjs";

const baseURL = process.env.baseURL;
const allAccountsPassword = process.env.allAccountsPassword;
const prefix = process.env.accountPrefix;
const adminAccount = process.env.account;
const adminEMail = process.env.adminEMail;
const githubRepo = process.env.githubRepo;
const githubUserNAme = process.env.githubUserNAme;
const githubPassword = process.env.githubPassword;
const githubRepoNumOfBlueprints = process.env.githubRepoNumOfBlueprints;


const timestamp = Math.floor(Date.now() / 1000);
const newSpaceName = prefix + timestamp;

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
  let context;
  test.beforeAll(async ({ browser }) => {
    context = await browser.newContext();
    page = await context.newPage();
    // page = await browser.newPage();
    await loginToAccount(page, adminEMail, adminAccount, allAccountsPassword, baseURL);
  });

  test.afterAll(async () => {
    await page.close();
  });

  test('create new space with asset repo from quick launcher window', async () => {


    // start new space flow from quick sandbox launcher
    await page.click('text=Start by creating your own Space');
    await page.fill('[data-test="create-new-space-popup"]', newSpaceName);
    await page.click('[data-test="color-frogGreen"]');
    await page.click('[data-test="icon-face"]');
    await page.click('[data-test="create-space"]');
    // add repository asset
    await page.waitForSelector('[data-test="connect-repo-title"]');
    await page.click('[data-test="setup-modal-container"] svg >> nth=2');
    await page.fill('[data-test="repositoryUrl"]', githubRepo);
    await page.fill('[data-test="repositoryName"]', "blueprints");
    //manage repo provider credentilas
    const [signinWindow] = await Promise.all([
      page.waitForEvent("popup"),
      page.click('button:has-text("Connect")')
    ])
    await signinWindow.waitForLoadState();
    expect(await signinWindow.url()).toContain('login');
    await signinWindow.fill('input[name="login"]', githubUserNAme);
    await signinWindow.fill('input[name="password"]', githubPassword);
    await signinWindow.click('input:has-text("Sign in")');
    await signinWindow.waitForLoadState();
    const visi = await signinWindow.isVisible('text=Authorize QualiNext', 500);
    if (visi) {
      await signinWindow.click('text=Authorize QualiNext');
    };
    // back to torque
    // seslect BPs for import
    await page.waitForLoadState();
    await page.click('[data-test="submit-button"]');
    // start BP selection after auto discavery
    expect(await page.isVisible('[data-test="submit-button"]')).toBeTruthy();
    expect(await page.isEnabled('[data-test="submit-button"]')).not.toBeTruthy();
    await page.check('th input[type="checkbox"]');
    expect(await page.isEnabled('[data-test="submit-button"]')).toBeTruthy();
    await page.click('[data-test="submit-button"]');
    // Auto-Generated Blueprints page approval
    await page.isVisible('text=Auto-Generated Blueprints');
    let numberOfBlueprints = await page.locator('[data-test="setup-modal-container"] td');
    expect(await numberOfBlueprints.count()).toEqual(parseInt(githubRepoNumOfBlueprints) * 2);
    await page.click('[data-test="submit-button"]');
    // skip add execution host for now
    await page.click('[data-test="skip-for-now"]');


    // alternative to craete space every time
    await closeModal(page);
    await goToSpace(page, "QA-GMP1656227124");
    await page.click('[data-test="blueprints-nav-link"]');

    // blueprints page


    await page.isVisible(`text=${newSpaceName}Blueprints >> nth=1`);
    let numberOfBlueprints = await page.locator('tr');
    console.log(numberOfBlueprints);
    console.log('number of BPs ' + await numberOfBlueprints.count());
    console.log('expected number ' + parseInt(githubRepoNumOfBlueprints));
    await page.pause();
    expect(await numberOfBlueprints.count()).toEqual(parseInt(githubRepoNumOfBlueprints));
    await page.pause();

  });

  test.skip('page functions auto complete', async ({ page }) => {
    await page.waitForLoadState
    await page.isEnabled
    await page.pause();
    await page.locator
  });

});

  // await page.pause();