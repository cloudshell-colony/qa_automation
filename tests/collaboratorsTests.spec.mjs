import { test, expect } from "@playwright/test";
import { loginToAccount, getSessionAPI, validateGetSessionAPI } from "./functions/accounts.mjs";
import { closeModal } from "./functions/general.mjs";
import { endSandboxAPI, getFirstSandboxesAPI, launchSendboxWithCollaborator } from "./functions/sandboxes.mjs";



const baseURL = process.env.baseURL;
const password = process.env.allAccountsPassword;
const account = process.env.account;
const user = process.env.adminEMail
const space = "Amir";
const collaboratorName = 'johnathan.v@quali.com';
const count = 1
let session;

test.describe('Blueprint validation', () => {
    let page;
    test.beforeAll(async ({ browser }) => {
        session = await getSessionAPI(user, password, baseURL, account);
        await validateGetSessionAPI(session);
        page = await browser.newPage();
        await loginToAccount(page, user, account, password, baseURL);
        await closeModal(page);

    });

    test("launch blueprint with collaborator and validate collaborator name in Sendbox details", async () => {
        await launchSendboxWithCollaborator(page, collaboratorName, space)
        const response = await getFirstSandboxesAPI(session, baseURL, space, count)
        const responseJson = await response.json()
        console.log(responseJson)
        const firstSB = await responseJson[0]
        const collabInfo = await firstSB.collaborators_info.collaborators
        console.log(collabInfo[0].email)
        expect(await collabInfo[0].email).toContain(collaboratorName)
        const ID = await firstSB.id
        console.log("the id is " + ID)
        await endSandboxAPI(session, baseURL, space, ID)
        await expect(page.locator('[data-test="sandbox-row-0"]')).toContainText('Terminating', { timeout: 10000 });
    });

});