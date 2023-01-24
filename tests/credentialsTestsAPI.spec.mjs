import { expect, test } from "@playwright/test";
import { getSessionAPI } from "./functions/accounts.mjs";
import { launchBlueprintAPI } from "./functions/blueprints.mjs";
import { endSandboxAPI, getSandboxDetailsAPI } from "./functions/sandboxes.mjs";

const baseURL = process.env.baseURL
const password = process.env.allAccountsPassword
const account = process.env.account
const user = process.env.adminEMail
const space = "AmirO"
const BPName = "drift-test-cred"
const inputs = { bucket_region: "eu-west-1", host: "qa-role-test" }
const repoName = 'Assets-amir'
let duration
let session
let ID




test.describe.serial('aws credentials tests', () => {
    test.beforeAll(async () => {
        session = await getSessionAPI(user, password, baseURL, account);
        console.log(session)

    });


    test.skip("Create and validate new SendBox", async () => {
        const response = await launchBlueprintAPI(session, baseURL, BPName, space, inputs, repoName, duration = "PT2H") 
        const responseJson = await response.json()
        console.log(responseJson)
        ID = responseJson.id
        console.log(ID)
        for(let i=0; i<4*60; i++){
            const sandboxInfo = await getSandboxDetailsAPI(session, baseURL, space, ID);
            const sandboxJson = await sandboxInfo.json();
            const state = await sandboxJson.details.computed_status;
            const error = await sandboxJson.details.state.errors[1]
             if(state.includes('Active With Error')){
               console.log(error)
              
               break;
             }
             await new Promise(r => setTimeout(r, 2000)); //wait for 2 seconds
        }
           const deleteSBResponse = await endSandboxAPI(session, baseURL, space, ID)
           expect(deleteSBResponse.status).toBe(202)
           console.log("the status of delete extended Sendbox is " + deleteSBResponse.status )
           test.fail()  
       
    })

})