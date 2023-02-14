import { addCaptchaBypass, closeModal, generateUniqueId, openAndPinSideMenu, openFromChecklist } from "./functions/general.mjs";
import { test, expect } from "@playwright/test";
import { createAccount, loginToAccount, DeleteAcountUI, ValidteBackButtonAfterDelition, ValidteLoginFalureAfterDelition, validateSbLauncher, getSessionAPI, validateGetSessionAPI, deleteAccountAPI, } from "./functions/accounts.mjs";
import { startSampleSandbox, endSandbox, validateSBisActive, endSandboxValidation } from "./functions/sandboxes.mjs";
import * as fs from 'fs';
import { resolve } from "path";


const baseURL = process.env.baseURL;
const allAccountsPassword = process.env.allAccountsPassword;
const prefix = process.env.accountPrefix;
const timestemp = Math.floor(Date.now() / 1000);
const id = timestemp.toString().concat('-' + generateUniqueId());
const sampleBP = process.env.sampleBPToStart;
const firstName = "FN.".concat(prefix).concat(timestemp);
const lastName = "LN.".concat(prefix).concat(timestemp);
const companyName = "Company.".concat(prefix).concat(timestemp);
let accountName = prefix.concat(id);
let email = prefix.concat("@").concat(id).concat(".com");
let SBUrl = '';
let page;
let context;
let session;


test.describe.serial('Delete account UI', () => {

    test.beforeAll(async ({ browser }) => {
        context = await browser.newContext();
        page = await context.newPage();

    });


    test.afterAll(async () => {
        await page.close();
        await deleteAccountAPI(baseURL, accountName, session);
    });


    test('create new account', async () => {
        await createAccount(page, firstName, lastName, companyName, email, accountName, allAccountsPassword, baseURL);
        await page.waitForURL(`${baseURL}/Sample`, { timeout: 3 * 60 * 1000 });
        await closeModal(page);
        await openAndPinSideMenu(page);
        session = await getSessionAPI(email, allAccountsPassword, baseURL, accountName);
        await validateGetSessionAPI(session);
    });

    test('sample sandbox launcher contain three samples', async () => {
        await openFromChecklist(page, "launched_environment");
        await validateSbLauncher(page, baseURL)
    });

    test('start sample sandbox from "sample sandbox launcher"', async () => {
        await startSampleSandbox(page, sampleBP);
        await validateSBisActive(page)
        SBUrl = page.url();
    });


    test.skip('FailDeleteAccountWithSandbox', async () => {
        test.fail() //bug no 10552
        await DeleteAcountUI(accountName, page, baseURL);
        expect(await page.locator('[data-test="close-popup"]', "Deleteaccount failed"));
        await page.click('[data-test="close-popup"]');
    });

    //bug no 10552
    test.skip('End launched sample sandbox', async () => {
        await page.goto(SBUrl)
        const sandboxName = "Sample Environment"; //default name when launching from sample sandbox launcher
        await endSandbox(page);
        await endSandboxValidation(page, sandboxName);

    });

    //bug no 10552
    test.skip('Delete Account', async () => {
        await DeleteAcountUI(accountName, page, baseURL);
        expect(await page.waitForSelector('[data-test="signup-with-email"]'), "Delete account should navigate to signup page ");
        await page.goto(`${baseURL}`, { timeout: 90000 });
    });

    //Skiped till bugs no  9051,8608
    test.skip('Validate Delete Account', async () => {
        await ValidteBackButtonAfterDelition(accountName, page, baseURL);
        await ValidteLoginFalureAfterDelition(accountName, allAccountsPassword, email, page, baseURL);

    });

});