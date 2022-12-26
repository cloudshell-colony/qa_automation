import { expect, test } from "@playwright/test";
import { getExecutionHostList, getExecutionHostListInSpace } from "../functions/executionHosts.mjs";
import { getSessionAPI } from "../functions/accounts.mjs";

const baseURL = process.env.baseURL
const password = process.env.allAccountsPassword;
const account = process.env.account;
const user = process.env.adminEMail
const space = process.env.space
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






})


