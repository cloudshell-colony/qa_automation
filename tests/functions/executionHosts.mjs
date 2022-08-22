import fetch from "node-fetch";
import { expect } from "@playwright/test";

export const associateExecutionHost = async (page, executionHost, nameSpace, space) => {
    //await page.waitForSelector("[data-test=add-new-execution-host]");
    //const visi = await page.isVisible(`[data-test=execution-hosts-${executionHost}]`);
    try {
        await page.waitForSelector(`[data-test=execution-hosts-${executionHost}]`, { timeout: 2000 })
    }
    catch (err) {
        throw (`Execution host "${executionHost}" not found`);
    }
    await page.locator(`[data-test=execution-hosts-${executionHost}]`).locator("[data-testid=moreMenu]").click();
    await page.click("[data-test=add-host-to-space-more-menu-option]");
    await page.click(`[class~="select-space__control"]`);
    await page.type(`[class~="select-space__control"]`, space);
    await page.keyboard.press("Enter");
    await page.fill("[data-test=namespace]", nameSpace);
    await page.click("[data-test=submit-button]");
};


export const getdeploymentFileAPI = async (session, myURL, name, nameSpace) => {
    // as part of adding new execution host, get the deployment file content
    const data = {
        "details": {
            "sandbox_namespaces": [
                nameSpace
            ]
        },
        "service_type": "k8s",
        "service_name": name
    }
    const response = await fetch(`${myURL}/api/settings/computeservices/deployment`, {
        "method": "POST",
        "body": JSON.stringify(data),
        "headers": {
            'Authorization': `Bearer ${session}`,
            'Content-Type': 'application/json',
            'Accept': '*/*'
        }
    });
    const responseBody = await response.text();
    expect(response.status, responseBody).toBe(200);
    expect(response.ok).toBeTruthy();
    return responseBody;
};

export const disassociateExecutionHostAPI = async (session, myURL, space, executionHost) => {
    const data = {};
    const response = await fetch(`${myURL}/api/spaces/${space}/computeservices/${executionHost}`, {
        "method": "DELETE",
        "body": JSON.stringify(data),
        "headers": {
            'Authorization': `Bearer ${session}`,
            'Content-Type': 'application/json',
            'Accept': '*/*'
        }
    });
    return response;
}