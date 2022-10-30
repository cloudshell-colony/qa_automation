import { test, expect } from "@playwright/test";
import { createAccount, getSessionAPI, validateSbLauncher } from "./functions/accounts.mjs";
import { launchAutoGeneratedBlueprint, publishBlueprint } from "./functions/blueprints.mjs";
import { getdeploymentFileAPI } from "./functions/executionHosts.mjs";
import { afterTestCleanup, closeModal, executeCLIcommand, openFromChecklist, overwriteAndSaveToFile, selectFromDropbox } from "./functions/general.mjs";
import { endSandbox, endSandboxValidation, validateS3BucketWasCreatedInSB, validateSBisActive } from "./functions/sandboxes.mjs";
import { addRepositoryAsset, craeteSpaceFromQuickLauncher, generateRepoSpecificKeys } from "./functions/spaces.mjs";


const baseURL = process.env.baseURL;
const allAccountsPassword = process.env.allAccountsPassword;
const prefix = process.env.accountPrefix;
const repProvider = process.env.repProvider;
const timestemp = Math.floor(Date.now() / 1000);
const firstName = "FN.".concat(prefix).concat(timestemp);
const lastName = "LN.".concat(prefix).concat(timestemp);
const companyName = "Company.".concat(prefix).concat(timestemp);
const accountName = prefix.concat(timestemp);
const spaceName = prefix.concat("-space-").concat(timestemp);
const email = prefix.concat("@").concat(timestemp).concat(".com");

const executionHost = process.env.execHostName;
const executionHostName = executionHost.concat(timestemp);

let sandboxName; // we will need it later on to terminate the sandbox we create
const bucketName = ("qa-auto-bucket-").concat(timestemp);
let repoKeys;

test.describe.serial('onboarding flow', () => {
    let context;
    let page;
    test.beforeAll(async ({ browser }) => {
        repoKeys = await generateRepoSpecificKeys(repProvider);
        context = await browser.newContext();
        page = await browser.newPage();
    });

    test.afterAll(async () => {
        await afterTestCleanup(page, accountName, baseURL, spaceName, executionHostName);
    });

    test('create new account', async () => {
        await createAccount(page, firstName, lastName, companyName, email, accountName, allAccountsPassword, baseURL);
        await page.waitForURL(`${baseURL}/Sample`, { timeout: 3 * 60 * 1000 });
        // comment out screenshot validation due to docker image path issue - windows vs ubuntu
        // await expect(page).toHaveScreenshot({ maxDiffPixels: 5000 });
        await closeModal(page);
    });

    test('create new space from quick launcher window', async () => {
        // start new space flow from quick sandbox launcher
        await openFromChecklist(page, "launched_environment");
        await craeteSpaceFromQuickLauncher(page, spaceName)
        // space flow remains afetr the space is created for future steps
    });

    test('add repositorry asset to the new space', async () => {
        // add repository asset
        await addRepositoryAsset(page, repoKeys);
        // space flow remains afetr asset is created for future steps
    });

    test('Enter execution host information to generate the yaml deployment file', async () => {
        await page.waitForLoadState();
        console.log(`host name: ${executionHostName}`);

        // // below commented lines will be needed as seperate function when creating execution host outside of onboarding flow
        // // select new cloud account option
        // await page.click(".select-select-existing-cloud__value-container");
        // await page.click('[data-test="additional-option"]');
        // await page.click('[data-test="submit-button"]');
        // select the EKS compute service
        await page.click('[data-test="cloud-type-aws"]');
        // select @#!$@! technology
        await page.click('[data-test="technology-type-EKS"]');
        await page.click('[data-test="submit-button"]');
        // enter compute service name
        await page.fill('[data-test="computeServiceName"]', executionHostName);
        // generate and deploy the agent
        await page.click('[data-test="submit-button"]');
        await page.click('[data-test="generate-command-button"]');
    });

    test('Create execution host deployment file', async () => {
        // get session for API call
        const session = await getSessionAPI(email, allAccountsPassword, baseURL, accountName);
        const response = await getdeploymentFileAPI(await session, baseURL, executionHostName, executionHostName);
        await overwriteAndSaveToFile("deploymentFile.yaml", response);
    });

    test('apply the execution host yaml file to K8S', async () => {
        const applyExecutionHost = await executeCLIcommand("kubectl apply -f deploymentFile.yaml");
    });

    test('complete the actions in the GUI after execution host agent is created in K8S', async () => {
        await page.waitForLoadState();
        // since new namespace is used a longer wait time of five minutes for the agent to deploy is needed
        await page.waitForSelector('[data-test="agent-connected"]', { timeout: 5 * 60 * 1000 });
        await page.click('[data-test="submit-button"]');
    });

    test('add execution host to space', async () => {
        // selecting execution host name
        await selectFromDropbox(page, "default-namespace-full__value-container", executionHostName);
        // selecting default K8s service account
        await selectFromDropbox(page, "default-service-account-full__value-container", "default");
        await page.click('[data-test="submit-button"]');
    });

    test('Publish the blueprint', async () => {
        // publish BP after autodiscovery        
        await publishBlueprint(page, repoKeys.BPName);
    });

    test('launch s3 blueprint', async () => {
        const inputsDict = { "inputs\.host_name": executionHostName, "inputs\.name": bucketName };
        sandboxName = await launchAutoGeneratedBlueprint(page, repoKeys.BPName, inputsDict);
        console.log('just created the following sandbox: ' + await sandboxName);
    });

    test('Validate sandbox is active without errors', async () => {
        await validateSBisActive(page);
    });

    test('Validate an s3_bucket_arn was created', async () => {
        await validateS3BucketWasCreatedInSB(page, bucketName);
    });

    test('End sandbox', async () => {
        await endSandbox(page);
    });


    test('Validate sandbox is completed', async () => {
        await endSandboxValidation(page, sandboxName);
    });
});
