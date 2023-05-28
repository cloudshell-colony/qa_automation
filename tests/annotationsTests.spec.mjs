import test, { expect } from "@playwright/test";
import { getSessionAPI, loginToAccount } from "./functions/accounts.mjs";
import { performActionAPI } from "./functions/actions.mjs";
import { launchBlueprintFromCatalogPage } from "./functions/blueprints.mjs";
import { closeModal, openAndPinSideMenu, generateUniqueId } from "./functions/general.mjs";
import { endSandbox, findSandboxIdByNameAPI, getFirstSandboxesAPI, getSandboxDetailsAPI, getSendboxID } from "./functions/sandboxes.mjs";
import { goToSpace } from "./functions/spaces.mjs";

const baseURL = process.env.baseURL;
const password = process.env.allAccountsPassword;
const account = process.env.account;
const user = process.env.adminEMail;
const timestemp = Math.floor(Date.now() / 1000);
const id = timestemp.toString().concat('-' + generateUniqueId());
const numOfenvsTofatch = 1
const maxRetries = 4
const DealocateAction = 'azure-power-off-vm-tf'
const powerOnAction = 'azure-power-on-vm-tf'
let sbName;
let session;
let page;
let sendboxID;


/** Test prerequisites
 * Have account with credentials as saved in .env file
 * @space should exist in the account
 * space should have autogenerated blueprint called s3 from basic s3 asset
 * blueprint inputs should have agent, acl & name (for bucket name)
 * @executionHostName agent should be associated to space 
 * @approval should exist as an approval channel
 */

test.describe('Check AWS policies', () => {

    test.beforeAll(async ({ browser }) => {

        page = await browser.newPage();
        await loginToAccount(page, user, account, password, baseURL);
        await closeModal(page);
        await openAndPinSideMenu(page);
        session = await getSessionAPI(user, password, baseURL, account);
    });


    test('Validate power annotations ', async () => {
        let space = 'Annotations'
        let policyType = 'power.rego'
        let policyName = policyType + '-' + id;
        let AzureBPName = "azure_vm_legacy_wi"
        let AzureInputs = { 'inputs\.resource_group': policyName, 'inputs\.vm_name': "vidovm", 'inputs\.agent': 'qa-aks' }

        try {

            await goToSpace(page, space)
            sbName = await launchBlueprintFromCatalogPage(page, AzureBPName, AzureInputs)
            console.log(sbName);
            await page.waitForSelector('[data-test="sandbox-info-column"] div:has-text("StatusActive")', { timeout: 10 * 60 * 1000 });

            console.log("Performing Dealocate action");
            sendboxID = await findSandboxIdByNameAPI(session, baseURL, space, sbName);
            console.log('Annotations sendbox id is ' + sendboxID);
            let actionResponse = await performActionAPI(session, baseURL, space, sendboxID, AzureBPName, DealocateAction)
            console.log('response of performActionAPI is '+JSON.stringify(actionResponse));
            let actionResponseHeaders = actionResponse.headers
            console.log('the X-Correlation-Id when post dealocate action is ' + actionResponseHeaders.get('x-correlation-id'));
            console.log('Validating Dealocated status..');
            await page.hover('[data-test="environment-views"]');
            await page.getByText('Resources layout').click();
            await expect(page.locator('[data-test="resource-card-vidovm"]')).toContainText('Deallocated', { timeout: 5 * 60 * 1000 });

            await page.locator('[data-test="sandboxes-nav-link"]').click();
            console.log('Validating power-off annotation..');
            let response = await getSandboxDetailsAPI(session, baseURL, space, sendboxID);
            let headers = response.headers;
            console.log('the X-Correlation-Id after validating dealocate action status ' + headers.get('x-correlation-id'));
            await expect(page.locator('[data-test="sandbox-row-0"]')).toContainText('power: off', { timeout: 1 * 60 * 1000 });

            await page.getByText(sbName).click();
            console.log('Perform power-on action');
            actionResponse = await performActionAPI(session, baseURL, space, sendboxID, AzureBPName, powerOnAction);
            actionResponseHeaders = actionResponse.headers;
            console.log('the X-Correlation-Id when post power-on action is ' + actionResponseHeaders.get('x-correlation-id'));
            console.log('Validating Running status..');
            await page.hover('[data-test="environment-views"]');
            await page.getByText('Resources layout').click();
            await expect(page.locator('[data-test="resource-card-vidovm"]')).toContainText('Running', { timeout: 5 * 60 * 1000 });
            await page.locator('[data-test="sandboxes-nav-link"]').click();
            console.log('Validating power-on annotation..');
            response = await getSandboxDetailsAPI(session, baseURL, space, sendboxID);
            headers = response.headers;
            console.log('the X-Correlation-Id after validating running action status is ' + headers.get('x-correlation-id'));
            await expect(page.locator('[data-test="sandbox-row-0"]')).toContainText('power: on', { timeout: 1 * 60 * 1000 });

            await page.getByText(sbName).click();
            await endSandbox(page);
            await page.locator('[data-test="sandboxes-nav-link"]').click();
            await expect(page.locator('[data-test="sandbox-row-0"]')).toContainText('Terminating', { timeout: 2 * 60 * 1000 });

        } catch (error) {
            console.log('Error occurred: ' + error);
            await page.locator('[data-test="sandboxes-nav-link"]').click();
            await page.getByText(sbName).click();
            await endSandbox(page);
            throw error;
        }
    })
});