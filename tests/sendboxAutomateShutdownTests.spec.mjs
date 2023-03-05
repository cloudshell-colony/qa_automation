import { expect, test } from "@playwright/test";
import { getSessionAPI } from "./functions/accounts.mjs";
import { launchBlueprintAPI } from "./functions/blueprints.mjs";
import { getSandboxDetailsAPI, validateSBisActiveAPI, validateSBisEndedAPI } from "./functions/sandboxes.mjs";

const baseURL = process.env.baseURL
const password = process.env.allAccountsPassword
const account = process.env.account
const user = process.env.adminEMail
const space = "extend-test"
const BPName = "autogen_simpleTF"
const inputs = { agent: "qa-eks" }
const repoName = 'qtorque'
let duration
let session

/** Test prerequisites
 * Have account with credentials as saved in .env file
 * @space should exist in the account
 * space should have repo https://github.com/QualiNext/qa-bp-validation associated
 * and simpleTF asset auto-generated to a published blueprint
 * agent called 'qa-eks' should be associated (as saved in blueprint inputs)
 */

test.describe.serial('SendBox extention tests', () => {
    test.beforeAll(async () => {
        session = await getSessionAPI(user, password, baseURL, account);
        console.log(session)
    });

    test("Create 6 minutes sendbox and validate automate shutdown ", async () => {
        const response = await launchBlueprintAPI(session, baseURL, BPName, space, inputs, repoName, duration = "PT6M") 
        const responseJson = await response.json()
        console.log(responseJson)
        const ID = responseJson.id
        console.log(ID)
        await validateSBisActiveAPI(session, baseURL, ID, space)
        await validateSBisEndedAPI(session, baseURL, ID, space)  
    })
})