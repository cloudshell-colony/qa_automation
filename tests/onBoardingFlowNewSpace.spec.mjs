import { test, expect } from "@playwright/test";
import { createAccount } from "./functions/accounts.mjs";
import { startSampleSandbox } from "./functions/sandboxes.mjs";
import { craeteSpaceFromQuickLauncher, generateRepoSpecificKeys, repositoryAssetInfo } from "./functions/spaces.mjs";

const baseURL = process.env.baseURL;
const allAccountsPassword = process.env.allAccountsPassword;
const prefix = process.env.accountPrefix;
const sampleBP = process.env.sampleBPToStart;
const repProvider = process.env.repProvider;
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

    test('create new space with asset repo from quick launcher window', async () => {
        // start new space flow from quick sandbox launcher
        await craeteSpaceFromQuickLauncher(page, accountName)
        // add repository asset
        // done in the provider web page
        await repositoryAssetInfo(page, repProvider)
        // back to torque - start DP auto discavery
        await page.waitForLoadState();
        await page.click('[data-test="submit-button"]');
        //  select ALL BPs for import after auto discavery
        expect(await page.isVisible('[data-test="submit-button"]')).toBeTruthy();
        expect(await page.isEnabled('[data-test="submit-button"]')).not.toBeTruthy();
        await page.check('th input[type="checkbox"]');
        expect(await page.isEnabled('[data-test="submit-button"]')).toBeTruthy();
        await page.click('[data-test="submit-button"]');
        // Auto-Generated Blueprints page approval
        await page.isVisible('text=Auto-Generated Blueprints');
        // validate that after auto discovery the number of BPs is as expected 
        // reference number is set in .env file
        const specificRepoData = await generateRepoSpecificKeys(repProvider);
        let numberOfBlueprints = await page.locator('[data-test="setup-modal-container"] td');
        expect(await numberOfBlueprints.count()).toEqual(parseInt(specificRepoData.BPscount) * 2);

        await page.click('[data-test="submit-button"]');
        // skip add execution host for now
        await page.click('[data-test="skip-for-now"]');
        // redirect to blueprints page and validate the number of BPs again
        expect(page.locator('[data-test="submit-button"]')).toHaveText('Finish');
        await page.click('[data-test="submit-button"]');
        await page.waitForLoadState();

        numberOfBlueprints = await countBlueprintsInSpace(page);
        expect(parseInt(numberOfBlueprints)).toEqual(specificRepoData.BPscount)

    });
});
