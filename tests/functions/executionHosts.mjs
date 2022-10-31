import fetch from "node-fetch";
import { expect } from "@playwright/test";
import { selectFromDropbox } from "./general.mjs";

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
    await page.click("[data-test=manage-more-menu-option]");
    await page.click(`[data-test="add-space-to-compute-service"]`);
    await selectFromDropbox(page, "space__value-container", space);
    await selectFromDropbox(page, "default-namespace-full__value-container", nameSpace);
    await selectFromDropbox(page, "default-service-account-full__value-container", "default");
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
};

export const getExecutionHostDetailsAPI = async (session, baseURL, executionHost) =>{
    const response = await fetch(`${baseURL}/api/settings/computeservices?service_name=${executionHost}`, {
        "method": "GET",
        "headers": {
            'Authorization': `Bearer ${session}`,
            'Content-Type': 'application/json',
        }
    });
    return response;
}

export const createEKSAPI = async (session, baseURL, executionHost) => {
    const data = {
        "details": {
            "configure_dns": "false",
            "generate_certificate": "false",
            "ingress_class": "alb",
            "ingress_controller_type": "alb",
            "type": "EKS"
        },
        "service_type": "k8s",
        "service_name": `${executionHost}`
    }
    const response = await fetch(`${baseURL}/api/settings/computeservices`, {
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