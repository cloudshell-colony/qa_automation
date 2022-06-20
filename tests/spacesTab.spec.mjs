import { loginToAccount } from './functions/accounts.mjs';
import { test, expect } from '@playwright/test';
import { createSpace, editSpace, deleteSpace, goToSpace } from './functions/spaces.mjs';
import { waitForElementToDisappear } from './functions/general.mjs';
import goToAdminSpaces from './functions/goToAdminSpaces.mjs';

const user = "asaf.y@quali.com";
const password = "Qual!123";
const account = 'qa';
const baseURL = "https://preview.qtorque.io";
const spaceName = "qa-" + Math.floor(Date.now() / 1000);
const newName = "qa-new-" + Math.floor(Date.now() / 1000);

test.describe("can create new space, validate creation and delete it", () => {
    let page;
    test.beforeAll(async ({ browser }) => {
        console.log(`Space names are ${spaceName} && ${newName}`);
        page = await browser.newPage();
        await loginToAccount(page, user, account, password, baseURL);
        await page.click(`[data-test=close-modal]`);
      });
      test.afterAll(async () => {
        await page.close();
      });

    test("can create and go to space", async () => {
        await createSpace(page, spaceName);
        await page.waitForSelector("[data-test=setup-modal-container]", 3000);
        await page.click("[data-test=close-modal]");
        const currSpace = await page.locator("[data-test=currently-selected-space]").innerText();
        expect(currSpace).toBe(spaceName);
        await goToAdminSpaces(page);
        const spaceElem = await page.locator(`[data-test=space-row-${spaceName}]`);
        await expect(spaceElem).toContainText(spaceName, {useInnerText: true});
    });

    test("creating space that exists throws error", async () => {
        await createSpace(page, spaceName);
        await page.waitForSelector("[data-testid=error-details-text]");
        const error = await page.locator("[data-testid=error-details-text]").innerText();
        expect(error).toBe(`Space name ${spaceName} is already taken. Please try a different one`);
        await page.click('[data-test=close-popup]');
        await page.click('[data-test=close-modal]');
    })

    test("can't create space with empty name", async () =>{
        await createSpace(page, "");
        const msg = await page.locator("[data-test=name-has-error]").innerText();
        expect(msg).toBe("The Space Name field is required.");
        await page.click('[data-test=close-modal]');
    })

    test("can edit space name", async () => {
        await editSpace(page, spaceName, newName);
        const newSpace = await page.locator(`[data-test=space-row-${newName}]`)
        await expect(newSpace).toContainText(newName, {useInnerText: true});
        await goToSpace(page, newName);
        const currSpace = await page.locator("[data-test=currently-selected-space]").innerText();
        expect(currSpace).toBe(newName);
    });

    test("can't delete space when name isn't entered", async() => {
        await deleteSpace(page, newName, "");
        await page.waitForSelector("[data-test=spaceName-has-error]");
        const error = await page.locator("[data-test=spaceName-has-error]").innerText();
        expect(error).toBe(`The name you entered does not match the name of the space.`);
        await page.locator("text=Cancel").click();
        await expect(page.locator(`[data-test=space-row-${newName}]`)).toBeVisible();
    })

    test("can delete space", async () =>{
        await deleteSpace(page, newName);
        await waitForElementToDisappear(page, "spaceName");
        const space = await page.$(`[data-test=space-row-${newName}]`, {timeout: 2000})
        expect(space).toBe(null);
    });
});