import test, { expect } from "@playwright/test";
import { createSpaceAPI, deleteSpaceAPI } from "../functions/spaces.mjs";
import { getSessionAPI, validateGetSessionAPI } from "../functions/accounts.mjs";
import { validateAPIResponseis200 } from "../functions/general.mjs";
import { addPolicyAPI, deletePolicyAPI } from "../functions/policies.mjs";

const baseURL = process.env.baseURL;
const password = process.env.allAccountsPassword;
const account = process.env.account;
const user = process.env.adminEMail
const timestemp = Math.floor(Date.now() / 1000);
const space = 'api-policies'+timestemp;
let session = "empty session";

/** Test prerequisites
 * Have account with credentials as saved in .env file
 */

test.describe('Check AWS policies', () => {

    test.beforeAll(async () => {
        // get admin session
        session = await getSessionAPI(user, password, baseURL, account);
        await validateGetSessionAPI(session);
        await createSpaceAPI(baseURL, session, space);
    });

    test.afterAll(async() => {
        await deleteSpaceAPI(baseURL, session, space);
    });

    test(`Can't add duplicate policies`, async () =>{
        let policyType = 'AWS Only Private S3 Buckets'
        let policyName = 'duplicate-' + timestemp;
        console.log(`Adding duplicate policy called ${policyName}`);
        let response = await addPolicyAPI(session, baseURL, policyType, policyName);
        await validateAPIResponseis200(response);
        response = await addPolicyAPI(session, baseURL, policyType, policyName);
        expect(response.status).toBe(422);
        await deletePolicyAPI(session, baseURL, policyName);
    })

    test('Invalid space', async () => {
        let policyType = 'AWS Only Private S3 Buckets'
        let policyName = 'wrong-space-' + timestemp;
        console.log('Adding policy with invalid space');
        let response = await addPolicyAPI(session, baseURL, policyType, policyName, ['wrongwrong']);
        expect(response.status).toBe(404);
    });

    test('Invalid policy name', async () => {
        let policyType = 'wubba lubba dub dub'
        let policyName = 'wrong-space-' + timestemp;
        console.log('Adding policy with invalid policy ane (type)');
        let response = await addPolicyAPI(session, baseURL, policyType, policyName, ['wrongwrong']);
        expect(response.status).toBe(404);
    });
});