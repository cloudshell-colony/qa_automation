import { test, expect } from "@playwright/test";
import { loginToAccount, getSessionAPI, validateGetSessionAPI } from "./functions/accounts.mjs";
import { getBlueprintErrors, getBlueprintsAPI, launchBlueprintFromBPList, validateBlueprintErrors } from "./functions/blueprints.mjs";
import { catchErrorUI, closeModal, openAndPinSideMenu } from "./functions/general.mjs";
import { goToSpace } from "./functions/spaces.mjs";
import { associateExecutionHost, disassociateExecutionHostAPI } from "./functions/executionHosts.mjs";
import { validateSBisActive } from "./functions/sandboxes.mjs";
import goToAdminConsole from "./functions/goToAdminConsole.mjs";

/** Test prerequisites
 * Have account with credentials as saved in .env file
 * @space should exist in the account with @associatedAgent associated to the space
 * @bpValidationEKS needs to be defined and active (not associated to the space)
 * Repo https://github.com/QualiNext/qa-bp-validation is associated to the space
 */

const baseURL = process.env.baseURL;
const password = process.env.allAccountsPassword;
const account = process.env.account;
const user = process.env.adminEMail
const space = "bp-validation";
const bpValidationEKS = "bp-validation2";
const associatedAgent = "qa-eks";
const executionHostNameSpace = process.env.nameSpace;
const executionHostServiceAccount = process.env.serviceAccount;
const BPName = ['bad-yaml-format', 'unsupported-and-empty-grain', 'bad-inputs-outputs', 'store-not-found']
const BPerrors = ['Blueprint YAML file contains syntax error(s)', '']

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
        "unsupported-and-empty-grain": ["The following grains in the blueprint don't contains 'kind' definition: 'bucket_1'"],
        "bad-inputs-outputs": ["field 'outputs->output' can't be resolved", "inputs->test' can't be resolved"],
        "store-not-found": ["Repository 'wrong-store (in grains->bucket_1->spec->source->store)' does not exist"]
    };


    test("Validating blueprints errors", async () => {
        await goToSpace(page, space);
        await page.click("[data-test=blueprints-nav-link]");
        for (const key in blueprintErrors) {
            await page.locator('[data-test="blueprints-nav-link"]').click()
            await page.locator(`[data-test=blueprint-row-${key}]`).click()
            await page.locator('[data-test="designer-tab-yaml"]').click()
            let errorText = await page.$eval('[data-test="yaml-error"]', element => element.textContent);
            console.log('error text is ' + errorText);
            const expectedErrorMessage = blueprintErrors[key];
            console.log(expectedErrorMessage);
            const matchFound = expectedErrorMessage.some(expectedErrorMessage =>
                errorText.includes(expectedErrorMessage)
            );
            if (matchFound) {
                console.log(`Validation Passed for ${key}!`);
            } else {
                console.log(`Validation Failed for ${key}!`);
            }
        }

    });



    test.skip("Static validation - Adding & removing execution host changes blueprint errors", async () => {
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
        expectedErrors.unshift(`The agent '${bpValidationEKS}`); //Adding error that should appear after removing EKS
        //get and validate blueprint errors
        await page.waitForTimeout(10 * 1000); // wait for 10 seconds for blueprint errors to update
        console.log("Validating blueprint errors after removing execution host");
        await validateBlueprintErrors(page, blueprintName, await getBlueprintErrors(page, blueprintName), expectedErrors);
    });

    test("Dynamic validation - Sandbox launches successfully when providing correct execution host input", async () => {
        blueprintName = "host input";
        const inputsDict = { "inputs\.agent": associatedAgent };
        await goToSpace(page, space);
        await page.click("[data-test=blueprints-nav-link]");
        console.log("Launching sandbox with correct inputs for execution host name");
        // await page.pause()
        await launchBlueprintFromBPList(page, blueprintName, inputsDict);
        // await catchErrorUI(page, 'Sandbox launch');
        await page.waitForSelector('[data-test="sandbox-info-column"]');
        console.log("Waiting for sandbox to end launch");
        // await validateSBisActive(page);
        await page.waitForTimeout(10 * 1000);
        await page.waitForSelector('[data-test="sandbox-info-column"] div:has-text("StatusActive")', { timeout: 5 * 60 * 1000 });
        console.log("Ending sandbox");
        await page.click("[data-test=end-sandbox]");
        await page.click("[data-test=confirm-end-sandbox]");
    });

    test("Dynamic validation - Sandobx launch fails when providing wrong store input", async () => {
        blueprintName = "host input";
        const inputsDict = { "inputs\.agent": "wrong value" };
        await goToSpace(page, space);
        await page.click("[data-test=blueprints-nav-link]");
        console.log("Launching sandbox with bad inputs for execution host name");
        await launchBlueprintFromBPList(page, blueprintName, inputsDict);
        await page.waitForSelector("[data-testid=error-details-text]");
        const errMsg = await page.locator("[data-testid=error-details-text]");
        expect(errMsg, "Did not receive expected error when providing wrong host name value").toContainText("The agent 'wrong value (in grains->bucket_1->spec->agent->name)' was not found");
        await page.click("[data-test=close-popup]");
        await page.click("[data-test=close-modal]"); // go back in launch flow
        await page.click("[data-test=close-modal]");  // close sandbox launch
    });




    test("Validate proper yaml link in blueprint", async () => {
        session = await getSessionAPI(user, password, baseURL, account);
        await validateGetSessionAPI(session);
        const blueprintDetails = await getBlueprintsAPI(session, baseURL, space)
        const response = await blueprintDetails.json()
        console.log(`Yaml link response JSON: ` + JSON.stringify(response));
        console.log(response[0].url)
        const bpName = await response[0].name
        const bpUrl = await response[0].url
        expect(bpUrl).toEqual('https://github.com/QualiNext/qa-bp-validation/blob/master/blueprints/' + bpName + '.yaml')
    });

});