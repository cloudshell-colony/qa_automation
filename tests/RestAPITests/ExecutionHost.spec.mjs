import { expect, test } from "@playwright/test";
import { associateExecutionHostAPI, disassociateExecutionHostAPI, getExecutionHostList, getExecutionHostListInSpace } from "../functions/executionHosts.mjs";
import { getSessionAPI } from "../functions/accounts.mjs";

const baseURL = process.env.baseURL
const password = process.env.allAccountsPassword;
const account = process.env.account;
const user = process.env.adminEMail
const space = "Amir"
const wrongSpace = "sdss"
const executionHost = "bp-validation2"
const nameSpace = "amir-testing"
const serviceAccount = "default"
let session;

test.describe.serial('Execution host tests', () => {
    test.beforeAll(async () => {
        session = await getSessionAPI(user, password, baseURL, account);

    });


    test("get execution host list", async () => {
        const response = await getExecutionHostList(baseURL, session)
        console.log(session)
        console.log(await response.json())
        expect(response.status).toBe(200)

    })

    test("get execution host list in space", async () => {
        const response = await getExecutionHostListInSpace(baseURL, space, session)
        console.log(session)
        console.log(response)
        const json = response.json()
        console.log(await json)

        expect(response.status).toBe(200)

    })

    test("associate k8s execution host with space", async () => {
        const associateExecutionHost= await associateExecutionHostAPI(session, baseURL, space, executionHost, nameSpace, serviceAccount)
        const response = await associateExecutionHost.text()
        expect(associateExecutionHost.status).toBe(200)
        console.log("status of k8s associate is " + associateExecutionHost.status)
        console.log(response)
       

    })

    test("associate same k8s execution host with same space and validate 422", async () => {
        const associateExecutionHost= await associateExecutionHostAPI(session, baseURL, space, executionHost, nameSpace, serviceAccount)
        const response = await associateExecutionHost.text()
        expect(associateExecutionHost.status).toBe(422)
        console.log("status of k8s associate is " + associateExecutionHost.status)
        console.log(response)
        expect(response).toContain('"Execution host already associated with the space"')

    })

    test("associate same k8s execution host with wrong space name and validate 404", async () => {
        const associateExecutionHost= await associateExecutionHostAPI(session, baseURL, wrongSpace, executionHost, nameSpace, serviceAccount)
        const response = await associateExecutionHost.text()
        expect(associateExecutionHost.status).toBe(404)
        console.log("status of k8s associate is " + associateExecutionHost.status)
        console.log(response)
        expect(response).toContain('"Space not found"')

    })


    test("disassociate k8s execution host with space", async () => {
        const response = await disassociateExecutionHostAPI(session, baseURL, space, executionHost)
        expect(response.status).toBe(200)
        console.log("dissassociate status id " + response.status)

    })






})


