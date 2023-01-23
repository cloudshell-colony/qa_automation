import { expect } from "@playwright/test";
import goToAdminConsole from "./goToAdminConsole.mjs";
import fetch from "node-fetch";
import { selectFromDropbox } from "./general.mjs";

export const addPolicy = async(page, policyType, policyName, scope, extra = '', space='') => {
    await goToAdminConsole(page, 'policies');
    await page.click('[data-test=apply-new-policy]');
    await selectFromDropbox(page, 'policy-template', policyType);
    await page.fill('[data-test="policyName"]', policyName);
    await selectFromDropbox(page, 'policy-scope', scope);
    if(scope === 'space'){
        await selectFromDropbox(page, 'add-space', space);
    }
    if (extra != ''){
        await page.locator('input').last().fill(extra)
    }
    await page.click('[data-test=submit]');
};

export const deletePolicy = async(page, policyName) => {
    await goToAdminConsole(page, 'policies');
    await page.locator(`tr:has-text("${policyName}")`).locator('[data-testid=moreMenu]').click()
    await page.click('text=Delete Policy');
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
export const addPolicyAPI = async(session, baseURL, policyTemplate, policyName, spaces = [], variables = []) =>{
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

export const deletePolicyAPI = async(session, baseURL, policyName) => {

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