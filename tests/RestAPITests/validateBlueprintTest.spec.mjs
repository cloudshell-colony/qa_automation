import { expect, test,  } from "@playwright/test";
import { getSessionAPI } from "../functions/accounts.mjs";
import {  validateBlueprintAPI } from "../functions/blueprints.mjs";

const baseURL = process.env.baseURL
const password = process.env.allAccountsPassword
const account = process.env.account
const user = process.env.adminEMail
const space = "API-tests"
const wrongSpace = "asd"
const BPName = "create-ec2-instance"
const wrongBlueprintRaw = "c3BlY192ZXJzaW9uOiAyCmRlc2NyaXB0aW9uOiBBdXRvIGdlbmVyYXRlZCBibHVlcHJpbnQgZm9yIHRlcnJhZm9ybSBtb2R1bGUgY3JlYXRlLWVjMi1pbnN0YW5jZQojIGJsdWVwcmludCBpbnB1dHMgY2FuIGJlIHByb3ZpZGVkIGJ5IHRoZSB1c2VyLCBBUEkgb3IgQ0kgcGx1Z2luIHdoZW4gY3JlYXRpbmcgYW4gZW52aXJvbm1lbnQgZnJvbSB0aGlzIGJsdWVwcmludC4KaW5wdXRzOgogIGFtaToKICAgIHR5cGU6IG51bWJlcgogIGluc3RhbmNlX3R5cGU6CiAgICB0eXBlOiBzdHJpbmcKICAgIGRlZmF1bHQ6IHQzLm1pY3JvCiAgaG9zdF9uYW1lOgogICAgdHlwZTogZXhlY3V0aW9uLWhvc3QKIyBibHVlcHJpbnQgb3V0cHV0cyBkZWZpbmUgd2hpY2ggZGF0YSB0aGF0IHdhcyBnZW5lcmF0ZWQgZHVyaW5nIGVudmlyb25tZW50IHByb3Zpc2lvbmluZyB3aWxsIGJlIHJldHVybmVkIHRvIHRoZSB1c2VyLCBBUEkgb3IgQ0kuCm91dHB1dHM6CiAgcGFzc3dvcmQ6CiAgICB2YWx1ZTogJ3t7IC5ncmFpbnMuY3JlYXRlLWVjMi1pbnN0YW5jZS5vdXRwdXRzLnBhc3N3b3JkIH19JwogIHB1YmxpY19pcDoKICAgIHZhbHVlOiAne3sgLmdyYWlucy5jcmVhdGUtZWMyLWluc3RhbmNlLm91dHB1dHMucHVibGljX2lwIH19JwpncmFpbnM6CiAgY3JlYXRlLWVjMi1pbnN0YW5jZToKICAgIGtpbmQ6IHRlcnJhZm9ybQogICAgc3BlYzoKICAgICAgc291cmNlOgogICAgICAgIHN0b3JlOiB0ZXN0LXNwZWMyLXB1YmxpYwogICAgICAgIHBhdGg6IHRlcnJhZm9ybS9jcmVhdGUtZWMyLWluc3RhbmNlCiAgICAgIGhvc3Q6CiAgICAgICMgRXhlY3V0aW9uIEhvc3QgLSB0aGUgcGxhdGZvcm0gd2hlcmUgdGhlIGFzc2V0IGV4ZWN1dGFibGUgd2lsbCBydW4uCiAgICAgICMgRm9yIGV4YW1wbGUsIGEgS3ViZXJuZXRlcyBjbHVzdGVyIGNhbiBiZSB1c2VkIGFzIGFuIGV4ZWN1dGlvbiBob3N0LgogICAgICAgIG5hbWU6ICd7eyAuaW5wdXRzLmhvc3RfbmFtZSB9fScKICAgICAgICAjIEEgc2VydmljZSBhY2NvdW50IGFubm90YXRlZCB3aXRoIGEgcm9sZSBBUk4gd2l0aCBwZXJtaXNzaW9ucyB0byBydW4gdGhlIGFzc2V0CiAgICAgICAgIyBzZXJ2aWNlLWFjY291bnQ6IDxzZXJ2aWNlLWFjY291bnQtbmFtZT4KICAgICAgaW5wdXRzOgogICAgICAtIGFtaTogJ3t7IC5pbnB1dHMuYW1pIH19JwogICAgICAtIGluc3RhbmNlX3R5cGU6ICd7eyAuaW5wdXRzLmluc3RhbmNlX3R5cGUgfX0nCiAgICAgICMgVGhlIGVudmlyb25tZW50IHZhcmlhYmxlcyBkZWNsYXJlZCBpbiB0aGlzIHNlY3Rpb24gd2lsbCBiZSBhdmFpbGFibGUgZHVyaW5nIHRoZSBncmFpbiBkZXBsb3ltZW50IGFzIHdlbGwgYXMgdGhlIGdyYWluIGRlc3Ryb3kgcGhhc2UKICAgICAgIyBlbnYtdmFyczoKICAgICAgIyAtIFZBUl9OQU1FOiB2YXIgdmFsdWUKICAgICAgZW52LXZhcnM6IAogICAgICAgIC0gQVdTX0FDQ0VTU19LRVlfSUQ6ICd7eyBwYXJhbXMuYWNjZXNzS2V5fX0nCiAgICAgICAgLSBBV1NfU0VDUkVUX0FDQ0VTU19LRVk6ICd7eyBwYXJhbXMuU2VjcmV0S2V5IH19JwogICAgICAgIC0gQVdTX1NFU1NJT05fVE9LRU46ICd7eyBwYXJhbXMuVG9rZW4gfX0nCiAgICAgIG91dHB1dHM6CiAgICAgIC0gcGFzc3dvcmQKICAgICAgLSBwdWJsaWNfaXAKICAgICMgVGhlIHRlcnJhZm9ybSB2ZXJzaW9uIHRoYXQgd2lsbCBiZSB1c2VkIHRvIGRlcGxveSB0aGUgbW9kdWxlCiAgICB0Zi12ZXJzaW9uOiAxLjMuNgo="
const blueprintRaw = "c3BlY192ZXJzaW9uOiAyCmRlc2NyaXB0aW9uOiBBdXRvIGdlbmVyYXRlZCBibHVlcHJpbnQgZm9yIHRlcnJhZm9ybSBtb2R1bGUgY3JlYXRlLWVjMi1pbnN0YW5jZQojIGJsdWVwcmludCBpbnB1dHMgY2FuIGJlIHByb3ZpZGVkIGJ5IHRoZSB1c2VyLCBBUEkgb3IgQ0kgcGx1Z2luIHdoZW4gY3JlYXRpbmcgYW4gZW52aXJvbm1lbnQgZnJvbSB0aGlzIGJsdWVwcmludC4KaW5wdXRzOgogIGFtaToKICAgIHR5cGU6IHN0cmluZwogIGluc3RhbmNlX3R5cGU6CiAgICB0eXBlOiBzdHJpbmcKICAgIGRlZmF1bHQ6IHQzLm1pY3JvCiAgaG9zdF9uYW1lOgogICAgdHlwZTogZXhlY3V0aW9uLWhvc3QKIyBibHVlcHJpbnQgb3V0cHV0cyBkZWZpbmUgd2hpY2ggZGF0YSB0aGF0IHdhcyBnZW5lcmF0ZWQgZHVyaW5nIGVudmlyb25tZW50IHByb3Zpc2lvbmluZyB3aWxsIGJlIHJldHVybmVkIHRvIHRoZSB1c2VyLCBBUEkgb3IgQ0kuCm91dHB1dHM6CiAgcGFzc3dvcmQ6CiAgICB2YWx1ZTogJ3t7IC5ncmFpbnMuY3JlYXRlLWVjMi1pbnN0YW5jZS5vdXRwdXRzLnBhc3N3b3JkIH19JwogIHB1YmxpY19pcDoKICAgIHZhbHVlOiAne3sgLmdyYWlucy5jcmVhdGUtZWMyLWluc3RhbmNlLm91dHB1dHMucHVibGljX2lwIH19JwpncmFpbnM6CiAgY3JlYXRlLWVjMi1pbnN0YW5jZToKICAgIGtpbmQ6IHRlcnJhZm9ybQogICAgc3BlYzoKICAgICAgc291cmNlOgogICAgICAgIHN0b3JlOiB0ZXN0LXNwZWMyLXB1YmxpYwogICAgICAgIHBhdGg6IHRlcnJhZm9ybS9jcmVhdGUtZWMyLWluc3RhbmNlCiAgICAgIGhvc3Q6CiAgICAgICMgRXhlY3V0aW9uIEhvc3QgLSB0aGUgcGxhdGZvcm0gd2hlcmUgdGhlIGFzc2V0IGV4ZWN1dGFibGUgd2lsbCBydW4uCiAgICAgICMgRm9yIGV4YW1wbGUsIGEgS3ViZXJuZXRlcyBjbHVzdGVyIGNhbiBiZSB1c2VkIGFzIGFuIGV4ZWN1dGlvbiBob3N0LgogICAgICAgIG5hbWU6ICd7eyAuaW5wdXRzLmhvc3RfbmFtZSB9fScKICAgICAgICAjIEEgc2VydmljZSBhY2NvdW50IGFubm90YXRlZCB3aXRoIGEgcm9sZSBBUk4gd2l0aCBwZXJtaXNzaW9ucyB0byBydW4gdGhlIGFzc2V0CiAgICAgICAgIyBzZXJ2aWNlLWFjY291bnQ6IDxzZXJ2aWNlLWFjY291bnQtbmFtZT4KICAgICAgaW5wdXRzOgogICAgICAtIGFtaTogJ3t7IC5pbnB1dHMuYW1pIH19JwogICAgICAtIGluc3RhbmNlX3R5cGU6ICd7eyAuaW5wdXRzLmluc3RhbmNlX3R5cGUgfX0nCiAgICAgICMgVGhlIGVudmlyb25tZW50IHZhcmlhYmxlcyBkZWNsYXJlZCBpbiB0aGlzIHNlY3Rpb24gd2lsbCBiZSBhdmFpbGFibGUgZHVyaW5nIHRoZSBncmFpbiBkZXBsb3ltZW50IGFzIHdlbGwgYXMgdGhlIGdyYWluIGRlc3Ryb3kgcGhhc2UKICAgICAgIyBlbnYtdmFyczoKICAgICAgIyAtIFZBUl9OQU1FOiB2YXIgdmFsdWUKICAgICAgZW52LXZhcnM6IAogICAgICAgIC0gQVdTX0FDQ0VTU19LRVlfSUQ6ICd7eyBwYXJhbXMuYWNjZXNzS2V5fX0nCiAgICAgICAgLSBBV1NfU0VDUkVUX0FDQ0VTU19LRVk6ICd7eyBwYXJhbXMuU2VjcmV0S2V5IH19JwogICAgICAgIC0gQVdTX1NFU1NJT05fVE9LRU46ICd7eyBwYXJhbXMuVG9rZW4gfX0nCiAgICAgIG91dHB1dHM6CiAgICAgIC0gcGFzc3dvcmQKICAgICAgLSBwdWJsaWNfaXAKICAgICMgVGhlIHRlcnJhZm9ybSB2ZXJzaW9uIHRoYXQgd2lsbCBiZSB1c2VkIHRvIGRlcGxveSB0aGUgbW9kdWxlCiAgICB0Zi12ZXJzaW9uOiAxLjMuNgo="
const emptyBPName = ""
const emptyBPRaw = ""
let session


