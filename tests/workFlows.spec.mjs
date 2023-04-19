import { test, expect } from "@playwright/test";
import { loginToAccount, getSessionAPI, validateGetSessionAPI } from "./functions/accounts.mjs";
import { launchBlueprintFromCatalogPage } from "./functions/blueprints.mjs";
import { closeModal, selectFromDropbox } from "./functions/general.mjs";
import goToAdminConsole from "./functions/goToAdminConsole.mjs";
import { endSandbox, validateSBisActive } from "./functions/sandboxes.mjs";
import { goToSpace } from "./functions/spaces.mjs";
import { addWorkflow, removeWorkflow } from "./functions/workflows.mjs";

const baseURL = process.env.baseURL;
const password = process.env.allAccountsPassword;
const account = process.env.account;
const user = process.env.adminEMail;
const space = "Workflows";
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

test.describe.skip('Workflows tests on UI', () => {
    let page;
    test.beforeAll(async ({ browser }) => {
        session = await getSessionAPI(user, password, baseURL, account);
        await validateGetSessionAPI(session);
        page = await browser.newPage();
        await loginToAccount(page, user, account, password, baseURL);
        await closeModal(page);

    });

    test.skip("Create env power off workflow", async () => {
        await goToAdminConsole(page, 'workflows')
        await addWorkflow(page, 'power-off-env', 'env power off', 'shutting down sandbox', 'Terminate Environment', space)
        await page.waitForTimeout(1500);
        await page.locator('[data-test="workflow-enable-toggle"]').click()

    });

    test.skip("Add ec2 power off workflow", async () => {
        await addWorkflow(page, 'power-off-ec2', 'power ec2 off', 'shutting down resource', 'Power-off EC2', space)
        await page.waitForTimeout(1500);
        await page.getByRole('row', { name: 'power ec2 off shutting down resource Workflows' })
            .locator('[data-test="workflow-enable-toggle"]').click()

    });

    test.skip("Launch EC2 instance and validate  ec2 power off with workflow", async () => {
        await goToSpace(page, space)
        console.time('Time to launch ec2')
        await launchBlueprintFromCatalogPage(page, blueprintName, inputs)
        await validateSBisActive(page)
        console.timeEnd('Time to launch ec2')
        await page.hover('[data-test="environment-views"]')
        await page.getByText('Resources layout').click()
        const menu = await page.locator('[data-test="default-drawer"]')
        await menu.getByText('Workflows').click()
        const workflowsMenu = await page.locator('[data-test="automation-drawer"]')
        await workflowsMenu.getByText('power ec2 off').hover()
        await page.locator('[data-test="execute-workflow-power-off-ec2"]').click()
        console.time('Time to shut down ec2')
        await expect(page.locator('[data-test="resource-status"]')).toContainText('Stopped', { timeout: 10 * 60 * 1000 });
        console.timeEnd('Time to shut down ec2')
    });

    test.skip(" Validate env termination with workflow", async () => {
        await goToSpace(page, space)
        await page.locator('[data-test="sandboxes-nav-link"]').click()
        await page.locator('[data-test="sandbox-row-0"]').click()
        await page.hover('[data-test="environment-views"]')
        await page.getByText('Resources layout').click()
        const menu = await page.locator('[data-test="default-drawer"]')
        await menu.getByText('Workflows').click()
        const workflowsMenu = await page.locator('[data-test="automation-drawer"]')
        await workflowsMenu.getByText('env power off').hover()
        await page.locator('[data-test="execute-workflow-power-off-env"]').click()
        await page.locator('[data-test="sandboxes-nav-link"]').click()
        await expect(page.locator('[data-test="sandbox-row-0"]')).toContainText('Terminating', { timeout: 20000 });

    });

    test.skip(" Delete power off ec2 workflow", async () => {
        await goToAdminConsole(page, 'workflows')
        await removeWorkflow(page, 'shutting down resource')
    });

    test.skip(" Delete shutting down sb workflow", async () => {
        await goToAdminConsole(page, 'workflows')
        await removeWorkflow(page, 'shutting down sandbox')
    });

});