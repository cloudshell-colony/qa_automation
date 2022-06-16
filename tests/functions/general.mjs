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

// console.log(`testing my secret generator ${generateSecret("abc", "dcd")}`);