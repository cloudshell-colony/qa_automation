import crypto from "crypto";
import { expect } from "@playwright/test";
import fs from "fs";
import { exec } from "child_process";


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
    const visi = await page.isVisible('[data-test="close-modal"]', 2000);
    if (visi) {
        await page.locator('[data-test="close-modal"]').click();
    };
};

export const waitForSpaceInListToDisappear = async (page, newName) => {
    // to be used after space delete - maybe can be extended to other delete actions
    // attempt during one sec to see that space is removed from list
    let isVisi = await page.isVisible(`[data-test=space-row-${newName}]`, 500)
    let i = 0;
    while (i < 20) {
        i++;
        if (await isVisi) {
            await page.waitForTimeout(50);
            isVisi = await page.isVisible(`[data-test=space-row-${newName}]`, 500)
        };
    };
};

export const executeCLIcommand = async (command) => {
    console.log('starting to apply the execution host yaml file');
    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.log(`error: ${error.message}`);
            expect(error).toBeNull();
            return 0;
        }
        if (stderr) {
            console.log(`stderr: ${stderr}`);
            expect(error).toBeNull();
            return 0;
        }
        console.log(`stdout: ${stdout}`);
        console.log('should have now active execution host');
        return 1;
    });
};

export const overwriteAndSaveToFile = async (fielName, fileContent) => {
    fs.writeFile(fielName, fileContent, function (err) {
        if (err) throw err;
        console.log(`${fielName} was saved`);
    });
};