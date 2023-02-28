import { test, expect } from "@playwright/test";
import { afterTestCleanup, closeModal, generateUniqueId, openAndPinSideMenu } from "./functions/general.mjs";
import { loginToAccount } from "./functions/accounts.mjs";
import { launchBlueprintFromCatalogPage } from "./functions/blueprints.mjs";
import { endSandbox, goToSandbox, stopAndValidateAllSBsCompleted, validateSBisActive } from "./functions/sandboxes.mjs";
import { generateRepoSpecificKeys, goToSpace } from "./functions/spaces.mjs";

const baseURL = process.env.baseURL;
const password = process.env.allAccountsPassword;
const email = process.env.adminEMail;
const account = process.env.account;
const timestemp = Math.floor(Date.now() / 1000);
const id = timestemp.toString().concat(generateUniqueId());
const spaceName = 'update-test';
const executionHostName = 'qa-eks'
const blueprintName = 'simpleTF'
const repProvider = process.env.repProvider;
const tfText = `output "message" {
    value = "ahlan ${id}"
  }`;
let inputs = {'inputs\.agent': `${executionHostName}`};


test.describe.serial("Asset updates test", () => {
    let page;
    let repoKeys;
    let context;
    let sandboxName;
    test.beforeAll(async ({browser}) => {
        repoKeys = await generateRepoSpecificKeys(repProvider);
        context = await browser.newContext();
        page = await browser.newPage();
        await loginToAccount(page, email, account, password, baseURL);
        await closeModal(page);
        await openAndPinSideMenu(page);
    });

    test.afterAll(async () =>{
        await page.goto(`${baseURL}/${spaceName}/environments`);
        await page.waitForLoadState();
        await stopAndValidateAllSBsCompleted(page);
    });

    test("Launch simple TF sandbox", async() =>{
        await goToSpace(page, spaceName);
        sandboxName = await launchBlueprintFromCatalogPage(page, blueprintName, inputs)
        await validateSBisActive(page);
    })

    test("Change TF file in github", async() => {
        await page.goto('https://github.com/cloudshell-colony/qa_automation');
        await page.locator('header[role="banner"] >> text=Sign in').click();
        await page.locator('input[name="login"]').fill(repoKeys.userName);
        await page.locator('input[name="password"]').fill(repoKeys.password);
        await page.locator('input:has-text("Sign in")').click();
        console.log('Signed in to github');
        await page.goto('https://github.com/cloudshell-colony/qa_automation/blob/main/simpleTF/main.tf');
        await page.keyboard.press("e");
        await page.locator('pre[role="presentation"]').first().click();
        await page.keyboard.press("Control+A");
        await page.keyboard.press("Delete");
        await page.keyboard.type(tfText);
        await page.click('button:has-text("Commit changes")');
        console.log('Changed message value in TF file');
    })

    test("Update grain and validate change", async() => {
        await page.goto(`${baseURL}`, { timeout: 90000 });
        await goToSandbox(page, sandboxName, spaceName);
        const detectUpdate = await page.locator('[data-test="asset-drift-card"]')
        await detectUpdate.click()
        const numLocator = await detectUpdate.locator('[data-test="amount"]')
        await expect(numLocator, 'Update in asset not detected after 2 minutes').toContainText('1', { timeout: 120000});
        console.log('Update detected in sandbox');
        await page.getByText('Detected Changes on simpleTF').click();
        let updatesPage = await page.locator('[data-test="assetDrift-drawer"]');
        expect(updatesPage).toContainText(`ahlan ${id}`);
        updatesPage = await page.locator('.scrollable-container');
        await updatesPage.getByRole('button', { name: /Update/i }).click()
        await expect(numLocator, 'Sandbox resource not updated after 1 minute').toContainText('0', { timeout: 60000});
        console.log('Executed update in sandbox');
        await page.click('[data-test="logs-card"]');
        await page.locator('td > div').first().click();
        const logBlock = await page.locator('[data-test="log-block"]');
        expect(logBlock).toContainText(`message = "ahlan ${id}"`);
        await endSandbox(page);
    })


});