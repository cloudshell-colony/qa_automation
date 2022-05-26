const loginUser = require("./functions/login");
const { test, expect } = require('@playwright/test');
const {initTest, cleanUpTest, randomString} = require("./functions/general");
const goToAdministration = require("./functions/goToAdministration");
const goToSpace = require("./functions/Spaces/goToSpace");
const createNewSpace = require("./functions/Spaces/createNewSpace");
const deleteSpace = require("./functions/Spaces/deleteSpace");
const editSpace = require("./functions/Spaces/editSpace");


test.describe("can create new space, validate creation and delete it", () => {
    test.beforeAll(initTest("firefox"));
    test.afterAll(cleanUpTest);
    const spaceName = randomString(10);
    const newName = randomString(10);
    console.log(`Space names are ${spaceName} && ${newName}`);
    test("can login successfully", async () => {
        await loginUser(page, "asaf.y@quali.com", "Asaf1234");
    });

    test("can create and go to space", async () => {
        await goToAdministration(page);
        await createNewSpace(page, spaceName);
        await goToSpace(page, spaceName);
    });

    test("creating space that exists throws error", async () => {
        await goToAdministration(page);
        await createNewSpace(page, spaceName, exists=true);
    })

    test("can't create space with empty name", async () =>{
        await goToAdministration(page);
        await createNewSpace(page, "");
    })

    test("can edit space name", async () => {
        await goToAdministration(page);
        await editSpace(page, spaceName, newName);
        await goToSpace(page, newName);
    });

    test("can't delete space when name isn't entered", async() => {
        await goToAdministration(page);
        await deleteSpace(page, newName, fail=true);
    })

    test("can delete space", async () =>{
        await goToAdministration(page);
        await deleteSpace(page, newName);
    });
});