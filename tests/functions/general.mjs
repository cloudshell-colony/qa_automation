import crypto from "crypto";
import { expect } from "@playwright/test";
import fs from "fs";
import { exec } from "child_process";
import { goToSandboxListPage, stopAndValidateAllSBsCompleted } from "./sandboxes.mjs";
import { DeleteAcountUI } from "./accounts.mjs";
import fetch from "node-fetch";

const repProvider = process.env.repProvider;
const password = process.env.allAccountsPassword;
const mailinatorAuthorization = process.env.mailinatorAuthorization;
const mailinatorURL = process.env.mailinatorURL;
const mailIdList = [];


export const generateSecret = (email, account) => {
    let md5sum = crypto.createHash('md5');
    md5sum.update((email + account), "utf-8");
    return md5sum.digest('hex').toUpperCase();
};

export const addCaptchaBypass = async (page) => {
    await page.evaluate(() => {
        localStorage.setItem("captchaToken", "myCaptchaToken");
    });
    const url = await page.url();
    await page.goto(url);
};

export function randomString(length) {
    const chars = "0123456789abcdefghijklmnopqrstuvwxyz";
    var result = '';
    for (var i = length; i > 0; --i) result += chars[Math.floor(Math.random() * chars.length)];
    return result;
};

export const closeModal = async (page) => {
    // check if a modal is open and closes it
    // modal screen include: sample BP launcher, create Execution Host, create Space, Repository Information,
    const visi = await page.isVisible('[data-test="close-modal"]', 1000);
    if (visi) {
        await page.locator('[data-test="close-modal"]').click();
    };
    const visi2 = await page.isVisible('[data-test="submit"]', 1000);
    if (visi2) {
        await page.locator('[data-test="submit"]').click();
    };
    //close annoying chat button if we are in production
    try {
        await page.frameLocator('[title="chat widget"]').locator('[aria-label="Dismiss"]', 1000).click({ timeout: 1000 });
    }
    catch { };
};

export const waitForSpaceInListToDisappear = async (page, newName) => {
    // to be used after space delete - maybe can be extended to other delete actions
    // attempt during 10 seconds to see that space is removed from list
    let isVisi = await page.isVisible(`[data-test=space-row-${newName}]`, 500)
    let i = 0;
    while (i < 20) {
        i++;
        if (await isVisi) {
            await page.waitForTimeout(500);
            isVisi = await page.isVisible(`[data-test=space-row-${newName}]`, 500)
        };
    };
    if (isVisi) {
        console.log('Sandbox is still in the list after 10 seconds');
    }
};

export const executeCLIcommand = async (command) => {
    console.log('running the following CLI command: ' + command);
    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.log(`error: ${error.message}`);
            expect(error).toBeNull();
            return 0;
        }
        if (stderr) {
            console.log(`stderr: ${stderr}`);
        }
        console.log(`stdout: ${stdout}`);
        return 1;
    });
};

export const overwriteAndSaveToFile = async (fielName, fileContent) => {
    fs.writeFile(fielName, fileContent, function (err) {
        if (err) throw err;
        console.log(`${fielName} was saved`);
    });
};

export const pressOptionFromCommonTable = async (page, rowIdentifier, optionSelector = "edit-more-menu-option") => {
    // allow selection of space from more-menu in the execusion hosts page
    const moreMenuOptionsSelector = `[data-test=${rowIdentifier}] [data-testid=moreMenu]`;
    await page.click(moreMenuOptionsSelector);
    const optionToSelect = `${moreMenuOptionsSelector} [data-test="${optionSelector}"]`;
    await page.click(optionToSelect);
};

export const validateAPIResponseis200 = async (response) => {
    if (response.status != 200) {
        // console.log(`response error is: ${await response.text()}`);
        console.log(await response.json());
        expect(response.status).toBe(200);
        expect(response.ok).toBeTruthy();
    } else {
        expect(response.status).toBe(200);
        expect(response.ok).toBeTruthy();
    }
};

export const selectFromDropbox = async (page, name, text = "") => {
    await page.click(`[class~="select-${name}"]`);
    await page.type(`[class~="select-${name}"]`, text);
    await page.keyboard.press("Enter");
};

export const afterTestCleanup = async (page, accountName, baseURL, spaceName, executionHostName = "enter real if needed") => {
    // execution host is not mandatory, and should be used only when execution host is created during the test
    console.log(`stopping all Sbs after test complteted in space ${spaceName}`);
    await page.goto(`${baseURL}/${spaceName}`);
    //await goToSandboxListPage(page);
    await stopAndValidateAllSBsCompleted(page);
    console.log(`Delete account "${accountName}", as part of test cleanup`);
    await DeleteAcountUI(accountName, page, baseURL);
    await page.close();
    // delete execution host
    if (executionHostName !== "enter real if needed") {
        console.log(`deleting the trwo namespaces containing ${executionHostName}`);
        await executeCLIcommand(`sh cleanEHosts.sh ${executionHostName}`);
    };
};

export const getMailsFromMailinator = async () => {
    const endpoint = "domains/private/inboxes/qualiqa?limit=4&sort=descending"
    const mailList = await fetch(`${mailinatorURL}${endpoint}`, {
        "method": "GET",
        "headers": {
            'Authorization': mailinatorAuthorization,
            'Content-Type': 'application/json'
        }
    });
    await validateAPIResponseis200(mailList)
    const mailListJson = await mailList.json();
    for (let mail in await mailListJson.msgs) {
        if (mailListJson.msgs[mail].subject.includes("verify")) {
            mailIdList.push(mailListJson.msgs[mail].id);
        }
    }
    return mailIdList;
};

export const getEmailBodyFromMailinator = async (mailId) => {
    const endpoint = `domains/private/inboxes/qualiqa/messages/${mailId}`
    const mailBody = await fetch(`${mailinatorURL}${endpoint}`, {
        "method": "GET",
        "headers": {
            'Authorization': mailinatorAuthorization,
            'Content-Type': 'application/json'
        }
    });
    const mailBodyJson = await mailBody.json();
    const body = await mailBodyJson.parts[0].body;
    return body;
};

export const getSingleCodeFromEmailBody = async (body) => {
    let index = body.indexOf("Verification code:");
    let endIndex = body.indexOf("\n", index);
    const code = body.slice(index + ("Verification code: ").length, endIndex);
    // index = codeLine.indexOf(": ");
    // console.log(codeLine.slice(index + 2));
    return code;
};

export const getCodesListFromMailinator = async () => {
    const mailIdList = await getMailsFromMailinator();
    const idList = [];
    for (let i = 0; i < mailIdList.length; i++) {
        const body = await getEmailBodyFromMailinator(mailIdList[i]);
        const code = await getSingleCodeFromEmailBody(body);
        idList.push(code);
    }
    return idList;
};

export const openFromChecklist = async (page, whatToOpen) => {
    const pleaseOpen = `data-test="checklist-item-${whatToOpen}"`;
    await page.click(`[${pleaseOpen}]`);
};