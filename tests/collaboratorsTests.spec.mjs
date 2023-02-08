import { test, expect } from "@playwright/test";
import { loginToAccount, getSessionAPI, validateGetSessionAPI } from "./functions/accounts.mjs";
import { closeModal } from "./functions/general.mjs";
import { endSandboxAPI, getFirstSandboxesAPI } from "./functions/sandboxes.mjs";
import { goToSpace } from "./functions/spaces.mjs";



const baseURL = process.env.baseURL;
const password = process.env.allAccountsPassword;
const account = process.env.account;
const user = process.env.adminEMail
const space = "AmirO";
const collaboratorName = 'amiromazgin@gmail.com';
const count = 1
let page;
let session;


test.describe('sendbox launch with collab', () => {
   
    test.beforeAll(async ({ browser }) => {
        session = await getSessionAPI(user, password, baseURL, account);
        await validateGetSessionAPI(session);
        page = await browser.newPage();
        await loginToAccount(page, user, account, password, baseURL);
        await closeModal(page);

    });

    test("launch blueprint with collaborator and validate collaborator name in Sendbox details", async () => {
        await goToSpace(page, space)
        // await page.locator('[data-test="launch-environment-from-blueprint"]').click()
        const blueprint = await page.locator('[data-test="catalog-bp-autogen_create-ec2-instance"]')
        await blueprint.locator('[data-test="launch-environment-from-blueprint"]').click()
        const collaborator = await page.locator('.hFDyZZ')
        await(collaborator.locator('.btn-content')).click()
        await page.locator('.select-set_collab__control').click()
        await page.keyboard.press("Enter");
        await expect (page.locator('.sc-cApVyb')).toContainText(collaboratorName)
        await page.locator('[data-test="go-to-next-step"]').click()
        await page.locator('[data-test="inputs.ami"]').type('ami-0cd01c7fb16a9b497')
        await page.locator('.dcGtvK >> nth=0').click()
        await page.getByText('qa-eks3').click()
        // await page.keyboard.press("Enter");
        await page.locator('[ data-test="launch-environment"]').click()
        await page.locator('[data-test="sandboxes-nav-link"]').click()
        await expect(page.locator('[data-test="sandbox-row-0"]')).toContainText('Launching', { timeout: 4000 });
        await expect(page.locator('[data-test="sandbox-row-0"]')).toContainText('Active', { timeout: 5 * 60 * 1000 });
        const response = await getFirstSandboxesAPI(session, baseURL, space, count)
        const responseJson = await response.json()
        console.log(responseJson)
        const firstSB = await responseJson[0]
        const collabInfo = await firstSB.collaborators_info.collaborators
        console.log(collabInfo[0].email)
         const ID = await firstSB.id
        console.log("the id is " + ID)
        try {
            expect(await collabInfo[0].email).toContain(collaboratorName)
            await endSandboxAPI(session, baseURL, space, ID)
        } catch (e) {
            await endSandboxAPI(session, baseURL, space, ID)
            await expect(page.locator('[data-test="sandbox-row-0"]')).toContainText('Terminating', { timeout: 10000 });
            // await expect(page.locator('[data-test="sandbox-row-0"]')).toBeHidden({timeout: 5 * 60 * 1000})
            console.log(e)
            test.fail()
        }
        await expect(page.locator('[data-test="sandbox-row-0"]')).toContainText('Terminating', { timeout: 10000 });
        // await expect(page.locator('[data-test="sandbox-row-0"]')).toBeHidden({timeout: 10 * 60 * 1000})
    });

});