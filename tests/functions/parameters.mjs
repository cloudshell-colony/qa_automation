import { expect } from "@playwright/test";
import goToAdminConsole from "./goToAdminConsole.mjs";
import { goToSpace } from "./spaces.mjs";
import fetch from "node-fetch";



/**
 * 
 * @param {*} paramDataList An array containing arrays of size 3, for parameter name, value, description
 */
const createParameters = async (page, paramDataList) => {
    let err;
    for (let i = 0; i < paramDataList.length; i++) {
        let paramData = paramDataList[i];
        console.log("my paramData", paramData)
        const values = Object.values(paramData);
        console.log("my values are", values)
        await page.click('button:has-text("Add Parameter")');
        await page.fill('[data-test="name"]', paramData.name);
        if (await page.locator('[data-test="is-sensitive-toggle"]'), paramData.sensitive) {
            await page.locator('[data-test="is-sensitive-toggle"]').click()
        }
        await page.fill('[data-test="value"]', paramData.value);
        await page.fill('[data-test="description"]', paramData.description);
        await page.click('[data-test=submit]');
        try {
            err = await page.locator("[data-testid=error-details-text]", { timeout: 500 }).innerText({ timeout: 100 });
        }
        catch { }
        const visi = await page.isVisible('[data-testid="error-details-text"]', { timeout: 500 });
        expect(visi, `Parameter creation failed, received following error: ` + err).toBeFalsy();
    }
}

/**
 * 
 * @param {*} paramDataList An array containing arrays of size 3, for parameter name, value, description
 */
export const createSpaceParameters = async (page, paramDataList, space) => {
    await goToSpace(page, space);
    await page.click('[data-test=parameters-nav-link]');
    await createParameters(page, paramDataList);
}

/**
 * 
 * @param {*} paramDataList An array containing arrays of size 3, for parameter name, value, description
 */
export const createAccountParameters = async (page, paramDataList) => {
    await goToAdminConsole(page, 'parameters');
    await createParameters(page, paramDataList);
}

export const deleteAccountParameterAPI = async (baseURL, paramName, session) => {
    const data = {};
    const response = await fetch(`${baseURL}/api/settings/parameters/${paramName}`, {
        "method": "DELETE",
        "body": JSON.stringify(data),
        "headers": {
            'Authorization': `Bearer ${session}`,
            'Content-Type': 'application/json',
        }
    });
    return response;
};

export const deleteSpaceParameterAPI = async (baseURL, space, paramName, session) => {
    const data = {};
    const response = await fetch(`${baseURL}/api/spaces/${space}/settings/parameters/${paramName}`, {
        "method": "DELETE",
        "body": JSON.stringify(data),
        "headers": {
            'Authorization': `Bearer ${session}`,
            'Content-Type': 'application/json',
        }
    });
    return response;
};


export const addParameterToSpceAPI = async (session, baseURL, spaceName, paramDataList) => {

    for (let i = 0; i < paramDataList.length; i++) {
        const element = paramDataList[i];
        console.log("adding parameter: ", element)

        const response = await fetch(`${baseURL}/api/spaces/${spaceName}/settings/parameters`, {
            "method": "POST",
            "body": JSON.stringify(element),
            "headers": {
                'Authorization': `Bearer ${session}`,
                'Content-Type': 'application/json',
                'Accept': '*/*'
            }
        });
    }
}

export const addParameterToAccountAPI = async (session, baseURL, paramDataList) => {

    for (let i = 0; i < paramDataList.length; i++) {
        const element = paramDataList[i];
        console.log("adding parameter: ", element)

        const response = await fetch(`${baseURL}/api/settings/parameters`, {
            "method": "POST",
            "body": JSON.stringify(element),
            "headers": {
                'Authorization': `Bearer ${session}`,
                'Content-Type': 'application/json',
                'Accept': '*/*'
            }
        });
    }
}