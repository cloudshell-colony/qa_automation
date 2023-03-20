import { expect, test } from "@playwright/test";
import { getSessionAPI, loginToAccount } from "./functions/accounts.mjs";
import { launchBlueprintAPI } from "./functions/blueprints.mjs";
import { closeModal, generateUniqueId, openAndPinSideMenu } from "./functions/general.mjs";
import { endSandbox, validateSBisActiveAPI } from "./functions/sandboxes.mjs";
import { goToSpace } from "./functions/spaces.mjs";

const baseURL = process.env.baseURL
const password = process.env.allAccountsPassword
const account = process.env.account
const user = process.env.adminEMail
const timestemp = Math.floor(Date.now() / 1000);
const id = timestemp.toString().concat('-' + generateUniqueId());
const space = "EndingSB"
const AWSBPName = "autogen_create-ec2-instance"
const AzureBPName = "autogen_azure_vm_legacy_wi"
const AWSExecutionHostName = "qa-eks";
const AzureExecutionHostName = "qa-aks";
const EC2Inputs = { ami: "ami-0cd01c7fb16a9b497", instance_type: "t3.micro", agent: AWSExecutionHostName }
const AzureInputs = { resource_group: AzureBPName + '-' + id, vm_name: "vidovm", agent: AzureExecutionHostName }
const repoName = 'qtorque'
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

test.describe.serial('SendBox extention tests', () => {
    test.beforeAll(async ({ browser }) => {
        session = await getSessionAPI(user, password, baseURL, account);
        console.log(session)
        page = await browser.newPage();
        await loginToAccount(page, user, account, password, baseURL);
        await closeModal(page);
        await openAndPinSideMenu(page);

    });


    test("Create and validate new aws ec2", async () => {
        const response = await launchBlueprintAPI(session, baseURL, AWSBPName, space, EC2Inputs, repoName, duration = "PT2H")
        const responseJson = await response.json()
        console.log(responseJson)
        ID = responseJson.id
        console.log(ID)
        await validateSBisActiveAPI(session, baseURL, ID, space)
    })


    test("Create and validate new azure vm", async () => {
        const response = await launchBlueprintAPI(session, baseURL, AzureBPName, space, AzureInputs, repoName, duration = "PT2H")
        const responseJson = await response.json()
        console.log(responseJson)
        ID = responseJson.id
        console.log(ID)
        await validateSBisActiveAPI(session, baseURL, ID, space)
    })

    test(" End aws ec2 ", async () => {
        await goToSpace(page, space)
        await page.locator('[data-test="sandboxes-nav-link"]').click()
        await page.getByText(AWSBPName).click()
        await endSandbox(page)
        console.time('Time to end EC2')
        await expect( await page.locator('[data-test="sandbox-row-1"]')).toContainText('Terminating',{ timeout: 10 * 60 * 1000 })
        await expect( await page.locator('[data-test="sandbox-row-1"]')).toBeHidden({ timeout: 10 * 60 * 1000 })
        console.timeEnd('Time to end EC2')

    })

    test(" End azure vm", async () => {
        await goToSpace(page, space)
        await page.locator('[data-test="sandboxes-nav-link"]').click()
        await page.getByText(AzureBPName).click()
        await endSandbox(page)
        await page.waitForTimeout(1500)
        console.time('Time to end azure vm')
        await expect( await page.locator('[data-test="sandbox-row-0"]')).toContainText('Terminating',{ timeout: 10 * 60 * 1000 })
        await expect(await page.locator('[data-test="sandbox-row-0"]')).toBeHidden({ timeout: 10 * 60 * 1000 })
        console.timeEnd('Time to end azure vm')
    })

})