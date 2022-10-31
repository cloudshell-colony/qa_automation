
import test, { expect } from "@playwright/test";
import { generateSecret, validateAPIResponseis200, overwriteAndSaveToFile, executeCLIcommand } from './functions/general.mjs';
import { signupUserAPI, getSessionAPI, sendInvitationsAPI, getInvitationAPI, deleteUserAPI, validateGetSessionAPI, createAccountAPI, deleteAccountAPI } from "./functions/accounts.mjs";
import fetch from "node-fetch";
import { createSpaceAPI } from "./functions/spaces.mjs";
import { associateExecutionHostAPI, createEKSAPI, getdeploymentFileAPI, getExecutionHostDetailsAPI } from "./functions/executionHosts.mjs";

const prefix = process.env.accountPrefix;
const baseURL = process.env.baseURL;
const password = process.env.allAccountsPassword;
const timestemp = Math.floor(Date.now() / 1000);
const firstName = "FN.".concat(prefix).concat(timestemp);
const lastName = "LN.".concat(prefix).concat(timestemp);
const companyName = "Company.".concat(prefix).concat(timestemp);
const accountName = prefix.concat(timestemp);
const spaceName = prefix.concat("-space-").concat(timestemp);
const email = prefix.concat("@").concat(timestemp).concat(".com");
const executionHost = process.env.execHostName;
const executionHostName = executionHost.concat(timestemp);
const namespace = process.env.nameSpace;
const serviceAccount = process.env.serviceAccount;

let session = "empty session";
// const secret = generateSecret(email, account);


test.describe.serial('On boarding with APIs', () => {
    test.afterAll(async () => {
        await deleteAccountAPI(baseURL, accountName, session);
    });

    test('Create new account', async () => {
        console.log(`Createing new account with the following paramaters:`);
        console.log(`"account_name": ${accountName}, "first_name": ${firstName}, "last_name": ${lastName}, "email": ${email}, "password": ${password}, "company_name": ${companyName}`);
        const response = await createAccountAPI(baseURL, accountName, companyName, email, firstName, lastName, password);
        await validateAPIResponseis200(response);
    });

    test('Get admin session from new account', async () => {
        session = await getSessionAPI(email, password, baseURL, accountName);
        await validateGetSessionAPI(session);
        console.log(`Got the following admin session: ${session}`);
    });

    test('Create new space', async () => {
        console.log(`Creating new space with the name: "${spaceName}"`);
        const response = await createSpaceAPI(baseURL, session, spaceName)
        await validateAPIResponseis200(response);
    });

    test.skip('Add BPs repository to space', async () => {
        const data = {
            "code": "293fe960eac4f9e031ed",
            "repository_url": "https://github.com/cloudshell-colony/qa_automation",
            "type": "sandbox",
            "branch": null,
            "repository_name": "qa_automation102"
        }

        const data2 = {
            "repository_url": "https://github.com/gilad030609/repo",
            "access_token": "293fe960eac4f9e031ed",
            "repository_type": "github",
            "branch": "master",
            "type": "sandbox",
            "repository_name": "repo",
            "provider_id": repository_provider_id,
        }

        await fetch(`${baseURL}/api/spaces/${spaceName}/repositories/github`, {
            "method": "POST",
            "headers": {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${session}`
            },
            "body": JSON.stringify(data),

        }).then(response => {
                console.log(response);
            }).catch(err => {
                console.error(err);
            });

    });

    test.skip('Add asset repo to space', async () => {
        const data = {
            "branch": null,
            "code": "3c8972593da4f590818f",
            "redirection_url": `${baseURL}/api/OauthRedirect`,
            "repository_url": "https://github.com/cloudshell-colony/qa_automation",
            "repository_name": "qa-assets",
            "type": "asset"
        }
        await fetch(`${baseURL}/api/spaces/${spaceName}/repositories/github`, {
            "method": "POST",
            "headers": {
                "Accept": '*/*',
                "Content-Type": "application/json",
                "Connection": "keep-alive",
                "Authorization": `Bearer ${session}`
            },
            "body": JSON.stringify(data)
        }).then(response => {
                console.log(response);
            }).catch(err => {
                console.error(err);
            });
    });

    test('Create execution host', async () => {
        const response = await createEKSAPI(session, baseURL, executionHostName);
        await validateAPIResponseis200(response);
    });
    test('Create execution host deployment file', async () => {
        // get session for API call
        const response = await getdeploymentFileAPI(await session, baseURL, executionHostName, executionHostName);
        await overwriteAndSaveToFile("deploymentFile.yaml", response);
    });

    test('Apply the execution host yaml file to K8S', async () => {
        await executeCLIcommand("kubectl apply -f deploymentFile.yaml");
        let ESInfo;
        //wait for max 5 minutes until host status is active
        for(let i=0; i<5*60; i++){
            ESInfo = await getExecutionHostDetailsAPI(session, baseURL, executionHostName);
            let ESText = await ESInfo.text();
            if(ESText.includes("active")){
                break;
            }
            await new Promise(r => setTimeout(r, 1000)); //wait for 1 second
        }
        ESInfo = await getExecutionHostDetailsAPI(session, baseURL, executionHostName);
        expect(await ESInfo.text(), "Execution host is not active after 5 minutes").toContain("active");
    });

    test('Associate execution host to space', async () => {
        const response = await associateExecutionHostAPI(session, baseURL, spaceName, executionHostName, namespace, serviceAccount);
        await validateAPIResponseis200(response);
    });


});