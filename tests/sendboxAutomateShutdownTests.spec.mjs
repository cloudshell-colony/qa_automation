import { expect, test } from "@playwright/test";
import { getSessionAPI } from "./functions/accounts.mjs";
import { launchBlueprintAPI } from "./functions/blueprints.mjs";
import { getSandboxDetailsAPI, validateSBisActiveAPI, validateSBisEndedAPI } from "./functions/sandboxes.mjs";

const baseURL = process.env.baseURL
const password = process.env.allAccountsPassword
const account = process.env.account
const user = process.env.adminEMail
const space = "Amir"
const BPName = "autogen_create-ec2-instance"
const inputs = { ami: "ami-0cd01c7fb16a9b497", instance_type: "t3.micro", host_name: "qa-eks3" }
const repoName = 'qtorque'
let duration
let session

test.describe.serial('SendBox extention tests', () => {
    test.beforeAll(async () => {
        session = await getSessionAPI(user, password, baseURL, account);
        console.log(session)
    });

    test("Create 6 minutes sendbox and validate automate shutdown ", async () => {
        const response = await launchBlueprintAPI(session, baseURL, BPName, space, inputs, repoName, duration = "PT6M") 
        const responseJson = await response.json()
        console.log(responseJson)
        const ID = responseJson.id
        console.log(ID)
        await validateSBisActiveAPI(session, baseURL, ID, space)
        await validateSBisEndedAPI(session, baseURL, ID, space)  
    })
})