import loginUser from './functions/login.mjs';
import { test, expect } from '@playwright/test';
import {initTest, cleanUpTest, randomString} from './functions/general.mjs';
import goToSpace from './functions/Spaces/goToSpace.mjs';
import createNewSpace from './functions/Spaces/createNewSpace.mjs';
import deleteSpace from './functions/Spaces/deleteSpace.mjs';
import editSpace from './functions/Spaces/editSpace.mjs';
import goToSpaces from './functions/goToSpaces.mjs';


test.describe("can create new space, validate creation and delete it", () => {
    test.beforeAll(initTest("firefox"));
    test.afterAll(cleanUpTest);
    const spaceName = "qa-" + randomString(6);
    const newName = "qa-" + randomString(6);
    console.log(`Space names are ${spaceName} && ${newName}`);
    test("can login successfully", async () => {
        await loginUser(page, "asaf.y@quali.com", "Qual!123");
    });

    test("can create and go to space", async () => {
        await createNewSpace(page, spaceName);
        const currSpace = await page.locator("[data-test=currently-selected-space]").innerText();
        expect(currSpace).toBe(spaceName);
        await goToSpaces(page);
        await page.waitForSelector(`[data-test=space-row-${spaceName}]`);
    });

    test("creating space that exists throws error", async () => {
        //await goToSpaces(page);
        await createNewSpace(page, spaceName, true);
    })

    test("can't create space with empty name", async () =>{
        //await goToSpaces(page);
        await createNewSpace(page, "");
    })

    test("can edit space name", async () => {
        await goToSpaces(page);
        await editSpace(page, spaceName, newName);
        await goToSpace(page, newName);
        const currSpace = await page.locator("[data-test=currently-selected-space]").innerText();
        expect(currSpace).toBe(newName);
    });

    test("can't delete space when name isn't entered", async() => {
        await goToSpaces(page);
        await deleteSpace(page, newName, true);
    })

    test("can delete space", async () =>{
        await goToSpaces(page);
        await deleteSpace(page, newName);
        const space = await page.$(`[data-test=space-row-${newName}]`, {timeout: 2000})
        expect(space).toBe(null);
    });
});