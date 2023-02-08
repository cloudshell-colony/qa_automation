import { test, expect } from "@playwright/test";
import { loginToAccount, getSessionAPI, validateGetSessionAPI } from "./functions/accounts.mjs";
import { closeModal } from "./functions/general.mjs";
import { goToSpace } from "./functions/spaces.mjs";

const baseURL = process.env.baseURL;
const password = process.env.allAccountsPassword;
const account = process.env.account;
const user = process.env.adminEMail;
const space = "AmirO";
let session;

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
        await page.locator('.sc-lfRxJW >> nth=0').click()
        await page.getByText('qa-eks3').click()
        await page.keyboard.press("Enter");
        await page.locator('[ data-test="launch-environment"]').click()
        await page.locator('[data-test="sandboxes-nav-link"]').click()
        await expect(page.locator('[data-test="sandbox-row-0"]')).toContainText('Launching', { timeout: 6000 });
        await expect(page.locator('[data-test="sandbox-row-0"]')).toContainText('Active', { timeout: 5 * 60 * 1000 });
        await page.locator('[data-test="sandbox-row-0"]').click()
        const detectDrift = await page.locator('[data-test="deployment-drift-card"]')
        await detectDrift.click()
        await page.locator('.iKTCU').click()
        const numLocator = await detectDrift.locator('[data-test="amount"]')
        await expect(numLocator).toContainText('1', { timeout: 120000})
        await detectDrift.click()
        const reconcilePage = await page.locator('.scrollable-container')
        await reconcilePage.getByRole('button', { name: /Reconcile/i }).click()
        await expect(numLocator).toContainText('0', { timeout: 120000})
        await page.locator('[data-test="end-sandbox"]').click()
        await page.locator('[data-test="confirm-end-sandbox"]').click()
        await page.locator('[data-test="sandboxes-nav-link"]').click()
        await expect(page.locator('[data-test="sandbox-row-0"]')).toContainText('Terminating', { timeout: 6000 });
        await expect(page.locator('[data-test="sandbox-row-0"]')).toBeHidden({timeout: 10 * 60 * 1000})

    });
});