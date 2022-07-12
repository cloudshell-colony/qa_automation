import { test, expect } from "@playwright/test";
import { createAccount, getSessionAPI, validateSbLauncher } from "./functions/accounts.mjs";
import { getdeploymentFileAPI } from "./functions/executionHosts.mjs";
import { executeCLIcommand, overwriteAndSaveToFile, publishBlueprint } from "./functions/general.mjs";
import { endSandbox } from "./functions/sandboxes.mjs";
import { craeteSpaceFromQuickLauncher, generateRepoSpecificKeys, goToSpace, repositoryAssetInfo } from "./functions/spaces.mjs";

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
    let sandboxName;
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
        await validateSbLauncher(page, baseURL);
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
        expect(await numberOfBlueprints.count()).toEqual(parseInt(specificRepoData.BPscount));
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

    test('Create execution host deployment file', async () => {
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
        await publishBlueprint(page, BPFullName);
    });

    test('Launch sandbox', async () => {
        const bitnami = "Bitnami Nginx Helm Chart";
        await goToSpace(page, "Sample");
        //await page.click(`[data-test="tf-based-blueprint-row-${BPFullName}"] button:has-text("Launch Sandbox")`);
        await page.click(`[data-test="blueprint-row-${bitnami}"] button:has-text("Launch Sandbox")`);
        sandboxName = await page.getAttribute("[data-test=sandboxName]", "value");
        console.log(`Sandbox name is ${sandboxName}`);
        await page.locator('[data-test="wizard-next-button"]').click();
        await page.waitForSelector('[data-test="sandbox-info-column"]');
        expect(await page.isVisible('[data-test="sandbox-info-column"] div:has-text("Sandbox StatusLaunching")', 500)).toBeTruthy();
        let visi = await page.isVisible('[data-test="sandbox-info-column"] div:has-text("Sandbox StatusLaunching")');
        while (await visi) {
            visi = await page.isVisible('[data-test="sandbox-info-column"] div:has-text("Sandbox StatusLaunching")');
        }
        expect(await page.isVisible('[data-test="sandbox-info-column"] div:has-text("Sandbox StatusActive")', 500)).toBeTruthy();
        const items = await page.locator('[data-test="grain-kind-indicator"]');
        for (let i = 0; i < await items.count(); i++) {
            await items.nth(i).click();
        }
        const prepare = await page.locator('text=/PrepareCompleted/');
        const install = await page.locator('text=/InstallCompleted/');
        const apply = await page.locator('text=/ApplyCompleted/');
        /*for (let i = 0; i < await prepare.count(); i++) {
          expect(prepare.nth(i)).toContainText(/Completed/);
          console.log("found Completed prepare");
        };
        for (let i = 0; i < await install.count(); i++) {
          expect(install.nth(i)).toContainText(/Completed/)
          console.log("found Completed install");
        };
        for (let i = 0; i < await apply.count(); i++) {
          expect(apply.nth(i)).toContainText(/Completed/)
          console.log("found Completed apply");
        };*/
    });

    test('End launched sandbox', async () => {
        await endSandbox(page);
        await page.waitForSelector(`tr:has-text("${sandboxName}")`, { has: page.locator("data-testid=moreMenu") });
        let visi = page.isVisible(`tr:has-text("${sandboxName}")`, { has: page.locator("data-testid=moreMenu") });
        expect(await page.locator(`tr:has-text("${sandboxName}")`, { has: page.locator("data-testid=moreMenu") })).toContainText("Terminating");
        while (await visi) {
            await page.waitForTimeout(50);
            visi = page.isVisible(`tr:has-text("${sandboxName}")`);
        }
        await page.click(`[data-toggle=true]`); //Need UI to add data-test for this button
        await page.click(`tr:has-text("${sandboxName}")`);
        await page.waitForSelector("[data-test=sandbox-page-content]");
        const items = await page.locator('[data-test="grain-kind-indicator"]');
        for (let i = 0; i < await items.count(); i++) {
            await items.nth(i).click();
        }
        const destroy = await page.locator('text=/DestroyCompleted/');
        const uninstall = await page.locator('text=/UninstallCompleted/');
        for (let i = 0; i < await destroy.count(); i++) {
            expect(destroy.nth(i)).toContainText(/Completed/);
            console.log("found Completed destroy");
        };
        for (let i = 0; i < await uninstall.count(); i++) {
            expect(uninstall.nth(i)).toContainText(/Completed/);
            console.log("found Completed uninstall");
        };
    });
});
