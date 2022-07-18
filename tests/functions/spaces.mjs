import { expect } from "@playwright/test";
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
    await page.locator('text=Apply').nth(0).click();
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


export const deleteSpaceAPI = async (space_name, myURL, session) => {

    const response = fetch(`${myURL}/api/spaces/${space_name}`, {
        "method": "DELETE",
        "headers": {
            'Authorization': `Bearer ${session}`,
            'Content-Type': 'application/json; charset=utf-8',
            'Accept': 'application/json'
        }
    });
    return response;
};


export const goToSpace = async (page, spaceName) => {
    await page.click("[data-test=sidebar-dropdown]");
    expect(await page.locator(`[data-test=option__${spaceName}]`), 'The requested space was not found in the account').toHaveText(spaceName);
    page.click(`[data-test=option__${spaceName}]`);
    await page.waitForNavigation();
    await page.waitForSelector(`[data-test=page-title-prefix]:has-Text("${spaceName}")`);
    await page.waitForSelector(`[data-test=currently-selected-space]:has-Text("${spaceName}")`);
};

export const craeteSpaceFromQuickLauncher = async (page, newSpaceName) => {
    await page.click('text=Start by creating your own Space');
    await page.fill('[data-test="create-new-space-popup"]', newSpaceName);
    await page.click('[data-test="color-frogGreen"]');
    await page.click('[data-test="icon-face"]');
    await page.click('[data-test="create-space"]');
};
export const generateRepoSpecificKeys = async (repProvider) => {
    const githubRepo = process.env.githubRepo;
    const githubUserNAme = process.env.githubUserNAme;
    const githubPassword = process.env.githubPassword;
    const githubBPsInRepo = process.env.githubRepoNumOfBlueprints;
    const githubBPFullName = process.env.githubAssetBPFullName;

    const gitlabRepo = process.env.gitlabRepo;
    const gitlabUserNAme = process.env.gitlabUserNAme;
    const gitlabPassword = process.env.gitlabPassword;
    const gitlabBPsInRepo = process.env.gitlabRepoNumOfBlueprints;

    const bitbucketRepo = process.env.bitbucketRepo;
    const bitbucketUserNAme = process.env.bitbucketUserNAme;
    const bitbucketPassword = process.env.bitbucketPassword;
    const bitbucketBPsInRepo = process.env.bitbucketRepoNumOfBlueprints;

    let providerKeys = {};
    switch (repProvider.toLowerCase()) {
        case "bitbucket":
            providerKeys = {
                "provider": repProvider,
                "nth": 1,
                "repo": bitbucketRepo,
                "userName": bitbucketUserNAme,
                "password": bitbucketPassword,
                "BPscount": bitbucketBPsInRepo
            }
            break;
        case "github":
            providerKeys = {
                "provider": repProvider,
                "nth": 2,
                "repo": githubRepo,
                "userName": githubUserNAme,
                "password": githubPassword,
                "BPscount": githubBPsInRepo,
                "BPName": githubBPFullName
            }
            break;
        case "gitlab":
            providerKeys = {
                "provider": repProvider,
                "nth": 3,
                "repo": gitlabRepo,
                "userName": gitlabUserNAme,
                "password": gitlabPassword,
                "BPscount": gitlabBPsInRepo
            }
            break;
        default:
            console.log("invalid repo provider");
            break;
    }
    return providerKeys;
};

export const fillInRepoData = async (providerKeys, signinWindow) => {
    // this function was needed to bypass JS synchronos call, that resulted in attempting to use veraiable signinWindow before its load is completrd
    // inserts the selected repo data based on the selected host- gitlab, github and bitbucket
    const repoUsername = providerKeys.userName;
    const repoPassword = providerKeys.password;
    const provider = providerKeys.provider;

    switch (provider.toLowerCase()) {
        case "bitbucket":
            console.log('missing BitBucket repo');
            break;
        case "github":
            await signinWindow.waitForLoadState();
            await signinWindow.fill('input[name="login"]', repoUsername);
            await signinWindow.fill('input[name="password"]', repoPassword);
            await signinWindow.click('input:has-text("Sign in")');
            await signinWindow.waitForTimeout(1000);
            const isPage = await signinWindow.isClosed();
            console.log(`apperntly the check if the ${provider} login page is closed ended with: ${isPage}`);
            if (!isPage) {
                const visi = await signinWindow.isVisible('text=Authorize QualiNext', 500);
                if (visi) {
                    await signinWindow.click('text=Authorize QualiNext');
                };
            };
            break;
        case "gitlab":
            await signinWindow.waitForLoadState();
            await signinWindow.fill('[data-testid="username-field"]', repoUsername);
            await signinWindow.fill('input[name="user\[password\]"]', repoPassword);
            await signinWindow.click('[data-testid="sign-in-button"]');
            break;

        default:
            console.log('invalid repo provederlid ');
            break;
    };
};

export const repositoryAssetInfo = async (page, repoKeys) => {
    // fill in all repository asset info
    // expect to get repoKeys librery generated from generateRepoSpecificKeys(repProvider)
    await page.waitForSelector('[data-test="connect-repo-title"]');
    await page.click(`[data-test="setup-modal-container"] svg >> nth=${repoKeys.nth}`);
    await page.fill('[data-test="repositoryUrl"]', repoKeys.repo);
    await page.fill('[data-test="repositoryName"]', "auto-repo");
    //manage repo provider credentilas
    const [signinWindow] = await Promise.all([
        page.waitForEvent("popup"),
        page.click('button:has-text("Connect")')
    ]);
    await signinWindow.waitForLoadState();
    // sync issue - created a function so I can add "await"
    await fillInRepoData(repoKeys, signinWindow);

};