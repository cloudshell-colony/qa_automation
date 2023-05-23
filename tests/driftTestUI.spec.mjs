import { test, expect } from "@playwright/test";
import { loginToAccount, getSessionAPI, validateGetSessionAPI } from "./functions/accounts.mjs";
import { closeModal, selectFromDropbox } from "./functions/general.mjs";
import { goToSpace } from "./functions/spaces.mjs";

const baseURL = process.env.baseURL;
const password = process.env.allAccountsPassword;
const account = process.env.account;
const user = process.env.adminEMail;
const space = "drift-test";
const executionHostName = 'qa-eks';
let session;

/** Test prerequisites
 * Have account with credentials as saved in .env file
 * @space should exist in the account with @executionHostName agent associated to it
 * space should have repo https://github.com/QualiNext/torque-demo associated
 * and drift-test blueprint from the repo published
 */

test.describe('drift test on UI', () => {
    let page;
    test.beforeAll(async ({ browser }) => {
        session = await getSessionAPI(user, password, baseURL, account);
        await validateGetSessionAPI(session);
        page = await browser.newPage();
        await loginToAccount(page, user, account, password, baseURL);
        await closeModal(page);

    });

    test("launch blueprint with tag adding for drift and validate drifting and reconcile", async () => {
        await goToSpace(page, space)
        const blueprint = await page.locator('[data-test="catalog-bp-drift-test"]')
        await blueprint.locator('[data-test="launch-environment-from-blueprint"]').click()
        await page.locator('[data-test="go-to-next-step"]').click()
        selectFromDropbox(page, 'inputs.agent', executionHostName )
        await page.locator('[ data-test="launch-environment"]').click()
        await page.waitForSelector('[data-test="sandbox-info-column"] div:has-text("StatusActive")', { timeout: 5 * 60 * 1000 });
        const detectDrift = await page.locator('[data-test="deployment-drift-card"]')
        await detectDrift.click()
        await page.getByText('Check for Drift').click()
        const numLocator = await detectDrift.locator('[data-test="amount"]')
        await expect(numLocator).toContainText('1', { timeout: 150000})
        await detectDrift.click()
        const reconcilePage = await page.locator('.scrollable-container')
        await reconcilePage.getByRole('button', { name: /Reconcile/i }).click()
        await expect(numLocator).toContainText('0', { timeout: 120000})
        await page.locator('[data-test="end-sandbox"]').click()
        await page.locator('[data-test="confirm-end-sandbox"]').click()
        await page.locator('[data-test="sandboxes-nav-link"]').click()
        await expect(page.locator('[data-test="sandbox-row-0"]')).toContainText('Terminating', { timeout: 6000 });
        

    });
});