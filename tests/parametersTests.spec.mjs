
import test, { expect } from "@playwright/test";
import { signupUserAPI, getSessionAPI, sendInvitationsAPI, getInvitationAPI, deleteUserAPI, validateGetSessionAPI, loginToAccount } from "./functions/accounts.mjs";
import { validateAPIResponseis200, closeModal, openAndPinSideMenu } from "./functions/general.mjs";
import { addParameterToSpceAPI, addParameterToAccountAPI, createSpaceParameters, createAccountParameters, deleteAccountParameterAPI, deleteSpaceParameterAPI } from "./functions/parameters.mjs";
import { createSpaceAPI } from "./functions/spaces.mjs";

const baseURL = process.env.baseURL;
const password = process.env.allAccountsPassword;
const account = process.env.account;
const user = process.env.adminEMail
const space = process.env.space
const parameterList = [{ description: "aaa30", name: "bbb100", sensitive: true, value: "ccc30" }, { description: "aaa40", name: "bbb200", sensitive: false, value: "ccc40" }, { description: "aaa30", name: "bbb300", sensitive: false, value: "ccc30" }, { description: "aaa45", name: "bbb400", sensitive: false, value: "ccc40" }]
let session = "empty session";
let page;
let values;

/** Test prerequisites
 * Have account with credentials as saved in .env file
 * Space saved in .env file should exist in the account
 */

test.describe('Add and delete user', () => {

    test.beforeAll(async ({ browser }) => {
        // get admin session
        session = await getSessionAPI(user, password, baseURL, account);
        await validateGetSessionAPI(session);
        page = await browser.newPage();
        await loginToAccount(page, user, account, password, baseURL);
        await closeModal(page);
        await openAndPinSideMenu(page);

    });


    test('add parameters to space API', async () => {

        console.log(session);
        await addParameterToSpceAPI(session, baseURL, space, parameterList)
        for (let i = 0; i < parameterList.length; i++) {
            let paramData = parameterList[i];
            console.log("my test paramData", paramData)
            values = Object.values(paramData);
            console.log("my values for delete are", values[1])
            const response = await deleteSpaceParameterAPI(baseURL, space, values[1], session)
            expect(response.status).toBe(200)

        }

    });

    test('add parameters to account API', async () => {

        console.log(session);
        await addParameterToAccountAPI(session, baseURL, parameterList)
        for (let i = 0; i < parameterList.length; i++) {
            let paramData = parameterList[i];
            console.log("my test paramData", paramData)
            values = Object.values(paramData);
            console.log("my values for delete are", values[1])
            const response = await deleteAccountParameterAPI(baseURL, values[1], session)
            expect(response.status).toBe(200)

        }
    });

    test.skip('create parameters on space UI', async () => {
        await createSpaceParameters(page, parameterList, space)
    })

    test('create parameters on account UI', async () => {
        await createAccountParameters(page, parameterList)
        console.log(parameterList.name)
        for (let i = 0; i < parameterList.length; i++) {
            let paramData = parameterList[i];
            console.log("my test paramData", paramData)
            values = Object.values(paramData);
            console.log("my values for delete are", values[1])
            const response = await deleteAccountParameterAPI(baseURL, values[1], session)
            expect(response.status).toBe(200)

        }
    })

});






