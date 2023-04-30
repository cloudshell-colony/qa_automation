import test, { expect } from "@playwright/test";
import { loginToAccount } from "./functions/accounts.mjs";
import { performAction } from "./functions/actions.mjs";
import { launchBlueprintFromCatalogPage } from "./functions/blueprints.mjs";
import { closeModal, openAndPinSideMenu, generateUniqueId, selectFromDropbox } from "./functions/general.mjs";
import goToAdminConsole from "./functions/goToAdminConsole.mjs";
import { addApprovalChannel, addPolicy, deletePolicy, editRego } from "./functions/policies.mjs";
import { endSandbox, validateSandboxFailedDueToPolicy, validateSBisActive } from "./functions/sandboxes.mjs";
import { goToSpace } from "./functions/spaces.mjs";

const baseURL = process.env.baseURL
const password = process.env.allAccountsPassword;
const account = process.env.account;
const user = process.env.adminEMail
const timestemp = Math.floor(Date.now() / 1000);
const id = timestemp.toString().concat('-' + generateUniqueId());
const space = 'aws-policies';
const approval = 'policy approval'

let page;
let executionHostName = 'qa-eks'


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
    });


    // Launch fails with public S3
    test.skip('Private S3 policy test with public ACL', async () => {
        let policyType = 'Only_Private_S3_Buckets'
        let policyName = policyType + '-' + id;
        let bucketName = policyName.replaceAll('_', '-').toLowerCase();
        let inputs = { 'inputs\.acl': "public-read", 'inputs\.agent': `${executionHostName}`, 'inputs\.name': `${bucketName}`, }
        console.log('Adding private S3 only policy');
        try {
            await addPolicy(page, policyType, 'space', space);
            await page.waitForTimeout(1500);
            const row = page.locator('[data-test="policies-row-1"]')

            await row.locator('[data-test="policy-enable-toggle"]').click();
            await page.waitForTimeout(1500);
            await goToSpace(page, space);
            console.log('Launching blueprint with public bucket');
            await launchBlueprintFromCatalogPage(page, 's3', inputs)
            await validateSandboxFailedDueToPolicy(page, 'Deployment of not private AWS S3 bucket is not allowed');
            await endSandbox(page);
            await expect(page.locator('[data-test="sandbox-row-0"]')).toBeHidden({ timeout: 10 * 60 * 1000 })
        } catch (error) {
            console.log('Error occurred: ' + error);
            await deletePolicy(page, policyName);
            throw error;
        }
    });

    // Launch succeed with private S3
    test.skip('Private S3 policy test with private ACL', async () => {
        let policyType = 'Only_Private_S3_Buckets'
        let policyName = policyType + '-' + id;
        let bucketName = policyName.replaceAll('_', '-').toLowerCase();
        console.log('Adding private S3 only policy');
        try {
            await goToSpace(page, space);
            let inputs = { 'inputs\.acl': "private", 'inputs\.agent': `${executionHostName}`, 'inputs\.name': `${bucketName}`, }
            await page.click('[data-test=blueprints-nav-link]');
            console.log('Launching blueprint with private bucket');
            await launchBlueprintFromCatalogPage(page, 's3', inputs)
            await validateSBisActive(page);
            await endSandbox(page);
            await expect(page.locator('[data-test="sandbox-row-0"]')).toBeHidden({ timeout: 10 * 60 * 1000 })
            await deletePolicy(page, policyName);
        } catch (error) {
            console.log('Error occurred: ' + error);
            await deletePolicy(page, policyName);
            throw error;

        }

    });

    // Launch fails with wrong region
    test('wrong region', async () => {
        let policyType = 'allowed_regions'
        let policyName = policyType + '-' + id;
        let region = 'eu-west-1';
        let regoValue = { "allowed_regions": ["eu-west-1"] }
        let bucketName = policyName.replaceAll('_', '-').toLowerCase();
        let inputs = { 'inputs\.region': "eu-west-2", 'inputs\.agent': `${executionHostName}`, 'inputs\.name': `${bucketName}`, }
        console.log('Adding allowed regions policy');
        try {
            await addPolicy(page, policyType, 'space', space);
            await editRego(page, regoValue)
            await page.waitForTimeout(1500);
            const row = page.locator('[data-test="policies-row-1"]')
            await row.locator('[data-test="policy-enable-toggle"]').click();
            await page.waitForTimeout(1500);
            await goToSpace(page, space);
            await page.click('[data-test=blueprints-nav-link]');
            console.log('Launching blueprint with prohibited region');
            await launchBlueprintFromCatalogPage(page, 's3', inputs)
            await validateSandboxFailedDueToPolicy(page, 'allowed_regions - "Invalid region:');
            await endSandbox(page);
            await expect(page.locator('[data-test="sandbox-row-0"]')).toBeHidden({ timeout: 10 * 60 * 1000 })
        } catch (error) {
            console.log('Error occurred: ' + error);
            await deletePolicy(page, policyName);
            throw error;
        }

    })

    // Launch succeeds with correct region
    test('Allowed region ', async () => {
        let policyType = 'allowed_regions'
        let policyName = policyType + '-' + id;
        let region = 'eu-west-1'
        let bucketName = policyName.replaceAll('_', '-').toLowerCase();
        let inputs = { 'inputs\.region': "eu-west-1", 'inputs\.agent': `${executionHostName}`, 'inputs\.name': `${bucketName}`, }
        await page.click('[data-test=blueprints-nav-link]');
        console.log('Launching blueprint with allowed region');
        try {
            await launchBlueprintFromCatalogPage(page, 's3', inputs)
            await validateSBisActive(page);
            await endSandbox(page);
            await expect(page.locator('[data-test="sandbox-row-0"]')).toBeHidden({ timeout: 10 * 60 * 1000 })
            await deletePolicy(page, policyName);

        } catch (error) {
            console.log('Error occurred: ' + error);
            await deletePolicy(page, policyName);
            throw error;

        }

    })

    //launch pending for duration approval//
    test('env duration for manual approval test ', async () => {
        let policyType = 'environment-duration'
        let policyName = policyType + '-' + id;
        let regoValue = { "env_max_duration_minutes": 130, "env_duration_for_manual_approval_minutes": 30 }
        let bucketName = policyName.replaceAll('_', '-').toLowerCase();
        let inputs = { 'inputs\.region': "eu-west-1", 'inputs\.agent': `${executionHostName}`, 'inputs\.name': `${bucketName}`, }
        let approval = 'policy approval'
        console.log('Adding environment duration policy');
        try {
            await addPolicy(page, policyType, 'space', space);
            await page.waitForTimeout(1500);
            await editRego(page, regoValue)
            await page.waitForTimeout(1500);
            await addApprovalChannel(page, approval)
            await page.waitForTimeout(1500);
            const row = page.locator('[data-test="policies-row-1"]')
            await row.locator('[data-test="policy-enable-toggle"]').click();
            await page.waitForTimeout(1500);
            await goToSpace(page, space);
            await launchBlueprintFromCatalogPage(page, 's3', inputs)
            await expect(page.locator('[data-test="request-row-0"]')).toContainText('Pending', { timeout: 6000 });
            await page.getByText('View Request').click()
            await page.getByText('Cancel the request').click()
            await deletePolicy(page, policyName);
        } catch (error) {
            console.log('Error occurred: ' + error);
            await deletePolicy(page, policyName);
            throw error;
        }

    })

    // Launch fails with max duration less than 2H//
    test('environment max duration test ', async () => {
        let policyType = 'environment-duration'
        let policyName = policyType + '-' + id;
        let regoValue = { "env_max_duration_minutes": 110, "env_duration_for_manual_approval_minutes": 5 }
        let bucketName = policyName.replaceAll('_', '-').toLowerCase();
        let inputs = { 'inputs\.region': "eu-west-1", 'inputs\.agent': `${executionHostName}`, 'inputs\.name': `${bucketName}`, }
        let approval = 'policy approval'
        console.log('Adding environment duration policy');
        try {
            await addPolicy(page, policyType, 'space', space);
            await page.waitForTimeout(1500);
            await editRego(page, regoValue)
            await page.waitForTimeout(1500);
            await addApprovalChannel(page, approval)
            await page.waitForTimeout(1500);
            const row = page.locator('[data-test="policies-row-1"]')
            await row.locator('[data-test="policy-enable-toggle"]').click();
            await page.waitForTimeout(1500);
            await goToSpace(page, space);
            await launchBlueprintFromCatalogPage(page, 's3', inputs)
            const popup = await page.getByText('You are not allowed to perform this action')
            await expect(popup).toBeVisible()
            await page.locator('[data-test="close-popup"]').click()
            await page.locator('[data-test="close-modal"]').click()
            await page.locator('[data-test="close-modal"]').click()
            await deletePolicy(page, policyName);
        } catch (error) {
            console.log('Error occurred: ' + error);
            await deletePolicy(page, policyName);
            throw error;
        }

    })

    test.skip('Request Manual Approval ', async () => {
        let policyType = 'request-manual-approval'
        let policyName = policyType + '-' + id;
        let bucketName = policyName.replaceAll('_', '-').toLowerCase();
        let inputs = { 'inputs\.region': "eu-west-1", 'inputs\.agent': `${executionHostName}`, 'inputs\.name': `${bucketName}` }
        let approval = 'policy approval'
        console.log('Adding Request Manual Approval policy');
        try {
            await addPolicy(page, policyType, 'space', space);
            await page.waitForTimeout(1500);
            await addApprovalChannel(page, approval)
            await page.waitForTimeout(1500);
            const row = page.locator('[data-test="policies-row-1"]')
            await row.locator('[data-test="policy-enable-toggle"]').click();
            await page.waitForTimeout(1500);
            await goToSpace(page, space);
            await launchBlueprintFromCatalogPage(page, 's3', inputs)
            await expect(page.locator('[data-test="request-row-0"]')).toContainText('Pending', { timeout: 6000 });
            await page.getByText('View Request').click()
            await page.getByText('Cancel the request').click()
            await deletePolicy(page, policyName);
        } catch (error) {
            console.log('Error occurred: ' + error);
            await deletePolicy(page, policyName);
            throw error;
        }

    })

    test('pohibited instance type policy with wrong rego ', async () => {
        let policyType = 'prohibited_instance_types'
        let policyName = policyType + '-' + id;
        let regoValue = { "prohibited_instance_types": "t3.micro" }
        let inputs = { 'inputs\.ami': "ami-0cd01c7fb16a9b497", 'inputs\.agent': `${executionHostName}`, 'inputs\.instance_type': `t3.micro`, }
        console.log('Adding pohibited instance type policy');
        try {
            await addPolicy(page, policyType, 'space', space);
            await editRego(page, regoValue)
            await page.waitForTimeout(1500);
            const row = page.locator('[data-test="policies-row-1"]')
            await row.locator('[data-test="policy-enable-toggle"]').click();
            await page.waitForTimeout(1500);
            await goToSpace(page, space);
            await launchBlueprintFromCatalogPage(page, 'create-ec2-instance', inputs)
            await validateSandboxFailedDueToPolicy(page, 'has to be an array')
            await endSandbox(page);
            await deletePolicy(page, policyName);
        } catch (error) {
            console.log('Error occurred: ' + error);
            await deletePolicy(page, policyName);
            throw error;
        }

    })

    test('pohibited instance type policy with prohibited instance ', async () => {

        let policyType = 'prohibited_instance_types'
        let policyName = policyType + '-' + id;
        let regoValue = { "prohibited_instance_types": ["t3.micro"] }
        let inputs = { 'inputs\.ami': "ami-0cd01c7fb16a9b497", 'inputs\.agent': `${executionHostName}`, 'inputs\.instance_type': `t3.micro`, }
        console.log('Adding pohibited instance type policy');
        try {
            await addPolicy(page, policyType, 'space', space);
            await editRego(page, regoValue)
            await page.waitForTimeout(1500);
            const row = page.locator('[data-test="policies-row-1"]')
            await row.locator('[data-test="policy-enable-toggle"]').click();
            await page.waitForTimeout(1500);
            await goToSpace(page, space);
            await launchBlueprintFromCatalogPage(page, 'create-ec2-instance', inputs)
            await validateSandboxFailedDueToPolicy(page, 'Invalid instance type')
            await endSandbox(page);
            await deletePolicy(page, policyName);
        } catch (error) {
            console.log('Error occurred: ' + error);
            await deletePolicy(page, policyName);
            throw error;
        }

    })

    test('Allowed resources ', async () => {

        let policyType = 'aws/allowed_resource_types'
        let policyName = policyType + '-' + id;
        let regoValue = { "allowed_resource_types": ["aws_s3_bucket"] }
        let bucketName = 'asaf-bucket2'
        let inputs = { 'inputs\.region': "eu-west-1", 'inputs\.agent': `${executionHostName}`, 'inputs\.name': `${bucketName}` }
        console.log('Adding Allowed resources policy');
        try {
            await addPolicy(page, policyType, 'space', space);
            await editRego(page, regoValue)
            await page.waitForTimeout(1500);
            const row = page.locator('[data-test="policies-row-1"]')
            await row.locator('[data-test="policy-enable-toggle"]').click();
            await page.waitForTimeout(1500);
            await goToSpace(page, space);
            await launchBlueprintFromCatalogPage(page, 's3', inputs)
            await page.locator('[data-test="sandboxes-nav-link"]').click()
            const sendboxRow = page.locator('[data-test="sandbox-row-0"]')
            await expect(sendboxRow).toContainText('Active', { timeout: 90000 });
            await sendboxRow.click()
            await page.locator('[data-test="end-sandbox"]').click()
            await page.locator('[data-test="confirm-end-sandbox"]').click()
            await deletePolicy(page, policyName);
        } catch (error) {
            console.log('Error occurred: ' + error);
            await deletePolicy(page, policyName);
            throw error;
        }

    })

    test('Allowed resources with wrong resource ', async () => {
        let policyType = 'aws/allowed_resource_types'
        let policyName = policyType + '-' + id;
        let regoValue = { "allowed_resource_types": ["aws_s3_bucket"] }
        let inputs = { 'inputs\.ami': "ami-0cd01c7fb16a9b497", 'inputs\.agent': `${executionHostName}`, 'inputs\.instance_type': `t3.micro`, }
        console.log('Adding Allowed resources policy');
        try {
            await addPolicy(page, policyType, 'space', space);
            await editRego(page, regoValue)
            await page.waitForTimeout(1500);
            const row = page.locator('[data-test="policies-row-1"]')
            await row.locator('[data-test="policy-enable-toggle"]').click();
            await page.waitForTimeout(1500);
            await goToSpace(page, space);
            await launchBlueprintFromCatalogPage(page, 'create-ec2-instance', inputs)
            await validateSandboxFailedDueToPolicy(page, 'Invalid resource type')
            await endSandbox(page);
            await deletePolicy(page, policyName);
        } catch (error) {
            console.log('Error occurred: ' + error);
            await deletePolicy(page, policyName);
            throw error;
        }

    })

    test('Validate power annotations ', async () => {
        let space = 'Annotations'
        let policyType = 'power.rego'
        let policyName = policyType + '-' + id;
        let AzureBPName = "azure_vm_legacy_wi"
        let AzureInputs = { 'inputs\.resource_group':policyName, 'inputs\.vm_name': "vidovm", 'inputs\.agent': 'qa-aks' }
        console.log('Adding power annotation policy');
        try {
            // await goToAdminConsole(page, 'policies');
            await page.locator('[data-test="administration-console"]').click()
            await page.waitForTimeout(2000)
            await page.locator('[data-test="policies-tab"]').click()
            await page.click('[data-test=apply-new-policy]');
            const policy = await page.locator('.select-policy-repos-dropdown__menu-list')
            await policy.getByText('opa-policies').click()
            await page.locator('[data-test="policy-toggle"]').click()
            await page.locator('[data-test="submit-button"]').click()
            await page.locator('[data-test="policies-row-1"]').click()
            await page.locator('[data-test="allSpaces"]').click()
            await selectFromDropbox(page, 'spaces', space);
            await page.getByRole('button', { name: 'save' }).click()
            await page.waitForTimeout(1500);
            const row = page.locator('[data-test="policies-row-1"]')
            await row.locator('[data-test="policy-enable-toggle"]').click();
            await page.waitForTimeout(1500)
            await goToSpace(page, space)
            await launchBlueprintFromCatalogPage(page, AzureBPName, AzureInputs)
            await page.waitForSelector('[data-test="sandbox-info-column"] div:has-text("StatusActive")', { timeout: 5 * 60 * 1000 });
            await performAction(page, 'vidovm', '(Deallocate) Azure VM', 'off', 'vm', 'azure')
            await page.locator('[data-test="sandboxes-nav-link"]').click()
            await expect( await page.locator('[data-test="sandbox-row-0"]')).toContainText('power: off',{ timeout: 10 * 60 * 1000 })
            await page.locator('[data-test="sandbox-row-0"]').click()
            await performAction(page, 'vidovm', 'Azure VM', 'on', 'vm', 'azure')
            await page.locator('[data-test="sandboxes-nav-link"]').click()
            await expect( await page.locator('[data-test="sandbox-row-0"]')).toContainText('power: on',{ timeout: 10 * 60 * 1000 })
            await page.locator('[data-test="sandbox-row-0"]').click()
            await endSandbox(page);
            await page.locator('[data-test="sandboxes-nav-link"]').click()
            await expect(page.locator('[data-test="sandbox-row-0"]')).toContainText('Ended', { timeout: 10 * 60 * 1000 });
            await deletePolicy(page, policyName);
        } catch (error) {
            console.log('Error occurred: ' + error);
            await deletePolicy(page, policyName);
            throw error;
        }

    })

    
});