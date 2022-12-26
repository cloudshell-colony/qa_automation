import { loginToAccount } from './functions/accounts.mjs';
import { test, expect } from '@playwright/test';
import { createSpace, editSpace, deleteSpace, goToSpace, createSpaceAPI, deleteSpaceAPI } from './functions/spaces.mjs';
import { openAndPinSideMenu, waitForSpaceInListToDisappear } from './functions/general.mjs';
import goToAdminConsole from './functions/goToAdminConsole.mjs';
import { closeModal } from './functions/general.mjs';


const baseURL = process.env.baseURL;
const password = process.env.allAccountsPassword;
const adminEMail = process.env.adminEMail;
const account = process.env.account;

const timestamp = Math.floor(Date.now() / 1000);
const spaceName = "qa-" + timestamp;
const newName = "qa-new-" + timestamp;
const newSpaceName = "api-" + timestamp;
let session;

test.describe.serial("can create new space, validate creation and delete it", () => {
    let page;
    test.beforeAll(async ({ browser }) => {
        session = await getSessionAPI(adminEMail, password, baseURL, account);
        console.log(`Space names are ${spaceName} && ${newName}`);
        page = await browser.newPage();
        await loginToAccount(page, adminEMail, account, password, baseURL);
        await closeModal(page);
        await openAndPinSideMenu(page);
    });
    test.afterAll(async () => {
        await page.close();
    });


    test('Create new space with API', async () => {
        console.log(`Creating new space with the name: "${newSpaceName}"`);
        const response = await createSpaceAPI(baseURL, session, newSpaceName)
        console.log(response)
        expect(response.status).toBe(200)

    });

    test('delete new space with API', async () => {
        console.log(`Deleting new space with the name: "${newSpaceName}"`);
        const response = await deleteSpaceAPI(baseURL, session, newSpaceName)
        console.log(response)
        expect(response.status).toBe(200)

    });


    test("can create and go to space", async () => {
        await createSpace(page, spaceName);
        await page.waitForSelector("[data-test=setup-modal-container]", 3000);
        await page.click("[data-test=close-modal]");
        const currSpace = await page.locator("[data-test=currently-selected-space]").innerText();
        expect(currSpace).toBe(spaceName);
        await goToAdminConsole(page, "spaces");
        const spaceElem = await page.locator(`[data-test=space-row-${spaceName}]`);
        await expect(spaceElem).toContainText(spaceName, { useInnerText: true });
    });

    test("creating space that exists throws error", async () => {
        await createSpace(page, spaceName);
        await page.waitForSelector("[data-testid=error-details-text]");
        const error = await page.locator("[data-testid=error-details-text]").innerText();
        expect(error).toBe(`Space name ${spaceName} is already taken. Please try a different one`);
        await page.click('[data-test=close-popup]');
        await page.click('[data-test=close-modal]');
    })

    test("can't create space with empty name", async () => {
        await createSpace(page, "");
        const msg = await page.locator("[data-test=name-has-error]").innerText();
        expect(msg).toBe("The Space Name field is required.");
        await page.click('[data-test=close-modal]');
    })

    test("can edit space name", async () => {
        await editSpace(page, spaceName, newName);
        const newSpace = await page.locator(`[data-test=space-row-${newName}]`)
        await expect(newSpace).toContainText(newName, { useInnerText: true });
        await goToSpace(page, newName);
        const currSpace = await page.locator("[data-test=currently-selected-space]").innerText();
        expect(currSpace).toBe(newName);
    });

    test("can't delete space when name isn't entered", async () => {
        await deleteSpace(page, newName, "");
        await page.waitForSelector("[data-test=spaceName-has-error]");
        const error = await page.locator("[data-test=spaceName-has-error]").innerText();
        expect(error).toBe(`The name you entered does not match the name of the space.`);
        await page.locator("text=Cancel").click();
        await expect(page.locator(`[data-test=space-row-${newName}]`)).toBeVisible();
    })

    test("can delete space", async () => {
        await deleteSpace(page, newName);
        await waitForSpaceInListToDisappear(page, newName);
        expect(await page.isVisible(`[data-test=space-row-${newName}]`, 50)).not.toBeTruthy();
    });
});