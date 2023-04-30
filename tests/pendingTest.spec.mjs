import { expect, test } from "@playwright/test";
import { getSessionAPI, loginToAccount } from "./functions/accounts.mjs";
import { launchBlueprintAPI, launchSampleBlueprintFromCatalogPage } from "./functions/blueprints.mjs";
import { closeModal, generateUniqueId, openAndPinSideMenu } from "./functions/general.mjs";
import { endSandbox, validateSBisActiveAPI } from "./functions/sandboxes.mjs";
import { goToSpace } from "./functions/spaces.mjs";

const baseURL = process.env.baseURL
const password = process.env.allAccountsPassword
const account = process.env.account
const user = process.env.adminEMail
const timestemp = Math.floor(Date.now() / 1000);
const id = timestemp.toString().concat('-' + generateUniqueId());
const adminUser = 'amir.o@quali.com'
const adminPass = 'Qaz123456'
const space = "PendingTest"
const AWSBPName = "autogen_create-ec2-instance"
const AzureBPName = "autogen_azure_vm_legacy_wi"
const AWSExecutionHostName = "qa-eks";
const AzureExecutionHostName = "qa-aks";
const EC2Inputs = { ami: "ami-0cd01c7fb16a9b497", instance_type: "t3.micro", agent: AWSExecutionHostName }
const AzureInputs = { resource_group: AzureBPName + '-' + id, vm_name: "vidovm", agent: AzureExecutionHostName }


let duration
let session
let ID
let page


/** Test prerequisites
 * Have account with credentials as saved in .env file
 * @space should exist in the account with @executionHostName associated to it
 * Space should have repo https://github.com/QualiNext/test-spec2-public & 	https://github.com/johnathanvidu/prod-tests	
 associated
 * and @BPName asset auto-generated to a blueprint
 */

test.describe.serial('Approve pending sendbox', () => {
    test.beforeAll(async ({ browser }) => {
        session = await getSessionAPI(user, password, baseURL, account);
        console.log(session)
        page = await browser.newPage();
        await loginToAccount(page, user, account, password, baseURL);
        await closeModal(page);
        await openAndPinSideMenu(page);

    });

    test(" Validate environment in pending status, approve it and validate status launching ", async ({ browser }) => {
        await goToSpace(page, space)
        await page.locator('[data-test="sandboxes-nav-link"]').click()
        try {
            const sandboxRowLocator = page.locator('[data-test="request-row-0"]');
            const sandboxRowText = await sandboxRowLocator.textContent();
            const sandboxRowExists = sandboxRowText.includes('Pending', { timeout: 5000 });

            if (sandboxRowExists) {
                await page.close();
                page = await browser.newPage();
                await loginToAccount(page, adminUser, account, adminPass, baseURL);
                await closeModal(page);
                await openAndPinSideMenu(page);
                await goToSpace(page, space)
                await page.locator('[data-test="sandboxes-nav-link"]').click()
                await page.getByText('View Request').click()
                await page.getByRole('button', { name: 'Approve' }).click()
                await page.locator('[data-test="sandboxes-nav-link"]').click()
                await expect(page.locator('[data-test="sandbox-row-0"]')).toContainText('Launching', { timeout: 10000 });
                await page.close();
            } else {
            }
        } catch (error) {
            console.log(error)
        }

    })

    test("Validate sb active status", async ({ browser }) => {
        try {
            page = await browser.newPage();
            await loginToAccount(page, user, account, password, baseURL);
            await closeModal(page);
            await openAndPinSideMenu(page);
            await goToSpace(page, space)
            await page.locator('[data-test="sandboxes-nav-link"]').click()
            console.log('Waiting for status to be active...');
            await expect(page.locator('[data-test="sandbox-row-0"]')).toContainText('Active', { timeout: 10 * 60 * 1000 });
            await page.locator('[data-test="sandbox-row-0"]').click()
            await endSandbox(page)
        } catch (error) {
            console.log(error)
        }
      
    })
    
    

    test("Launch environment and validate status is pending", async () => {
        let AWSBPName = "autogen_s3"
        let s3Inputs =   {acl: "private", name: "pending", region: "eu-west-1", user: "none", agent: "qa-eks"}
        let repoName = 'qtorque'
        console.log('Launching s3..')
        await launchBlueprintAPI(session, baseURL, AWSBPName, space, s3Inputs, repoName, duration = "")
        await goToSpace(page, space)
        await page.locator('[data-test="sandboxes-nav-link"]').click()
        await expect(page.locator('[data-test="request-row-0"]')).toContainText('Pending', { timeout: 10 * 60 * 1000 });

    })

})