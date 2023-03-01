
import test, { expect } from "@playwright/test";
import { validateAPIResponseis200, overwriteAndSaveToFile, executeCLIcommand, generateUniqueId } from './functions/general.mjs';
import { getSessionAPI, validateGetSessionAPI, createAccountAPI, deleteAccountAPI } from "./functions/accounts.mjs";
import { addRepositoryAPI, createSpaceAPI } from "./functions/spaces.mjs";
import { associateExecutionHostAPI, createEKSAPI, getdeploymentFileAPI, getExecutionHostDetailsAPI } from "./functions/executionHosts.mjs";
import { stopAndValidateAllSBsCompletedAPI, getNonActiveAliveSandboxesAPI, waitForSandboxesToBeActiveAPI} from "./functions/sandboxes.mjs";
import { launchBlueprintAPI } from "./functions/blueprints.mjs";
import { addParameterToAccountAPI, deleteAccountParameterAPI } from "./functions/parameters.mjs";

const prefix = process.env.accountPrefix;
const baseURL = process.env.baseURL;
const password = process.env.allAccountsPassword;
const timestemp = Math.floor(Date.now() / 1000);
const id = timestemp.toString().concat('-' + generateUniqueId());
const firstName = "FN.".concat(prefix).concat(timestemp);
const lastName = "LN.".concat(prefix).concat(timestemp);
const companyName = "Company.".concat(prefix).concat(timestemp);
const accountName = prefix.concat(id);
const spaceName = prefix.concat("-space-").concat(timestemp);
const userEmail = prefix.concat("@").concat(id).concat(".com");
const executionHost = process.env.execHostName;
const executionHostName = executionHost.concat(timestemp);
const namespace = process.env.nameSpace;
const serviceAccount = process.env.serviceAccount;
const repoUrl = process.env.githubRepo;
const repoName = "qa_automation"
const token = process.env.githubToken;
let session = "empty session";
let sandboxId = '';
const blueprintMap = [{name: 'kube-nginx', inputs: {'namespace': namespace, 'host_name':executionHostName}},
{name: 'provision-s3-buckets', inputs: {'host_name':executionHostName}},
{name: 'helm-nginx', inputs: {'namespace': namespace, 'host_name':executionHostName}},
{name: 'Webgame on S3 (TF)', inputs: {'host_name':executionHostName, 'Name Prefix': accountName.toLowerCase()}}]
//{name: 'Wordpress Website on AWS EC2 (TF)', inputs: {'instance_type': 't3a.micro'}}
const paramMap = [{name: 'default_eks_host', value: executionHostName, sensitive: false},
{name: 'default_eks_host_namespace', value: namespace, sensitive: false},
{name: 'default_eks_host_service_account', value: serviceAccount, sensitive: false},
{name: 'Torque_Demo_Production_Agent_IAM_Role', value: 'Yakir_Role_S3_Testing', sensitive: false},
{name: 'Torque_Demo_Production_External_ID', value: 'f5d5910e-3809-531e-f763-b97a23c6552b', sensitive: true},
{name: 'Torque_Demo_Production_AWS', value: '799617105972', sensitive: true}]


test.describe.serial('Multiple blueprints onBoarding API', () => {
    test.afterAll(async () => {
        console.log(`Stopping all Sbs after test complteted in space ${spaceName}`);
        await stopAndValidateAllSBsCompletedAPI(session, baseURL, spaceName, 7);
        console.log(`Delete account "${accountName}", as part of test cleanup`);
        await deleteAccountAPI(baseURL, accountName, session);
        // delete execution host in k8s
        if (executionHostName !== "enter real if needed") {
            console.log(`Deleting all the namespaces containing ${executionHostName}`);
            await executeCLIcommand(`sh cleanEHosts.sh ${executionHostName}`);
        };
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
        await addRepositoryAPI(session, baseURL, spaceName, repoUrl, token, repoName);
        console.log(`Added repository ${repoName}`);
    });

    test('Add account parameters', async() =>{
        await addParameterToAccountAPI(session, baseURL, paramMap)
    })

    test('Create execution host', async () => {
        const response = await createEKSAPI(session, baseURL, executionHostName);
        await validateAPIResponseis200(response);
    });

    test('Create execution host deployment file', async () => {
        // get session for API call
        const response = await getdeploymentFileAPI(session, baseURL, "k8s", executionHostName);
        await overwriteAndSaveToFile("deploymentFile.yaml", response);
    });

    test('Apply the execution host yaml file to K8S', async () => {
        await executeCLIcommand("kubectl apply -f deploymentFile.yaml");
        let ESInfo, ESText;
        //wait for max 5 minutes until host status is active
        for(let i=0; i<5*60; i++){
            ESInfo = await getExecutionHostDetailsAPI(session, baseURL, executionHostName);
            ESText = await ESInfo.text();
            if(ESText.includes("active")){
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


    //Launch all blueprints in our blueprint map
    for (const blueprintData of blueprintMap) {
        test(`Launching blueprint "${blueprintData.name}"`, async () => {
            const resp = await launchBlueprintAPI(session, userEmail, baseURL, blueprintData.name, spaceName, blueprintData.inputs, repoName);
            const jsonResponse = await resp.json()
            expect(resp.status, 'Sandbox launch failed, received following error: ' + JSON.stringify(jsonResponse)).toBe(202);
            sandboxId = await jsonResponse.id;
            console.log(`Created sandbox with id ${sandboxId} from blueprint ${blueprintData.name}`);
        })
    };

    test('Wait for all sandboxes to finish launching', async() => {
        await waitForSandboxesToBeActiveAPI(session, baseURL, spaceName)
    })

    test('Validate all sandboxes are active without error', async() => {
        let badSandboxesList = await getNonActiveAliveSandboxesAPI(session, baseURL, spaceName);
        expect(badSandboxesList.length, 'Some sandboxes are not active: \n ' + badSandboxesList).toBe(0)
        console.log(`All ${blueprintMap.length} sandboxes are active with no error`);
    });
});