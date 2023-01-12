import { test, expect } from "@playwright/test";
import { loginToAccount, getSessionAPI, validateGetSessionAPI } from "./functions/accounts.mjs";
import { closeModal } from "./functions/general.mjs";
import { getAllSandboxesAPI, getFirstSandboxesAPI, getSandboxDetailsAPI } from "./functions/sandboxes.mjs";



const baseURL = process.env.baseURL;
const password = process.env.allAccountsPassword;
const account = process.env.account;
const user = process.env.adminEMail
const space = "Amir";
const collaboratorName = 'johnathan.v@quali.com';
const count = 1
let session;

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
        // await openAndPinSideMenu(page);
    });




    test("launch blueprint with collaborator", async () => {
    //     await page.locator('[data-test="administration-console"]').click()
    //     await page.locator('[data-test="space-tab"]').click()
    //    const spaceArea =  await page.locator('[data-test="space-row-Amir"]')
    //     await (spaceArea.locator('.btn-content')).click()
    //     await page.locator('[data-test="catalog-nav-link"]').click()
    //     await page.locator('[data-test="launch-environment-from-blueprint"]').click()
    //     const collaborator = await page.locator('.hFDyZZ')
    //     await(collaborator.locator('.btn-content')).click()
    //     await page.locator('.select-set_collab__control').click()
    //     await page.locator('.select-set_collab__control').type(collaboratorName)
    //     await page.keyboard.press("Enter");
    //     await page.locator('[data-test="go-to-next-step"]').click()
    //     await page.locator('[data-test="inputs.ami"]').type('ami-0cd01c7fb16a9b497')
    //     // await page.keyboard.press("Enter");
    //     await page.locator('.sc-cOifOu >> nth=0').click()
    //     await page.keyboard.press("Enter");
    //     await page.locator('[ data-test="launch-environment"]').click()
    //     await page.locator('[data-test="sandboxes-nav-link"]').click()
    //     await expect(page.locator('[data-test="sandbox-row-0"]')).toContainText('Launching', { timeout: 2000 });
    //     await expect(page.locator('[data-test="sandbox-row-0"]')).toContainText('Active', { timeout: 5 * 60 * 1000 });
        const response = await getFirstSandboxesAPI(session, baseURL, space, count)
        const responseJson = await response.json()
        console.log(responseJson)
        //  expect(responseJson).toContain(collaboratorName)
        const firstSB = await responseJson[0]
     
        const collabInfo = await firstSB.collaborators_info.collaborators
        console.log(collabInfo)
        const values = Object.values(collabInfo);
        console.log("the value is " + values[1])

         expect(await collabInfo).toHaveText(collaboratorName)
        const ID = await firstSB.id
        console.log("the id is " + ID)
        // const details = await getSandboxDetailsAPI(session, baseURL, space, ID)
        // const jsonDetails = await details.text()
        // console.log(await jsonDetails)

        // for (let i = 0; i < responseJson.length; i++) {
        //   const element = responseJson[i];
        //   console.log(element)
        //   var envID = await element.id
        //   console.log("the env id is " + envID)
        // }
    });

});