import { test, expect } from "@playwright/test";
import fetch from "node-fetch";
import { loginToAccount, getSessionAPI, validateGetSessionAPI } from "./functions/accounts.mjs";
import { countBlueprintsInSpace, getBlueprintErrors, validateBlueprintErrors } from "./functions/blueprints.mjs";
import { closeModal } from "./functions/general.mjs";
import goToAdminConsole from "./functions/goToAdminConsole.mjs";
import { goToSpace } from "./functions/spaces.mjs";
import { associateExecutionHost, disassociateExecutionHostAPI } from "./functions/executionHosts.mjs";

const baseURL = process.env.baseURL;
const password = process.env.allAccountsPassword;
const account = process.env.account;
const user = process.env.adminEMail
const space = "asaf-test";
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
        
    });

    test("Blueprint with invalid yaml has relevant errors", async () => {
        blueprintName = "bad-yaml-format";
        let expectedErrors = ["Blueprint YAML file contains syntax error(s)"];
        const errList = await getBlueprintErrors(page, blueprintName, space);
        // expect(errList.length, `Blueprint ${blueprintName} has ${errList.length} error messages instead of expected 1`).toBe(1);
        // expect(errList[0], `Wrong error returned from ${blueprintName} blueprint`).toContainText("Blueprint YAML file contains syntax error(s)");
        await validateBlueprintErrors(page, blueprintName, errList, expectedErrors);
    });

    test("Blueprint with unsupported and empty grain has relevant errors", async () => {
        blueprintName = "unsupported-and-empty-grain";
        let expectedErrors = ["The following grains in the blueprint don't contains 'kind' definition:", "Blueprint contains unsupported grains"];
        const errList = await getBlueprintErrors(page, blueprintName, space);
        await validateBlueprintErrors(page, blueprintName, errList, expectedErrors);
    });

    test("Blueprint with invalid inputs and outputs definitions has relevant errors", async () => {
        blueprintName = "bad-inputs-outputs";
        let expectedErrors = ["field 'outputs->output' can't be resolved", "inputs->test' can't be resolved"];
        const errList = await getBlueprintErrors(page, blueprintName, space);
        await validateBlueprintErrors(page, blueprintName, errList, expectedErrors);
    });

    test("Blueprint with store name that doesn't exist has relevant errors", async () => {
        blueprintName = "store-not-found";
        let expectedErrors = ["Repository 'wrong-store (in grains->bucket_1->spec->source->store)' does not exist"];
        const errList = await getBlueprintErrors(page, blueprintName, space);
        await validateBlueprintErrors(page, blueprintName, errList, expectedErrors);
    });

    test("Adding & removing execution host changes blueprint errors", async () => {
        blueprintName = "bad-eks";
        let expectedErrors = ["host missing compute-service field"];
        //go to execution hosts management, needs to be a function
        await page.click("[data-test=sidebar-dropdown]");
        await page.click("[data-test=option__admin]");
        console.log("Associating execution host to space");
        await associateExecutionHost(page, bpValidationEKS, executionHostSpaceName, space);
        //get and validate blueprint errors
        let errList = await getBlueprintErrors(page, blueprintName, space);
        console.log("Validating blueprint errors after associating execution host");
        await validateBlueprintErrors(page, blueprintName, errList, expectedErrors);
        //disassociate eks from space, tries for 5 seconds
        console.log("Removing execution host from space");
        await expect.poll(async () => {
            const response = await disassociateExecutionHostAPI(session, baseURL, space, bpValidationEKS);
            return response.status;
          }, {
            message: 'Execution host was not removed from space, MUST remove it manually', // custom error message
          }).toBe(200);
        expectedErrors.unshift(`The compute service '${bpValidationEKS}`); //Adding error that should appear after removing EKS
        //get and validate blueprint errors
        errList = await getBlueprintErrors(page, blueprintName, space);
        console.log("Validating blueprint errors after removing execution host");
        await validateBlueprintErrors(page, blueprintName, errList, expectedErrors);
    });

    test("Sandobx launch fails when providing wrong store input", async() => {
        blueprintName = "store and host inputs";
    });

});