import { test, expect } from "@playwright/test";
import { createAccount, getSessionAPI } from "./functions/accounts.mjs";
import { getdeploymentFileAPI } from "./functions/executionHosts.mjs";
import { executeCLIcommand, overwriteAndSaveToFile, publishBlueprint } from "./functions/general.mjs";
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

const executionHostName = process.env.execHostName;
const executionHostSpaceName = process.env.execHostNameSpace;
const BPFullName = process.env.BPFullName;

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
        await expect(page).toHaveScreenshot({ maxDiffPixels: 5000 });

    });

    test('sample sandbox launcher contain three samples', async () => {
        await page.waitForLoadState();
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
        // complete the flow of adding asset repo and open the next step of adding execution host
        // await page.click('[data-test="submit-button"]');
        await page.waitForSelector('text=Auto-Generated Blueprints');
        await page.click('[data-test="submit-button"]');
    });

    test('enter execution host information to generate the yaml deployment file', async () => {
        await page.waitForLoadState();
        console.log(`host name: ${executionHostName}`);
        console.log(`host name: ${executionHostSpaceName}`);
        // await page.click('[data-test="computeServiceName"]');
        await page.fill('[data-test="computeServiceName"]', executionHostName);
        await page.click('[data-test="service-type-EKS"]');
        await page.fill('[data-test="agentNameSpace"]', executionHostSpaceName);

        await page.fill('.react-tagsinput-input', executionHostSpaceName);
        await page.click('[data-test="submit-button"]');
        await page.waitForLoadState();
    });

    test('Create execution host and add to Space', async () => {
        // get session for API call
        const session = await getSessionAPI(email, allAccountsPassword, baseURL, accountName);
        const response = await getdeploymentFileAPI(session, baseURL, executionHostName, executionHostSpaceName);
        await overwriteAndSaveToFile("deploymentFile.yaml", response);
    });

    test('apply the execution host yaml file to K8S', async () => {
        // seperating the commands to different tests in order to "fource" sync actions
        const applyExecutionHost = await executeCLIcommand("kubectl apply -f deploymentFile.yaml");
    });

    test('complete the actions in the GUI after execution host agent was created in K8S', async () => {

        await page.click('[data-test="submit-button"]');
        await page.waitForLoadState();
        await page.waitForSelector('[data-test="agent-connected"]', { timeout: 180000 });
        // expect(await page.locator('[data-test="agent-connected"]')).toContain('You have successfully connected the Agent to Torque');
        await page.click('[data-test="submit-button"]');
    });

    test('add execution host to space', async () => {
        // await page.click(`[class~="select-space"]`);
        // await page.type(`[class~="select-space"]`, spaceName);
        // await page.keyboard.press("Enter");

        await page.waitForSelector('[data-test="namespace"]');
        await page.fill('[data-test="namespace"]', executionHostSpaceName);
        await page.click('[data-test="submit-button"]');

    });

    test('Publish the blueprint', async () => {
        // publish BP after autodiscovery
        await page.waitForLoadState();
        await publishBlueprint(page, BPFullName);
        await page.pause();
    });



});
