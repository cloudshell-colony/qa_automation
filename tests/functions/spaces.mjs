import fetch from "node-fetch";
import goToAdminConsole from "./goToAdminConsole.mjs";

export default function removeUserFromSpaceAPI(user_email, myURL, session, space_name) {

    const response = fetch(`${myURL}/api/spaces/${space_name}/users/${user_email}`, {
        "method": "DELETE",
        "headers": {
            'Authorization': `Bearer ${session}`,
            'Content-Type': 'application/json'
        }
    });
    return response;
};

export const createSpace = async (page, spaceName) => {
    await goToAdminConsole(page);
    await page.click(`[data-test=create-new-space]`);
    await page.locator(`[data-test=create-new-space-popup]`).fill(spaceName);
    await page.click("[data-test=create-space]");
};

export const editSpace = async (page, spaceName, newName) => {
    await goToAdminConsole(page);
    await page.waitForSelector('[role=rowgroup]');
    await page.locator(`[data-test=space-row-${spaceName}]`).locator("[data-testid=moreMenu]").click();
    await page.locator(`[data-test=space-row-${spaceName}]`).locator('text=Edit').click();
    await page.fill("[data-test=spaceName]", newName);
    await page.locator('text=Apply').click();
}

export const deleteSpace = async (page, spaceName, input) => {
    if (input === undefined) {
        input = spaceName;
    }
    await goToAdminConsole(page);
    await page.locator(`[data-test=space-row-${spaceName}]`).locator("[data-testid=moreMenu]").click();
    await page.locator(`[data-test=space-row-${spaceName}]`).locator('text=Delete').click();
    await page.fill(`[data-test=spaceName]`, input);
    await page.locator('text=Yes').click();
};

export const goToSpace = async (page, spaceName) => {
    await page.click("div[data-test=sidebar-dropdown]");
    await page.click(`[data-test=option__${spaceName}]`);
};

// export default deleteUser;

// const deleteTheblip = await deleteUser("marvel2@dc.com", "http://colony.localhost:80", "dTc48Kt2GyLSzviT7zf3By6kP6eGIWeOOEJ5AaUpHrI", "gmp");
// const deleteTheblipjson = await deleteTheblip.text()
// console.log(`testing my delete ${deleteTheblip.status}, ${await deleteTheblipjson}`);
