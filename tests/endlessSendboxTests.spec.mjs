import { expect, test } from "@playwright/test";
import { getSessionAPI, loginToAccount } from "./functions/accounts.mjs";
import { closeModal, openAndPinSideMenu } from "./functions/general.mjs";
import { goToSpace } from "./functions/spaces.mjs";

const baseURL = process.env.baseURL
const password = process.env.allAccountsPassword
const account = process.env.account
const user = process.env.adminEMail
const space = "endlessSB"
let session
let page

/** Test prerequisites
 * Have account with credentials as saved in .env file
 * @space should exist in the account with @executionHostName associated to it
 * Space should have repo https://github.com/QualiNext/test-spec2-public & 	https://github.com/QualiNext/torque-demo
 associated
 * and @BPName asset auto-generated to a blueprint
 */

test.describe.serial('Endless sendbox tests', () => {
    test.beforeAll(async ({ browser }) => {
        session = await getSessionAPI(user, password, baseURL, account);
        console.log(session)
        page = await browser.newPage();
        await loginToAccount(page, user, account, password, baseURL);
        await closeModal(page);
        await openAndPinSideMenu(page);

    });

    test(" Validate azure sb status is active and perform actions ", async () => {
        await goToSpace(page, space)
        await page.locator('[data-test="sandboxes-nav-link"]').click()
        try {
            const sandboxRowLocator = page.locator('[data-test="sandbox-row-0"]');
            const sandboxRowText = await sandboxRowLocator.textContent();
            const sandboxRowExists = sandboxRowText.includes('Active', { timeout:5000 });
    
            if (sandboxRowExists) {
                await page.locator('[data-test="sandbox-row-0"]').click();
                await page.hover('[data-test="environment-views"]')
                await page.getByText('Resources layout').click()
                await page.locator('[data-test="resource-card-vidovm"]').click()
                await page.getByText('Power-off (Deallocate) Azure VM').hover()
                await page.locator('[data-test="execute-action-azure-power-off-vm-tf"]').click()
                await expect(page.locator('[data-test="resource-status"]')).toContainText('Deallocated', { timeout: 10 * 60 * 1000 });
                await page.locator('[data-test="resource-card-vidovm"]').click()
                await page.getByText('Power-on Azure Vm').hover()
                await page.locator('[data-test="execute-action-azure-power-on-vm-tf"]').click()
                await expect(page.locator('[data-test="resource-status"]')).toContainText('Running', { timeout: 10 * 60 * 1000 });
            } else {
            }
        } catch (error) {
            console.log(error)
            throw error;
        }
      
    })

    test(" Validate aws sb status is active and perform drift test ", async () => {
        await goToSpace(page, space)
        await page.locator('[data-test="sandboxes-nav-link"]').click()
       
        try {
            const sandboxRowLocator = page.locator('[data-test="sandbox-row-1"]');
            const sandboxRowText = await sandboxRowLocator.textContent();
            const sandboxRowExists = sandboxRowText.includes('Active', { timeout:5000 });

            if (sandboxRowExists) {
                await page.locator('[data-test="sandbox-row-1"]').click();
                const detectDrift = await page.locator('[data-test="deployment-drift-card"]')
                await detectDrift.click()
                await page.getByText('Check for Drift').click()
                const numLocator = await detectDrift.locator('[data-test="amount"]')
                await expect(numLocator).toContainText('1', { timeout: 120000})
                await detectDrift.click()
                const reconcilePage = await page.locator('.scrollable-container')
                await reconcilePage.getByRole('button', { name: /Reconcile/i }).click()
                await expect(numLocator).toContainText('0', { timeout: 120000})
            } else {
            }
        } catch (error) {
            console.log(error)
            throw error;
        }
    })
})