test.describe.serial('Validate Blueprint tests', () => {
    test.beforeAll(async () => {
       
        session = await getSessionAPI(user, password, baseURL, account);
        console.log(session)

    });

    test("validate status is 200 with error on blueprint", async () => {
        const validateBlueprint = await validateBlueprintAPI(session, baseURL, space, BPName, wrongBlueprintRaw) 
        const response = await validateBlueprint.text()
        console.log(response)
        expect(validateBlueprint.status).toBe(200)
        console.log("response status is " + validateBlueprint.status)
        expect(response).toContain('"Blueprint input \'ami\' contains an illegal input type: \'number\', Valid types are \'string\', \'execution-host\', \'agent\'"')
        
    })

    test("validate status is 200 with no error on blueprint", async () => {
        const validateBlueprint = await validateBlueprintAPI(session, baseURL, space, BPName, blueprintRaw) 
        const response = await validateBlueprint.text()
        console.log(response)
        expect(validateBlueprint.status).toBe(200)
        console.log("response status is " + validateBlueprint.status)
        expect(response).toContain('{\"errors\":[]}')
        
    })

    test("validate status is 404 ", async () => {
        const validateBlueprint = await validateBlueprintAPI(session, baseURL, wrongSpace, BPName, blueprintRaw) 
        const response = await validateBlueprint.text()
        console.log(response)
        expect(validateBlueprint.status).toBe(404)
        console.log("response status is " + validateBlueprint.status)
        expect(response).toContain('"Space not found"')
        
    })

    test("validate status is 422 ", async () => {
        const validateBlueprint = await validateBlueprintAPI(session, baseURL, space, emptyBPName, emptyBPRaw) 
        const response = await validateBlueprint.text()
        console.log(response)
        expect(validateBlueprint.status).toBe(422)
        console.log("response status is " + validateBlueprint.status)
        expect(response).toContain('"Empty parameter"')
        
    })

})