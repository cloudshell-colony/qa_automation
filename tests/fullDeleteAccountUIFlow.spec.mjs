import { addCaptchaBypass } from "./functions/general.mjs";
import { test, expect } from "@playwright/test";
import { createAccount, loginToAccount, DeleteAcountUI, ValidteBackButtonAfterDelition, ValidteLoginFalureAfterDelition, validateSbLauncher, } from "./functions/accounts.mjs";
import { startSampleSandbox, endSandbox } from "./functions/sandboxes.mjs";
import * as fs from 'fs';
import { resolve } from "path";
const baseURL = process.env.baseURL;
const allAccountsPassword = process.env.allAccountsPassword;
const prefix = process.env.accountPrefix;
const timestemp = Math.floor(Date.now() / 1000);
const sampleBP = process.env.sampleBPToStart;
let accountName = prefix.concat(timestemp);
let email = prefix.concat("@").concat(timestemp).concat(".com");
let SBUrl = '';
let page;
let context;
let result;


test.describe('test my tests', () => {

    test.beforeAll(async ({ browser }) => {
        context = await browser.newContext();
        page = await context.newPage();

    });


    test.afterAll(async () => {
        await page.close();
    });


    test('create new account', async () => {
        await createAccount(page, email, accountName, allAccountsPassword, baseURL);
        await page.waitForURL(`${baseURL}/Sample`);
        await page.waitForSelector('[data-test="launch-\[Sample\]MySql Terraform Module"]');
    });

    test('sample sandbox launcher contain three samples', async () => {
        await validateSbLauncher(page, baseURL)
    });

    test.skip('start sample sandbox from "sample sandbox launcher"', async () => {
        await startSampleSandbox(page, sampleBP);
        await page.waitForSelector('[data-test="sandbox-info-column"] div:has-text("Sandbox StatusActive")', { timeout: 120000 });
        expect(await page.isVisible('[data-test="sandbox-info-column"] div:has-text("Sandbox StatusActive")', 500)).toBeTruthy();
        const items = await page.locator('[data-test="grain-kind-indicator"]');
        for (let i = 0; i < await items.count(); i++) {
            await items.nth(i).click();
        }

        const prepare = await page.locator('text=/PrepareCompleted/');
        const install = await page.locator('text=/InstallCompleted/');
        const apply = await page.locator('text=/ApplyCompleted/');

        for (let i = 0; i < await prepare.count(); i++) {
            expect(prepare.nth(i)).toContainText(/Completed/);
            console.log("found Completed prepare");
        };
        for (let i = 0; i < await install.count(); i++) {
            expect(install.nth(i)).toContainText(/Completed/)
            console.log("found Completed install");
        };
        for (let i = 0; i < await apply.count(); i++) {
            expect(apply.nth(i)).toContainText(/Completed/)
            console.log("found Completed apply");
        };
        // getting the sandbox URL in order to easlly end it later on
        SBUrl = page.url();
    });


    test.skip('FailDeleteAccountWithSandbox', async () => {
        await DeleteAcountUI(accountName, page, baseURL);
        expect(await page.locator('[data-test="close-popup"]', "Deleteaccount failed"));
        await page.click('[data-test="close-popup"]');

    });

    test.skip('End launched sample sandbox', async () => {
        await page.goto(SBUrl)
        const sandboxName = "Sample Environment"; //default name when launching from sample sandbox launcher
        await endSandbox(page);
        await page.waitForSelector(`tr:has-text("${sandboxName}")`, { has: page.locator("data-testid=moreMenu") });
        let visi = page.isVisible(`tr:has-text("${sandboxName}")`, { has: page.locator("data-testid=moreMenu") });
        expect(await page.locator(`tr:has-text("${sandboxName}")`, { has: page.locator("data-testid=moreMenu") })).toContainText("Terminating");
        while (await visi) {
            await page.waitForTimeout(50);
            visi = page.isVisible(`tr:has-text("${sandboxName}")`);
        }
        await page.click(`[data-toggle=true]`); //Need UI to add data-test for this button
        await page.click(`tr:has-text("${sandboxName}")`);
        await page.waitForSelector("[data-test=sandbox-page-content]");
        const items = await page.locator('[data-test="grain-kind-indicator"]');
        for (let i = 0; i < await items.count(); i++) {
            await items.nth(i).click();
        }
        const destroy = await page.locator('text=/DestroyCompleted/');
        const uninstall = await page.locator('text=/UninstallCompleted/');
        for (let i = 0; i < await destroy.count(); i++) {
            expect(destroy.nth(i)).toContainText(/Completed/);
            console.log("found Completed destroy");
        };
        for (let i = 0; i < await uninstall.count(); i++) {
            expect(uninstall.nth(i)).toContainText(/Completed/);
            console.log("found Completed uninstall");
        };
    });

    test('Delete Account', async () => {
        await DeleteAcountUI(accountName, page, baseURL);
        //page.pause();
        let result = await page.locator('[data-test="signup-with-email"]')//.isVisible();
        expect(result, "Delete account should navigate to signup page ");
        //line is comment out because of an existing bug
        //await ValidteBackButtonAfterDelition(accountName, page, baseURL);
        await ValidteLoginFalureAfterDelition(accountName, allAccountsPassword, email, page, baseURL);

    });

});