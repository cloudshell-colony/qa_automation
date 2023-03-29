import { test, expect } from "@playwright/test";
import { generateUniqueId, validateAPIResponseis200 } from "./functions/general.mjs";
import {execSync} from 'child_process';
import { getSessionAPI, validateGetSessionAPI } from "./functions/accounts.mjs";
import { launchBlueprintAPI } from "./functions/blueprints.mjs";
import { driftCheckAPI, endSandboxAPI, getLastSandboxActivityFromGrainAPI, getSandboxDetailsAPI, reconcileDriftAPI, stopAndValidateAllSBsCompletedAPI, validateSBisActiveAPI, waitForDriftStatusAPI } from "./functions/sandboxes.mjs";

const baseURL = process.env.baseURL;
const password = process.env.allAccountsPassword;
const email = process.env.adminEMail;
const accountName = process.env.account;
const timestemp = Math.floor(Date.now() / 1000);
const id = timestemp.toString().concat(generateUniqueId());
const spaceName = 'drift-api';
const bucketName = 'bucket'.concat(id);
const tagging = `TagSet=[{Key=driftTag, Value=${id}}]`
const executionHostName = 'qa-eks'
const repoName = 'qtorque'
const blueprintName = 'autogen_s3'


/**Test preconditions -
 * AWS CLI configured to work with relevant profile
 * Space in @spaceName exists and contains repo
 * Execution host in @executionHostName is associated to space
 * Space contains autogenerated S3 blueprint which receives bucket name, agent, acl, region & user as inputs
 */

  //   bug 11386
test.describe.serial("Basic drift AWS with API", () => {
    let sandboxId;
    let originalTags;
    let grainId;
    let session ='';
    test.beforeAll(async () => {
        session = await getSessionAPI(email, password, baseURL, accountName);;
        await validateGetSessionAPI(session);
    });

    test.afterAll(async () =>{
        // await stopAndValidateAllSBsCompletedAPI(session, baseURL, spaceName);
        await endSandboxAPI(session, baseURL, spaceName, sandboxId)
    });

    test("Launch S3 bucket sandbox", async() =>{
        let inputs = {
            'acl': "private",
            'agent': `${executionHostName}`,
            'name': `${bucketName}`,
            'region': "eu-west-1",
            'user': "none"
        }
        const resp = await launchBlueprintAPI(session, baseURL, blueprintName, spaceName, inputs, repoName);
        const jsonResponse = await resp.json()
        expect(resp.status, 'Sandbox launch failed, received following error: ' + JSON.stringify(jsonResponse)).toBe(202);
        sandboxId = await jsonResponse.id;
        console.log(`Created sandbox with id ${sandboxId}`);
        await validateSBisActiveAPI(session, baseURL, sandboxId, spaceName);
    });

    test("Tag bucket with CLI", async() => {
        originalTags = execSync(`aws s3api get-bucket-tagging --bucket ${bucketName}`, { encoding: 'utf-8' });
        console.log("Original bucket tags are:\n" + originalTags);
        execSync(`aws s3api put-bucket-tagging --bucket ${bucketName} --tagging "${tagging}"`, { encoding: 'utf-8' });
        let newTags = execSync(`aws s3api get-bucket-tagging --bucket ${bucketName}`, { encoding: 'utf-8' });
        console.log('New bucket tags:\n' + newTags);
    });

    test("Check for drift", async() =>{
        let sandboxDetails = await (await getSandboxDetailsAPI(session, baseURL, spaceName, sandboxId)).json();
        grainId = sandboxDetails.details.state.grains[0].id;
        console.log('Grain ID is: ' + grainId);
        const response = await driftCheckAPI(session, baseURL, spaceName, sandboxId, grainId);
        await validateAPIResponseis200(response);
        await waitForDriftStatusAPI(session, baseURL, spaceName, sandboxId, grainId);
    });
  
    test("Reconcile and validate tags are changed", async()=>{
        // initiate reconcile and wait for it to end
        const response = await reconcileDriftAPI(session, baseURL, spaceName, sandboxId, [grainId]);
        await validateAPIResponseis200(response);
        console.log('Reconciled grain ' + grainId);
        await waitForDriftStatusAPI(session, baseURL, spaceName, sandboxId, grainId, false);
        // validate reconcile completed
        let lastActivity = await getLastSandboxActivityFromGrainAPI(session, baseURL, spaceName, sandboxId, grainId);
        expect(lastActivity.name).toBe('Reconcile', {timeout:10000});
        expect(lastActivity.status).toBe('Done');
        console.log('Reconciled completed successfully');
        // check tags in S3 bucket
        let output = execSync(`aws s3api get-bucket-tagging --bucket ${bucketName}`, { encoding: 'utf-8' });
        expect(output, "Tags after reconcile do not match original bucket tags").toBe(originalTags);
        console.log('Reconcile successfully reverted tags on AWS S3 bucket');
    });
});