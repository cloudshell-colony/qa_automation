import crypto from "crypto";
import playwright from "playwright";

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