import { expect, test } from "@playwright/test";
import { getSessionAPI } from "../functions/accounts.mjs";
import { launchBlueprintAPI } from "../functions/blueprints.mjs";
import { endSandboxAPI, ExtendSendbox, getAllSandboxesAPI, getSandboxDetailsAPI, validateSBisActiveAPI } from "../functions/sandboxes.mjs";

const baseURL = process.env.baseURL
const password = process.env.allAccountsPassword
const account = process.env.account
const user = process.env.adminEMail
const space = "AmirO"
const BPName = "autogen_create-ec2-instance"
const inputs = { ami: "ami-0cd01c7fb16a9b497", instance_type: "t3.micro", host_name: "qa-eks3" }
const repoName = 'qtorque'
let duration
let session
let ID
let active



test.describe.serial('SendBox extention tests', () => {
    test.beforeAll(async () => {
       
        session = await getSessionAPI(user, password, baseURL, account);
        console.log(session)

    });


    test("Create and validate new SendBox", async () => {
        const response = await launchBlueprintAPI(session, baseURL, BPName, space, inputs, repoName, duration = "PT2H") 
        const responseJson = await response.json()
        console.log(responseJson)
        ID = responseJson.id
        console.log(ID)
        await validateSBisActiveAPI(session, baseURL, ID, space)
       
    })

    test(" extend SendBox", async () => {
      // const response =   await getAllSandboxesAPI(session, baseURL, space, active)
      const response = await getSandboxDetailsAPI(session, baseURL, space, ID)

      const responseJson = await response.json()
      // for (let i = 0; i < responseJson.length; i++) {
        // const element = responseJson[i];
        // var envID = await element.id
        console.log("the env id is " + ID)
        const envCurrentState = await responseJson.details.state.current_state
        console.log("the env current state: " + envCurrentState)
        expect(envCurrentState).toBe('active')
        var stringExtratime = new Date();
        console.log(stringExtratime)
        stringExtratime.setDate(stringExtratime.getDate() + parseInt(10));
        console.log(stringExtratime);
        const extendResponse =  await ExtendSendbox(baseURL, space, ID, stringExtratime.toISOString(), session)
        expect(extendResponse.status).toBe(200)
        console.log("status of adding time to " + ID + "is " + extendResponse.status)
      // }
    })

    test(" delete extended SendBox", async () => {
        // const response =   await getAllSandboxesAPI(session, baseURL, space, active)
        // const responseJson = await response.json()
        // for (let i = 0; i < responseJson.length; i++) {
          // const element = responseJson[i];
          // var envID = await element.id
          // console.log("the env id is " + envID)
          const deleteSBResponse = await endSandboxAPI(session, baseURL, space, ID)
          expect(deleteSBResponse.status).toBe(202)
          console.log("the status of delete extended Sendbox is " + deleteSBResponse.status )
        // }

    })

})