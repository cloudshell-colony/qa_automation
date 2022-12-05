import { test, expect } from "@playwright/test";
import { loginToAccount, getSessionAPI, validateGetSessionAPI } from "./functions/accounts.mjs";
import { getBlueprintErrors, launchBlueprintFromBPList, validateBlueprintErrors } from "./functions/blueprints.mjs";
import { closeModal, openAndPinSideMenu } from "./functions/general.mjs";
import { goToSpace } from "./functions/spaces.mjs";
import { associateExecutionHost, disassociateExecutionHostAPI } from "./functions/executionHosts.mjs";
import { validateSBisActive } from "./functions/sandboxes.mjs";
import goToAdminConsole from "./functions/goToAdminConsole.mjs";

/**
 * preconditions
 * space name is bp-validation
 * BP repo: https://github.com/QualiNext/qa-bp-validation
 * agent name "qa-eks2" need to associated with the space
 * 
 * agent name "bp-validation2" need to be defined and acive (not associated to the space)
 */

const baseURL = process.env.baseURL;
const password = process.env.allAccountsPassword;
const account = process.env.account;
const user = process.env.adminEMail
const space = "bp-validation";
const bpValidationEKS = "bp-validation2";
// const executionHostNameSpace = "torque-agent-bp-validation";
const executionHostNameSpace = process.env.nameSpace;
const executionHostServiceAccount = process.env.serviceAccount;

let session = "empty session";
let blueprintName;

//ideally this should be with API
//But there's no method to get errors of specific a specific blueprint
test.describe('Blueprint validation', () => {
    let page;
    test.beforeAll(async ({ browser }) => {
        session = await getSessionAPI(user, password, baseURL, account);
        await validateGetSessionAPI(session);
        page = await browser.newPage();
        await loginToAccount(page, user, account, password, baseURL);
        await closeModal(page);
        await openAndPinSideMenu(page);
    });
    test.afterAll(async () => {
        await page.close();
        const response = await disassociateExecutionHostAPI(session, baseURL, space, bpValidationEKS);
        if (response.status != 200 && response.status != 404) {
            console.error(`Execution host ${bpValidationEKS} possibly not removed from space ${space}, received response: ` + await response.text());
        }
    });

    const blueprintErrors = {
        "bad-yaml-format": ["Blueprint YAML file contains syntax error(s)"],
        "unsupported-and-empty-grain": ["The following grains in the blueprint don't contains 'kind' definition:", "Blueprint contains unsupported grains"],
        "bad-inputs-outputs": ["field 'outputs->output' can't be resolved", "inputs->test' can't be resolved"],
        "store-not-found": ["Repository 'wrong-store (in grains->bucket_1->spec->source->store)' does not exist"]
    };

    for (const [BPName, expectedErrors] of Object.entries(blueprintErrors)) {
        test(`Static validation - blueprint "${BPName}" has relevent errors`, async () => {
            if (!page.url().endsWith(`/${space}/blueprints`)) {
                await goToSpace(page, space);
                await page.click("[data-test=blueprints-nav-link]");
            }
            await validateBlueprintErrors(page, BPName, await getBlueprintErrors(page, BPName), expectedErrors);
        })
    };

    test("Static validation - Adding & removing execution host changes blueprint errors", async () => {
        blueprintName = "bad-eks";
        let expectedErrors = ["host missing compute-service field"];
        await goToAdminConsole(page, "cloud accounts")
        console.log("Associating execution host to space");
        await associateExecutionHost(page, bpValidationEKS, executionHostNameSpace, executionHostServiceAccount, space);
        await goToSpace(page, space);
        await page.click("[data-test=blueprints-nav-link]");
        //get and validate blueprint errors
        await page.waitForTimeout(10 * 1000); // wait for 10 seconds for blueprint errors to update
        console.log("Validating blueprint errors after associating execution host");
        await validateBlueprintErrors(page, blueprintName, await getBlueprintErrors(page, blueprintName), expectedErrors);
        console.log("Removing execution host from space");
        const response = await disassociateExecutionHostAPI(session, baseURL, space, bpValidationEKS);
        expect(response.status, 'Execution host was not removed from space, MUST remove it manually').toBe(200)
        expectedErrors.unshift(`The compute service '${bpValidationEKS}`); //Adding error that should appear after removing EKS
        //get and validate blueprint errors
        await page.waitForTimeout(10 * 1000); // wait for 10 seconds for blueprint errors to update
        console.log("Validating blueprint errors after removing execution host");
        await validateBlueprintErrors(page, blueprintName, await getBlueprintErrors(page, blueprintName), expectedErrors);
    });

    test("Dynamic validation - Sandobx launch fails when providing wrong store input", async () => {
        blueprintName = "host input";
        const inputsDict = { "inputs\.host": "wrong value" };
        await goToSpace(page, space);
        await page.click("[data-test=blueprints-nav-link]");
        console.log("Launching sandbox with bad inputs for execution host name");
        await launchBlueprintFromBPList(page, blueprintName, inputsDict);
        await page.waitForSelector("[data-testid=error-details-text]");
        const errMsg = await page.locator("[data-testid=error-details-text]");
        expect(errMsg, "Did not receive expected error when providing wrong host name value").toContainText("The compute service 'wrong value (in grains->bucket_1->spec->host->name)' was not found");
        await page.click("[data-test=close-popup]");
        await page.click("[data-test=wizard-cancel-button]");
    });

    test("Dynamic validation - Sandbox launches successfully when providing correct execution host input", async () => {
        let err;
        blueprintName = "host input";
        const inputsDict = { "inputs\.host": "qa-eks2" };
        await goToSpace(page, space);
        await page.click("[data-test=blueprints-nav-link]");
        console.log("Launching sandbox with correct inputs for execution host name");
        await launchBlueprintFromBPList(page, blueprintName, inputsDict);
        try {
            err = await page.locator("[data-testid=error-details-text]", { timeout: 3000 }).innerText();
        }
        catch { }
        let visi = await page.isVisible('[data-testid="error-details-text"]');
        expect(visi, `Sandbox launch failed, received following error: ` + err).toBeFalsy();
        await page.waitForSelector('[data-test="sandbox-info-column"]');
        console.log("Waiting for sandbox to end launch");
        await validateSBisActive(page);
        console.log("Ending sandbox");
        await page.click("[data-test=end-sandbox]");
        await page.click("[data-test=confirm-end-sandbox]");
    });

});