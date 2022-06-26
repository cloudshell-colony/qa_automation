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

export const craeteSpaqceFromQuickLauncher = async (page, newSpaceName) => {
    await page.click('text=Start by creating your own Space');
    await page.fill('[data-test="create-new-space-popup"]', newSpaceName);
    await page.click('[data-test="color-frogGreen"]');
    await page.click('[data-test="icon-face"]');
    await page.click('[data-test="create-space"]');
};

export const RepositoryAssetInfo = async (page, repProvider, repoUrl, repoUsername, repoPassword) => {
    await page.waitForSelector('[data-test="connect-repo-title"]');
    let nth = 0;
    if (repProvider.toLowerCase() === bitbucket) { nth = 1 }
    else if (repProvider.toLowerCase() === github) { nth = 2 }
    else if (repProvider.toLowerCase() === gitlab) { nth = 3 }
    else { console.log('invalid repo proveder'); };
    await page.click(`[data-test="setup-modal-container"] svg >> nth=${nth}`);
    await page.fill('[data-test="repositoryUrl"]', repoUrl);
    await page.fill('[data-test="repositoryName"]', "auto-repo");
    //manage repo provider credentilas
    const [signinWindow] = await Promise.all([
        page.waitForEvent("popup"),
        page.click('button:has-text("Connect")')
    ])
    await signinWindow.waitForLoadState();
    switch (repProvider.toLowerCase()) {
        case "bitbucket":
            console.log('missing add repo for BitBucket');
            break;
        case "github":
            expect(await signinWindow.url()).toContain('login');
            await signinWindow.fill('input[name="login"]', repoUsername);
            await signinWindow.fill('input[name="password"]', repoPassword);
            await signinWindow.click('input:has-text("Sign in")');
            await signinWindow.waitForLoadState();
            await signinWindow.waitForLoadState();
            const visi = await signinWindow.isVisible('text=Authorize QualiNext', 500);
            if (visi) {
                await signinWindow.click('text=Authorize QualiNext');
            };
            break;
        case "gitlab":
            await page.waitForSelector('[data-test="connect-repo-title"]');
            await page.click('[data-test="setup-modal-container"] svg >> nth=3');
            await page.fill('[data-test="repositoryUrl"]', repoUrl);
            await page.fill('[data-test="repositoryName"]', "blueprints");
            const [signinWindow] = await Promise.all([
                page.waitForEvent("popup"),
                page.click('button:has-text("Connect")')
            ])
            await signinWindow.waitForLoadState();
            expect(await signinWindow.url()).toContain('users/sign_in');
            await signinWindow.fill('[data-testid="username-field"]', repoUsername);
            await signinWindow.fill('input[name="user\[password\]"]', repoPassword);
            await signinWindow.click('[data-testid="sign-in-button"]');
            break;
        default:
            console.log('invainvalid repo provederlid ');
            break;
    }

};


export const newSpaceFromQuickLauncher = async (page, newSpaceName, repProvider, repoUrl, repoUsername, repoPassword) => {

    // start new space flow from quick sandbox launcher
    await craeteSpaqceFromQuickLauncher(page, newSpaceName);

    // add repository asset
    await RepositoryAssetInfo(page, repProvider, repoUrl, repoUsername, repoPassword);
    // back to torque
    // seslect all BPs for import
    await page.waitForLoadState();
    await page.click('[data-test="submit-button"]');
    // start BP selection after auto discavery
    expect(await page.isVisible('[data-test="submit-button"]')).toBeTruthy();
    expect(await page.isEnabled('[data-test="submit-button"]')).not.toBeTruthy();
    await page.check('th input[type="checkbox"]');
    expect(await page.isEnabled('[data-test="submit-button"]')).toBeTruthy();
    await page.click('[data-test="submit-button"]');
    // Auto-Generated Blueprints page approval
    await page.isVisible('text=Auto-Generated Blueprints');
    let numberOfBlueprints = await page.locator('[data-test="setup-modal-container"] td');
    expect(await numberOfBlueprints.count()).toEqual(parseInt(githubRepoNumOfBlueprints) * 2);
    await page.click('[data-test="submit-button"]');
    // skip add execution host for now
    await page.click('[data-test="skip-for-now"]');

};

// export default deleteUser;

// const deleteTheblip = await deleteUser("marvel2@dc.com", "http://colony.localhost:80", "dTc48Kt2GyLSzviT7zf3By6kP6eGIWeOOEJ5AaUpHrI", "gmp");
// const deleteTheblipjson = await deleteTheblip.text()
// console.log(`testing my delete ${deleteTheblip.status}, ${await deleteTheblipjson}`);
