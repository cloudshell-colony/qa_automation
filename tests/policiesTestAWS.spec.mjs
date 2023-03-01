import test, { expect } from "@playwright/test";
import { loginToAccount } from "./functions/accounts.mjs";
import { launchBlueprintFromCatalogPage } from "./functions/blueprints.mjs";
import { closeModal, openAndPinSideMenu, generateUniqueId } from "./functions/general.mjs";
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
let page;
let executionHostName = 'qa-eks'

test.describe('Check AWS policies', () => {

    test.beforeAll(async ({ browser }) => {
        page = await browser.newPage();
        await loginToAccount(page, user, account, password, baseURL);
        await closeModal(page);
        await openAndPinSideMenu(page);
    });


    // Launch fails with public S3
    test('Private S3 policy test with public ACL', async () => {
        let policyType = 'Only_Private_S3_Buckets'
        let policyName = policyType + '-' + id;
        let bucketName = policyName.replaceAll('_', '-').toLowerCase();
        let inputs = { 'inputs\.acl': "public-read", 'inputs\.agent': `${executionHostName}`, 'inputs\.name': `${bucketName}`, }
        console.log('Adding private S3 only policy');
        await addPolicy(page, policyType, 'space', space);
        await page.waitForTimeout(1500);
        await page.locator('[data-test="policy-enable-toggle"]').click();
        await page.waitForTimeout(1500);
        await goToSpace(page, space);
        console.log('Launching blueprint with public bucket');
        await launchBlueprintFromCatalogPage(page, 's3', inputs)
        await validateSandboxFailedDueToPolicy(page, 'Deployment of not private AWS S3 bucket is not allowed');
        await endSandbox(page);
        await expect(page.locator('[data-test="sandbox-row-0"]')).toBeHidden({ timeout: 10 * 60 * 1000 })

    });

    // Launch succeed with private S3
    test('Private S3 policy test with private ACL', async () => {
        let policyType = 'Only_Private_S3_Buckets'
        let policyName = policyType + '-' + id;
        let bucketName = policyName.replaceAll('_', '-').toLowerCase();
        console.log('Adding private S3 only policy');
        await goToSpace(page, space);
        let inputs = { 'inputs\.acl': "private", 'inputs\.agent': `${executionHostName}`, 'inputs\.name': `${bucketName}`, }
        await page.click('[data-test=blueprints-nav-link]');
        console.log('Launching blueprint with private bucket');
        await launchBlueprintFromCatalogPage(page, 's3', inputs)
        await validateSBisActive(page);
        await endSandbox(page);
        await expect(page.locator('[data-test="sandbox-row-0"]')).toBeHidden({ timeout: 10 * 60 * 1000 })
        await deletePolicy(page, policyName);
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
        await addPolicy(page, policyType, 'space', space);
        await editRego(page, regoValue)
        await page.waitForTimeout(1500);
        await page.locator('[data-test="policy-enable-toggle"]').click();
        await page.waitForTimeout(1500);
        await goToSpace(page, space);
        await page.click('[data-test=blueprints-nav-link]');
        console.log('Launching blueprint with prohibited region');
        await launchBlueprintFromCatalogPage(page, 's3', inputs)
        await validateSandboxFailedDueToPolicy(page, 'allowed_regions - "Invalid region:');
        await endSandbox(page);
        await expect(page.locator('[data-test="sandbox-row-0"]')).toBeHidden({ timeout: 10 * 60 * 1000 })
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
        await launchBlueprintFromCatalogPage(page, 's3', inputs)
        await validateSBisActive(page);
        await endSandbox(page);
        await expect(page.locator('[data-test="sandbox-row-0"]')).toBeHidden({ timeout: 10 * 60 * 1000 })
        await deletePolicy(page, policyName);
    })

    // Launch fails with max duration less than 2H//
    test('environment max duration test ', async () => {
        let policyType = 'environment-duration'
        let policyName = policyType + '-' + id;
        let regoValue = {  "env_max_duration_minutes": 110, "env_duration_for_manual_approval_minutes": 5 }
        let bucketName = policyName.replaceAll('_', '-').toLowerCase();
        let inputs = { 'inputs\.region': "eu-west-1", 'inputs\.agent': `${executionHostName}`, 'inputs\.name': `${bucketName}`, }
        let approval = 'policy approval'
        console.log('Adding environment duration policy');
        await addPolicy(page, policyType, 'space', space);
        await page.waitForTimeout(1500);
        await editRego(page, regoValue)
        await page.waitForTimeout(1500);
        await addApprovalChannel(page, approval)
        await page.waitForTimeout(1500);
        await page.locator('[data-test="policy-enable-toggle"]').click();
        await page.waitForTimeout(1500);
        await goToSpace(page, space);
        await launchBlueprintFromCatalogPage(page, 's3', inputs)
        const popup = await page.getByText('You are not allowed to perform this action')
        await expect(popup).toBeVisible()
        await page.locator('[data-test="close-popup"]').click()
        await page.locator('[data-test="close-modal"]').click()
        await page.locator('[data-test="close-modal"]').click()
        await deletePolicy(page, policyName);
    })

    //launch pending for approval//
    test('env duration for manual approval test ', async () => {
        let policyType = 'environment-duration'
        let policyName = policyType + '-' + id;
        let regoValue = {  "env_max_duration_minutes": 130, "env_duration_for_manual_approval_minutes": 5 }
        let bucketName = policyName.replaceAll('_', '-').toLowerCase();
        let inputs = { 'inputs\.region': "eu-west-1", 'inputs\.agent': `${executionHostName}`, 'inputs\.name': `${bucketName}`, }
        let approval = 'policy approval'
        console.log('Adding environment duration policy');
        await addPolicy(page, policyType, 'space', space);
        await page.waitForTimeout(1500);
        await editRego(page, regoValue)
        await page.waitForTimeout(1500);
        await addApprovalChannel(page, approval)
        await page.waitForTimeout(1500);
        await page.locator('[data-test="policy-enable-toggle"]').click();
        await page.waitForTimeout(1500);
        await goToSpace(page, space);
        await launchBlueprintFromCatalogPage(page, 's3', inputs)
        await expect(page.locator('[data-test="request-row-0"]')).toContainText('Pending', { timeout: 6000 });
        await page.getByText('View Request').click()
        await page.getByText('Cancel the request').click()
        await deletePolicy(page, policyName);
     
    })
});