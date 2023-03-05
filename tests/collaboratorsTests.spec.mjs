import { test, expect } from "@playwright/test";
import { loginToAccount, getSessionAPI, validateGetSessionAPI, logOut } from "./functions/accounts.mjs";
import { launchBlueprintFromCatalogPage } from "./functions/blueprints.mjs";
import { closeModal, selectFromDropbox, validateAPIResponseis200 } from "./functions/general.mjs";
import { addCollaboratorToSandbox, changeSBCollaboratorAPI, endSandbox, endSandboxAPI, findSandboxIdByNameAPI, getFirstSandboxesAPI, goToSandbox, stopAndValidateAllSBsCompletedAPI, validateSBisActive } from "./functions/sandboxes.mjs";
import { goToSpace } from "./functions/spaces.mjs";



const baseURL = process.env.baseURL;
const password = process.env.allAccountsPassword;
const account = process.env.account;
const user = process.env.adminEMail
const space = "Collaborator";
const collaboratorName = 'amir.o@quali.com';
const count = 1
const bpName = 'simpleTF';
const executionHostName = 'qa-eks3';
let inputs = {'inputs\.agent': executionHostName};
let page;
let session;
let sandboxName;

test.describe('sendbox launch with collab', () => {
   
    test.beforeAll(async ({ browser }) => {
        session = await getSessionAPI(user, password, baseURL, account);
        await validateGetSessionAPI(session);
        page = await browser.newPage();
        await loginToAccount(page, user, account, password, baseURL);
        await closeModal(page);
    });

    // test.afterAll(async () => {
    //     session = await getSessionAPI(user, password, baseURL, account);
    //     await stopAndValidateAllSBsCompletedAPI(session, baseURL, space);
    // })

    test("launch blueprint with collaborator and validate collaborator name in Sendbox details", async () => {
        await goToSpace(page, space)
        const blueprint = await page.locator(`[data-test="catalog-bp-autogen_${bpName}"]`)
        await blueprint.locator('[data-test="launch-environment-from-blueprint"]').click()
        const collaborator = await page.locator('.hFDyZZ')
        await(collaborator.locator('.btn-content')).click()
        await page.locator('.select-set_collab__control').click()
        await page.keyboard.press("Enter");
        await expect (page.locator('[data-test="selected-collaborators-container"]')).toContainText(collaboratorName)
        await page.locator('[data-test="go-to-next-step"]').click()
        // await page.locator('[data-test="inputs.ami"]').type('ami-0cd01c7fb16a9b497')
        selectFromDropbox(page, 'inputs.agent', executionHostName )
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
            console.log(e)
            test.fail()
        }
        await expect(page.locator('[data-test="sandbox-row-0"]')).toContainText('Terminating', { timeout: 10000 });
      
    });

    test("Adding & removing collaborator to existing environment", async()=>{
        await goToSpace(page, space);
        sandboxName = await launchBlueprintFromCatalogPage(page, bpName, inputs);
        await page.waitForSelector('[data-test="sandbox-info-column"] div:has-text("StatusActive")', { timeout: 5 * 60 * 1000 });
        expect(await page.isVisible('[data-test="sandbox-info-column"] div:has-text("StatusActive")', 500)).toBeTruthy();
        const sandboxId = await findSandboxIdByNameAPI(session, baseURL, space, sandboxName);
        console.log(sandboxId);
        await addCollaboratorToSandbox(page, 'asaf.y@quali.com');
        console.log('Added collaborator to sandbox');
        await logOut(page, 'Q');
        await loginToAccount(page, 'asaf.y@quali.com', account, 'Qual!123', baseURL);
        //Change filter to show only collaborated sandboxes
        await page.click('[data-test=sandboxes-nav-link]');
        await selectFromDropbox(page, 'filters__control', "Collaborator");
        await expect(page.locator(`tr:has-text("${sandboxName}")`)).toBeVisible();
        console.log("Sandbox is listed in `I'm a Collaborator` filter");
        //Collaborator can enter sandbox
        await page.click(`tr:has-text("${sandboxName}")`);
        await page.waitForLoadState();
        await page.locator('[data-test="sandboxes-nav-link"]').click()
        //Remove collaborator and check filter is updated
        session = await getSessionAPI(user, password, baseURL, account);
        let response = await changeSBCollaboratorAPI(session, baseURL, sandboxId, []);
        await validateAPIResponseis200(response);
        console.log('Removed collaborator from sandbox');
        await page.reload();
        expect(await page.getByRole('cell', { name: sandboxName }), 'User can still view sandbox after being removed from collaborators').toBeHidden();
        console.log('User can no longer view sandbox under Collaborator filter');
        await endSandboxAPI(session, baseURL, space, sandboxId);
    })
});