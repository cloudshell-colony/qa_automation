import { expect, test } from "@playwright/test";
import { getSessionAPI } from "../functions/accounts.mjs";
import {  getBlueprintsDetailsInCatalogAPI, getBlueprintsInCatalogAPI, publishBlueprintAPI, unpublishBlueprintInCatalogAPI } from "../functions/blueprints.mjs";

const baseURL = process.env.baseURL
const password = process.env.allAccountsPassword
const account = process.env.account
const user = process.env.adminEMail
const space = "API-tests"
const wrongSpace = "asd"
const BPName = "autogen_create-ec2-instance"
const wrongBPName = "autogen_eks"
const repoName = 'qtorque'
let session

/** Test prerequisites
 * Have account with credentials as saved in .env file
 * @space should exist in the account with @executionHostName associated to it
 * Space should have repo https://github.com/QualiNext/test-spec2-public associated
 * and @BPName asset auto-generated to a blueprint
 * Space should have repo https://github.com/QualiNext/torque-demo associated and dirft-test blueprint published
 */

test.describe.serial('Validate Blueprint from catalog tests', () => {
    test.beforeAll(async () => {
       
        session = await getSessionAPI(user, password, baseURL, account);
        console.log(session)

    });

    test("Get blueprints in catalog and validate status is 200", async () => {
        const getBlueprint = await getBlueprintsInCatalogAPI(session, baseURL,space) 
        const response = await getBlueprint.text()
        console.log(response)
        expect(getBlueprint.status).toBe(200)
        console.log("response status is " + getBlueprint.status)
        expect(response).toContain('"drift-test"')
        
    })

    test("validate 404 - space not found", async () => {
        const getBlueprint = await getBlueprintsInCatalogAPI(session, baseURL,wrongSpace) 
        const response = await getBlueprint.text()
        console.log(response)
        expect(getBlueprint.status).toBe(404)
        console.log("response status is " + getBlueprint.status)
        expect(response).toContain('"Space not found"')
        
    })

    test("publish blueprint and validate status is 200", async () => {
        const publishBlueprint = await publishBlueprintAPI(session, baseURL, space, BPName, repoName) 
        const response = await publishBlueprint.text()
        console.log(response)
        expect(publishBlueprint.status).toBe(200)
        console.log("response status is " + publishBlueprint.status)
       
        
    })

    test("publish blueprint with wrong space name and validate status is 404", async () => {
        const publishBlueprint = await publishBlueprintAPI(session, baseURL, wrongSpace, BPName, repoName) 
        const response = await publishBlueprint.text()
        console.log(response)
        expect(publishBlueprint.status).toBe(404)
        console.log("response status is " + publishBlueprint.status)
        expect(response).toContain('"Space not found"')
       
        
    })

    test("publish blueprint with wrong blueprint name and validate status is 404", async () => {
        const publishBlueprint = await publishBlueprintAPI(session, baseURL, space, wrongBPName, repoName) 
        const response = await publishBlueprint.text()
        console.log(response)
        expect(publishBlueprint.status).toBe(404)
        console.log("response status is " + publishBlueprint.status)
        expect(response).toContain('"Blueprint not found"')
       
        
    })

    test("get blueprint details and validate status is 200", async () => {
        const blueprintDetails = await getBlueprintsDetailsInCatalogAPI(session, baseURL, space, BPName, repoName) 
        const response = await blueprintDetails.text()
        console.log(response)
        expect(blueprintDetails.status).toBe(200)
        console.log("response status is " + blueprintDetails.status)
        expect(response).toContain(BPName)
       
        
    })

    test("get blueprint details with wrong BP name and validate status is 404", async () => {
        const blueprintDetails = await getBlueprintsDetailsInCatalogAPI(session, baseURL, space, wrongBPName, repoName) 
        const response = await blueprintDetails.text()
        console.log(response)
        expect(blueprintDetails.status).toBe(404)
        console.log("response status is " + blueprintDetails.status)
        expect(response).toContain('"Blueprint not found"')
       
        
    })

    test("get blueprint details with wrong space name and validate status is 404", async () => {
        const blueprintDetails = await getBlueprintsDetailsInCatalogAPI(session, baseURL, wrongSpace, BPName, repoName) 
        const response = await blueprintDetails.text()
        console.log(response)
        expect(blueprintDetails.status).toBe(404)
        console.log("response status is " + blueprintDetails.status)
        expect(response).toContain('"Space not found"')
       
        
    })

    test("Unpublish blueprint and validate status is 200", async () => {
        const unpublishBlueprint = await unpublishBlueprintInCatalogAPI(session, baseURL, space, BPName, repoName) 
        const response = await unpublishBlueprint.text()
        console.log(response)
        expect(unpublishBlueprint.status).toBe(200)
        console.log("response status is " + unpublishBlueprint.status)
       
        
    })

    test("Unpublish blueprint with wrong space name and validate status is 404", async () => {
        const unpublishBlueprint = await unpublishBlueprintInCatalogAPI(session, baseURL, wrongSpace, BPName, repoName) 
        const response = await unpublishBlueprint.text()
        console.log(response)
        expect(unpublishBlueprint.status).toBe(404)
        console.log("response status is " + unpublishBlueprint.status)
        expect(response).toContain('"Space not found"')
       
    })
     //bug no 10794
    test.skip("Unpublish blueprint with wrong blueprint name and validate status is 404", async () => {
        const unpublishBlueprint = await unpublishBlueprintInCatalogAPI(session, baseURL, space, wrongBPName, repoName) 
        const response = await unpublishBlueprint.text()
        console.log(response)
        expect(unpublishBlueprint.status).toBe(404)
        console.log("response status is " + unpublishBlueprint.status)
        expect(response).toContain('"Blueprint not found"')
       
        
    })


})