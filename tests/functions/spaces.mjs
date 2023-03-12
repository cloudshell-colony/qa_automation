import { expect } from "@playwright/test";
import fetch from "node-fetch";
import { getCodesListFromMailinator, handlePopUpWithCondition } from "./general.mjs";
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
    console.log(`creeating space with name: ${spaceName}`);
    if (!page.url().endsWith("admin/spaces")) {
        await goToAdminConsole(page, "spaces");
    }
    await page.click(`[data-test=create-new-space]`);
    await page.locator(`[data-test=create-new-space-popup]`).fill(spaceName);
    await page.click("[data-test=create-space]");
};

export const createSpaceAPI = async (baseURL, session, spaceName) => {
    const data = {
        "name": spaceName,
        "color": "frogGreen",
        "icon": "face"
    }
    const response = await fetch(`${baseURL}/api/spaces`, {
        "method": "POST",
        "body": JSON.stringify(data),
        "headers": {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${session}`
        }
    });
    return response;
};

export const editSpace = async (page, spaceName, newName) => {
    if (!page.url().endsWith("admin/spaces")) {
        await goToAdminConsole(page, "spaces");
    }
    await page.waitForSelector('[role=rowgroup]');
    await page.locator(`[data-test=space-row-${spaceName}]`).locator("[data-testid=moreMenu]").click();
    await page.locator(`[data-test=space-row-${spaceName}]`).locator('text=Edit').click();
    await page.fill("[data-test=spaceName]", newName);
    await page.locator('button:has-Text("Apply")').nth(1).click();
}

export const deleteSpace = async (page, spaceName, input) => {
    if (input === undefined) {
        input = spaceName;
    }
    if (!page.url().endsWith("admin/spaces")) {
        await goToAdminConsole(page, "spaces");
    }
    console.log(`Attempting to delete space "${spaceName}", approving the delete by entering "${input}" as the space name`);
    await page.locator(`[data-test=space-row-${spaceName}]`).locator("[data-testid=moreMenu]").click();
    await page.locator(`[data-test=space-row-${spaceName}]`).locator('text=Delete').click();
    await page.fill(`[data-test=spaceName]`, input);
    await page.locator('text=Yes').click();
};


export const deleteSpaceAPI = async (myURL, session, space_name) => {

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
    console.log("Creating new space from the quick launcher\nThe new space name is " + newSpaceName);
    await page.click('text=Start by creating your own Space');
    await enterNewSpaceDetails(page, newSpaceName);
};

export const enterNewSpaceDetails = async (page, newSpaceName) => {
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
            console.log('missing BitBucket implementation');
            break;
        case "github":
            await signinWindow.waitForLoadState();
            await signinWindow.fill('input[name="login"]', repoUsername);
            await signinWindow.fill('input[name="password"]', repoPassword);
            await signinWindow.click('input:has-text("Sign in")');
            await signinWindow.waitForTimeout(2000);
            let isPage = await signinWindow.isClosed();
            if (isPage) break;
            else {
                // if github wishes for mail authentication...
                let authrnticateWithMail = await signinWindow.isVisible('text=Device verification', 500);
                if (authrnticateWithMail) {
                    await signinWindow.waitForTimeout(2 * 1000);
                    const codeList = await getCodesListFromMailinator();
                    for (let index = 0; index < codeList.length; index++) {
                        console.log("We got into mail verification");
                        console.log(`Attempting verification cod: ${codeList[index]}`);
                        await signinWindow.locator('[placeholder="XXXXXX"]').fill(await codeList[index]);
                        await signinWindow.waitForTimeout(1000);
                        let isPage = await signinWindow.isClosed();
                        if (isPage) { break; }
                        else { console.log(await signinWindow.content()); };
                    };
                }
                isPage = await signinWindow.isClosed();
                if (isPage) break;
                const AuthorizeQN = await signinWindow.isVisible('text=Authorize QualiNext', 500);
                if (AuthorizeQN) {
                    await signinWindow.click('text=Authorize QualiNext');
                }
                isPage = await signinWindow.isClosed();
                console.log(`Apperntly the check if the ${provider} login page is closed ended with: ${isPage}`);
                if (!isPage) {
                    console.log('Waiting fore aditional 3 seconds since the page is still open');
                    await signinWindow.waitForTimeout(3 * 1000);
                    isPage = await signinWindow.isClosed();
                    console.log('after 3 seconds the page isClosed validation ended with: ' + await isPage);
                    if (isPage) {
                        console.log(await signinWindow.content());
                        break;
                    } else {
                        console.log('we have a problem, the popup is still open and we dont know why');
                        console.log(await signinWindow.content());
                        break;
                    };
                };
                break;
            }
        case "gitlab":
            console.log('Missing Gitlab implementation');
            // await signinWindow.waitForLoadState();
            // await signinWindow.fill('[data-testid="username-field"]', repoUsername);
            // await signinWindow.fill('input[name="user\[password\]"]', repoPassword);
            // await signinWindow.click('[data-testid="sign-in-button"]');
            break;
        default:
            console.log('invalid repo provederlid ');
            break;
    };
};

export const repositoryAssetInfo = async (page, repoKeys) => {
    // fill in all repository asset info
    // expect to get repoKeys librery generated from generateRepoSpecificKeys(repProvider)
    console.log(`connecting to ${repoKeys.repo}`);
    await page.waitForSelector('[data-test="connect-repo-title"]');
    await page.click(`[data-test="setup-modal-container"] svg >> nth=${repoKeys.nth}`);
    await page.fill('[data-test="repositoryUrl"]', repoKeys.repo);
    await page.click('[data-test="repositoryName"]', { force: true });
    //manage repo provider credentilas
    const [signinWindow] = await Promise.all([
        page.waitForEvent("popup"),
        page.click('button:has-text("Connect")')
    ]);
    await signinWindow.waitForLoadState();
    // sync issue - created a function so I can add "await"
    await fillInRepoData(repoKeys, signinWindow);

};

export const addRepositoryAsset = async (page, repoKeys, override=false) => {
    await repositoryAssetInfo(page, repoKeys)
    // back to torque - start BP auto discavery
    await page.waitForLoadState();
    await page.click('[data-test="submit-button"]');
    //  select ALL BPs for import after auto discavery
    expect(await page.isVisible('[data-test="submit-button"]')).toBeTruthy();
    expect(await page.isEnabled('[data-test="submit-button"]')).not.toBeTruthy();
    await page.check('th input[type="checkbox"]');
    expect(await page.isEnabled('[data-test="submit-button"]')).toBeTruthy();
    await page.click('[data-test="submit-button"]');
    // Handle possibility of pop-up to override existing blueprints according to override boolean parameter
    await handlePopUpWithCondition(page, override, 'confirm-button');
    // Auto-Generated Blueprints page approval
    await page.isVisible('text=Auto-Generated Blueprints');
    // validate that after auto discovery the number of BPs is as expected 
    // reference number is set in .env file

    // skip till we complete repository population
    // let numberOfBlueprints = await page.locator('[data-test="setup-modal-container"] tr');
    // expect(await numberOfBlueprints.count()).toEqual(parseInt(repoKeys.BPscount) + 1);

    // complete the flow of adding asset repo and open the next step of adding execution host
    // await page.click('[data-test="submit-button"]');
    await page.waitForSelector('text=Auto-Generated Blueprints');
    await page.click('[data-test="submit-button"]');

};

export const addRepositoryAPI = async (session, baseURL, space, repoUrl, token, repoName, branch = 'main', repoType = 'github') => {
    const data = {
        "repository_url": repoUrl,
        "access_token": token,
        "repository_type": repoType,
        // "type": "asset",
        "branch": branch,
        "repository_name": repoName
    }

    const resp = await fetch(`${baseURL}/api/spaces/${space}/repositories`, {
        "method": "POST",
        "headers": {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session}`
        },
        "body": JSON.stringify(data)
    });
    expect((resp.status), await resp.text()).toBe(200);
};
