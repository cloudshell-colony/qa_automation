import { test, expect } from "@playwright/test";
import { loginToAccount, getSessionAPI, validateGetSessionAPI } from "./functions/accounts.mjs";
import { getBlueprintErrors, launchBlueprintWithInputs, validateBlueprintErrors } from "./functions/blueprints.mjs";
import { closeModal } from "./functions/general.mjs";
import { goToSpace } from "./functions/spaces.mjs";
import { associateExecutionHost, disassociateExecutionHostAPI } from "./functions/executionHosts.mjs";

const baseURL = process.env.baseURL;
const password = process.env.allAccountsPassword;
const account = process.env.account;
const user = process.env.adminEMail
const space = "bp-validation";
const bpValidationEKS = "bpValidation-eks";
const executionHostSpaceName = process.env.execHostNameSpace;
let session = "empty session";
let blueprintName;

//ideally this should be with API
//But there's no method to get errors of specific a specific blueprint
test.describe('Blueprint validation', ()=> {
    let page;
    test.beforeAll(async ({ browser }) => {
        session = await getSessionAPI(user, password, baseURL, account);
        await validateGetSessionAPI(session);
        page = await browser.newPage();
        await loginToAccount(page, user, account, password, baseURL);
        await closeModal(page);
    });
    test.afterAll(async () => {
        await page.close();
        const response = await disassociateExecutionHostAPI(session, baseURL, space, bpValidationEKS);   
        if(response.status != 200 && response.status != 404){
            console.error(`Execution host ${bpValidationEKS} possibly not removed from space ${space}, received response: ` + await response.text());
        }
    });

    const blueprintErrors = {"bad-yaml-format": ["Blueprint YAML file contains syntax error(s)"], 
        "unsupported-and-empty-grain": ["The following grains in the blueprint don't contains 'kind' definition:", "Blueprint contains unsupported grains"],
        "bad-inputs-outputs": ["field 'outputs->output' can't be resolved", "inputs->test' can't be resolved"], 
        "store-not-found": ["Repository 'wrong-store (in grains->bucket_1->spec->source->store)' does not exist"]};
    
    for(const [BPName, expectedErrors] of Object.entries(blueprintErrors)){
        test(`Static validation - blueprint "${BPName}" has relevent errors`, async() => {
            if (!page.url().endsWith(`/${space}/blueprints`)) {
                await goToSpace(page, space);
                await page.click("[data-test=blueprints-nav-link]");
            }
            const errList = await getBlueprintErrors(page, BPName);
            await validateBlueprintErrors(page, BPName, errList, expectedErrors);
        })
    };

    test("Static validation - Adding & removing execution host changes blueprint errors", async () => {
        blueprintName = "bad-eks";
        let expectedErrors = ["host missing compute-service field"];
        //go to execution hosts management, needs to be a function
        await page.click("[data-test=sidebar-dropdown]");
        await page.click("[data-test=option__admin]");
        console.log("Associating execution host to space");
        await associateExecutionHost(page, bpValidationEKS, executionHostSpaceName, space);
        await goToSpace(page, space);
        await page.click("[data-test=blueprints-nav-link]");
        //get and validate blueprint errors
        await page.waitForTimeout(10000); // wait for 10 seconds for blueprint errors to update
        let errList = await getBlueprintErrors(page, blueprintName);
        console.log("Validating blueprint errors after associating execution host");
        await validateBlueprintErrors(page, blueprintName, errList, expectedErrors);
        //disassociate eks from space, tries for 5 seconds
        console.log("Removing execution host from space");
        const response = await disassociateExecutionHostAPI(session, baseURL, space, bpValidationEKS);   
        expect(response.status, 'Execution host was not removed from space, MUST remove it manually').toBe(200)
        expectedErrors.unshift(`The compute service '${bpValidationEKS}`); //Adding error that should appear after removing EKS
        //get and validate blueprint errors
        await page.waitForTimeout(10000); // wait for 10 seconds for blueprint errors to update
        errList = await getBlueprintErrors(page, blueprintName);
        console.log("Validating blueprint errors after removing execution host");
        await validateBlueprintErrors(page, blueprintName, errList, expectedErrors);
    });

    test("Dynamic validation - Sandobx launch fails when providing wrong store and host name inputs", async() => {
        blueprintName = "store and host inputs";
        const inputsDict = {"inputs\.store" : "wrong value", "inputs\.host" : "wrong value"};
        await goToSpace(page, space);
        await page.click("[data-test=blueprints-nav-link]");
        console.log("Launching sandbox with bad inputs for store and execution host name");
        await launchBlueprintWithInputs(page, blueprintName, inputsDict);
        await page.waitForSelector("[data-testid=error-details-text]");
        const errMsg = await page.locator("[data-testid=error-details-text]");
        expect(errMsg, "Did not receive expected error when providing wrong store value").toContainText("Repository 'wrong value (in grains->bucket_1->spec->source->store)' does not exist");
        expect(errMsg, "Did not receive expected error when providing wrong host name value").toContainText("The compute service 'wrong value (in grains->bucket_1->spec->host->name)' was not found");
        await page.click("[data-test=close-popup]");
        await page.click("[data-test=wizard-cancel-button]");
    });

    test("Dynamic validation - Sandbox launches successfully when providing correct store and host name inputs", async() => {
        blueprintName = "store and host inputs";
        const inputsDict = {"inputs\.store" : "qa-assets", "inputs\.host" : "qa-eks"};
        await goToSpace(page, space);
        await page.click("[data-test=blueprints-nav-link]");
        console.log("Launching sandbox with correct inputs for store and execution host name");
        await launchBlueprintWithInputs(page, blueprintName, inputsDict);
        try{
            await page.waitForSelector(`[data-testid="error-details-text"]`, { timeout: 3000 })
        }
        catch{}
        let visi = await page.isVisible('[data-testid="error-details-text"]');
        expect(visi, `Sandbox launch failed, received following error: ` + await page.locator("[data-testid=error-details-text]").innerText()).toBeFalsy();
        console.log("Waiting for sandbox page");
        await page.waitForSelector('[data-test="sandbox-info-column"]');
        console.log("Ending sandbox");
        await page.click("[data-test=end-sandbox]");
        await page.click("[data-test=confirm-end-sandbox]");
    });

});