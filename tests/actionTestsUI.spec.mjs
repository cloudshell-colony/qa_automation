import { test, expect } from "@playwright/test";
import { loginToAccount, getSessionAPI, validateGetSessionAPI } from "./functions/accounts.mjs";
import { performEC2Action } from "./functions/actions.mjs";
import { launchBlueprintFromCatalogPage } from "./functions/blueprints.mjs";
import { closeModal } from "./functions/general.mjs";
import { endSandbox, validateSBisActive } from "./functions/sandboxes.mjs";
import { goToSpace } from "./functions/spaces.mjs";

const baseURL = process.env.baseURL;
const password = process.env.allAccountsPassword;
const account = process.env.account;
const user = process.env.adminEMail;
const space = "Actions";
const executionHostName = 'qa-eks';
const blueprintName = 'create-ec2-instance'
let inputs = { 'inputs\.ami': "ami-0cd01c7fb16a9b497", 'inputs\.agent': `${executionHostName}`, 'inputs\.instance_type': `t3.micro`, }
let session;

/** Test prerequisites
 * Have account with credentials as saved in .env file
 * @space should exist in the account with @executionHostName agent associated to it
 * space should have repo 	https://github.com/QualiNext/test-spec2-public associated
 * and create-EC2-instance blueprint from the repo published
 */

test.describe('Actions tests on UI', () => {
    let page;
    test.beforeAll(async ({ browser }) => {
        session = await getSessionAPI(user, password, baseURL, account);
        await validateGetSessionAPI(session);
        page = await browser.newPage();
        await loginToAccount(page, user, account, password, baseURL);
        await closeModal(page);

    });

    test.only("launch EC2 instance and validate power off with action", async () => {
        await goToSpace(page, space)
        await launchBlueprintFromCatalogPage(page, blueprintName, inputs)
        await validateSBisActive(page)
        await performEC2Action(page, 'SSH instance', 'off');
        await expect(page.locator('[data-test="resource-status"]')).toContainText('Stopped', { timeout: 10 * 60 * 1000 });
    });

    test(" Validate power on with action", async () => {
        await goToSpace(page, space)
        await page.locator('[data-test="sandboxes-nav-link"]').click()
        await page.locator('[data-test="sandbox-row-0"]').click()
        await performEC2Action(page, 'SSH instance', 'on');
        await expect(page.locator('[data-test="resource-status"]')).toContainText('Running', { timeout: 10 * 60 * 1000 });
        await endSandbox(page)
    });


});