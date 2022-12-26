
import test, { expect } from "@playwright/test";
import { generateSecret, validateAPIResponseis200, overwriteAndSaveToFile, executeCLIcommand } from './functions/general.mjs';
import { signupUserAPI, getSessionAPI, sendInvitationsAPI, getInvitationAPI, deleteUserAPI, validateGetSessionAPI, createAccountAPI, deleteAccountAPI } from "./functions/accounts.mjs";
import fetch from "node-fetch";
import { addAssetRepositoryAPI, createSpaceAPI } from "./functions/spaces.mjs";
import { associateExecutionHostAPI, createEKSAPI, getdeploymentFileAPI, getExecutionHostDetailsAPI } from "./functions/executionHosts.mjs";
import { validateSBisActiveAPI, validateSBisEndedAPI, endSandboxAPI } from "./functions/sandboxes.mjs";
import { generateAllRepoBlueprintsAPI, launchBlueprintAPI } from "./functions/blueprints.mjs";

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
const bucketName = ("qa-auto-bucket-").concat(timestemp);
const repoUrl = process.env.githubRepo;
const repoName = "repo".concat(timestemp);
const token = process.env.githubToken;

let session = "empty session";
let sandboxId = '';
// const secret = generateSecret(email, account);


test.describe.serial('On boarding with APIs', () => {
    test.afterAll(async () => {
        await deleteAccountAPI(baseURL, accountName, session);
        await executeCLIcommand(`sh cleanEHosts.sh ${executionHostName}`);
    });

    test('Create new account', async () => {
        console.log(`Creating new account with the following paramaters:`);
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
        await addAssetRepositoryAPI(session, baseURL, spaceName, repoUrl, token, repoName);
        console.log(`Added asset repository ${repoName}`);
    });

    test('Generate blueprints from asset repo', async () => {
        const response = await generateAllRepoBlueprintsAPI(session, baseURL, spaceName, repoName);
        await validateAPIResponseis200(response);
        console.log(`Generated blueprints from repo ${repoName}`);
    });

    test('Create execution host', async () => {
        const response = await createEKSAPI(session, baseURL, executionHostName);
        await validateAPIResponseis200(response);
    });
    test('Create execution host deployment file', async () => {
        // get session for API call
        const response = await getdeploymentFileAPI(await session, baseURL, "k8s", executionHostName);
        await overwriteAndSaveToFile("deploymentFile.yaml", response);
    });

    test('Apply the execution host yaml file to K8S', async () => {
        await executeCLIcommand("kubectl apply -f deploymentFile.yaml");
        let ESInfo, ESText;
        //wait for max 5 minutes until host status is active
        for (let i = 0; i < 5 * 60; i++) {
            ESInfo = await getExecutionHostDetailsAPI(session, baseURL, executionHostName);
            ESText = await ESInfo.text();
            if (ESText.includes("active")) {
                break;
            }
            await new Promise(r => setTimeout(r, 1000)); //wait for 1 second
        }
        expect(ESText, "Execution host is not active after 5 minutes. Execution host response: \n" + ESText).toContain("active");
        console.log('Execution host should now be active');
    });

    test('Associate execution host to space', async () => {
        console.log(`Associating execution host ${executionHostName} to space ${spaceName}`);
        const response = await associateExecutionHostAPI(session, baseURL, spaceName, executionHostName, namespace, serviceAccount);
        await validateAPIResponseis200(response);
    });

    test('Launch new sandbox', async () => {
        let inputs = {
            'acl': "private",
            'host_name': `${executionHostName}`,
            'name': `${bucketName}`,
            'region': "eu-west-1",
            'user': "none"
        }
        const resp = await launchBlueprintAPI(session, baseURL, 'autogen_s3', spaceName, inputs);
        const jsonResponse = await resp.text()
        expect(resp.status, 'Sandbox launch failed, received following error: ' + await jsonResponse).toBe(202);
        sandboxId = await jsonResponse.id;
        console.log(`Created sandbox with id ${sandboxId}`);
    })

    test('Validate sandbox is active', async () => {
        await validateSBisActiveAPI(session, baseURL, sandboxId, spaceName);
    })

    test('End sandbox', async () => {
        const response = await endSandboxAPI(session, baseURL, spaceName, sandboxId);
        expect(response.status, await response.text()).toBe(202);
        console.log('Ended sandbox')
    })

    test('Validate sandbox is completed', async () => {
        await validateSBisEndedAPI(session, baseURL, sandboxId, spaceName);
    })

});