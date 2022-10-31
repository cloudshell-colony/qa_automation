
import test, { expect } from "@playwright/test";
import { generateSecret, validateAPIResponseis200 } from './functions/general.mjs';
import { signupUserAPI, getSessionAPI, sendInvitationsAPI, getInvitationAPI, deleteUserAPI, validateGetSessionAPI, createAccountAPI, deleteAccountAPI } from "./functions/accounts.mjs";
import fetch from "node-fetch";
import { createSpaceAPI } from "./functions/spaces.mjs";

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

    test('Add BPs repository to space', async () => {
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

        })
            .then(response => {
                console.log(response);
            })
            .catch(err => {
                console.error(err);
            });

    });

    test('Add execution host to space', async () => {
        await page.pause();
    });

});