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
}

export const waitForElementToDisappear = async (page, selector) => {
    await page.waitForFunction((selector) => !document.querySelector(`[data-test=${selector}]`), selector);
};
