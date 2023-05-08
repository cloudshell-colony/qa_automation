import { expect } from "@playwright/test";
import goToAdminConsole from "./goToAdminConsole.mjs";
import fetch from "node-fetch";
import { selectFromDropbox } from "./general.mjs";

export const addPolicy = async (page, policyType, extra = '', space = '') => {
    await goToAdminConsole(page, 'policies');
    await page.click('[data-test=apply-new-policy]');
    await page.click('.select-policy-repos-dropdown__option')
    const search = await page.locator('input[name="search"] >> nth=1')
    await search.fill(policyType)
    await page.locator('[data-test="policy-toggle"]').click()
    await page.locator('[data-test="submit-button"]').click()
    await page.locator('[data-test="policies-row-2"]').click()
    await page.waitForTimeout(1500);
    await page.locator('[data-test="allSpaces"]').click()
    await selectFromDropbox(page, 'spaces', space);
    await page.getByRole('button', { name: 'save' }).click()
  
};

// export const editPolicy = async (page, policyType, policyName, scope, extra = '', space = '') => {
//     await page.locator('[data-test="policies-row-0"]').click()
//     await page.locator('[data-test="allSpaces"]').click()
//     await selectFromDropbox(page, 'spaces', space);
//     await page.getByRole('button', { name: 'save' }).click()
//     await page.locator('[data-test="policy-enable-toggle"]').click()
// };

export const editRego = async (page, DATA) => {
    await page.locator('[data-test="policies-row-2"]').click()
    const area = page.locator('.monaco-editor').nth(0)
    await area.click()
     await page.keyboard.press('Control+A')
     await page.keyboard.press('Delete')
     await page.keyboard.type(JSON.stringify(DATA));
     await page.getByRole('button', { name: 'save' }).click()
    
};

export const addApprovalChannel = async (page, approval) => {
    await page.locator('[data-test="policies-row-2"]').click()
    await selectFromDropbox(page, 'approval-channels', approval);
     await page.getByRole('button', { name: 'save' }).click()
    
};


export const deletePolicy = async (page) => {
    await goToAdminConsole(page, 'policies');
    const policyRow = await page.locator('[data-test="policies-row-2"]')
    policyRow.hover('[data-test=confirm-button]')
    policyRow.locator('[data-test="delete-policy"]').click()
    await page.click('[data-test=confirm-button]');
}

/**
 * @param {*} policyTemplate type of policy to be added. Valid options are:
 * AWS Only Private S3 Buckets, AWS Allowed Regions, Allowed Providers, Azure Allowed Locations,
 * Azure Allowed Resource Types, Azure Only Private Blob Storage, Azure Prohibited VM Sizes,
 * AWS Allowed Resource Type, AWS Prohibited Instance Types 
 * @param {*} spaces list of spaces the policy applies to. Leave empty for account level policy 
 * @param {*} variables list of items relevant to policy, e.g. regions or instance types
 */
export const addPolicyAPI = async (session, baseURL, policyTemplate, policyName, spaces = [], variables = []) => {
    const data = {
        "policy_name": policyName,
        "policy_template_name": policyTemplate,
        "spaces": spaces,
        "variables": variables
    }
    const response = await fetch(`${baseURL}/api/policies`, {
        "method": "POST",
        "body": JSON.stringify(data),
        "headers": {
            'Authorization': `Bearer ${session}`,
            'Content-Type': 'application/json',
            'Accept': '*/*'
        }
    });
    return response;
}

export const deletePolicyAPI = async (session, baseURL, policyName) => {

    const response = await fetch(`${baseURL}/api/policies/${policyName}`, {
        "method": "DELETE",
        "headers": {
            'Authorization': `Bearer ${session}`,
            'Content-Type': 'application/json',
            'Accept': '*/*'
        }
    });
    return response;
}

export const addApprovalChannelAPI = async(session, baseURL, channelName, type, approversEmailList) =>{
    const approversList = [];
    for (const email of approversEmailList) {
        let approverData = {user_email: email};
        approversList.push(approverData);
    }
    const data = {
        'name': channelName,
        'details': {'type': type, 'approvers': approversList}
    }
    const response = await fetch(`${baseURL}/api/approval/channels`,{
        "method": "POST",
        "body": JSON.stringify(data),
        "headers": {
            'Authorization': `Bearer ${session}`,
            'Content-Type': 'application/json',
            'Accept': '*/*'
        }
    });
    return response;
}


export const getApprovalChannelsAPI = async(session, baseURL) =>{
    const response = await fetch(`${baseURL}/api/approval/channels`,{
        "method": "GET",
        "headers": {
            'Authorization': `Bearer ${session}`,
            'Content-Type': 'application/json',
            'Accept': '*/*'
        }
    });
    return response;
}

export const checkIfApprovalChannelExistsAPI = async(session, baseURL, channelName) =>{
    let response = await getApprovalChannelsAPI(session, baseURL)
    if(response.status != 200){
        throw Error(`Could not get list of approval channels. Full response: \n` + await response.text());
    }
    let channelsJson = await response.json();
    for(const channel of channelsJson){
        if(channel.name === channelName){
            return true;
        }
    }
    return false;
}