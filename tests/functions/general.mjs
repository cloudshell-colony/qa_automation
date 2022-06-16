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


export default generateSecret;
// console.log(`testing my secret generator ${generateSecret("abc", "dcd")}`);

export const initTest = (browserType) => async () => {
    global.browser = await playwright[process.env.TEST_BROWSER || browserType].launch({
        headless: !!process.env.HEADLESS,
    });
    const context = await global.browser.newContext();
    // setting global so we can access the page instance in our custom test Environment
    global.page = await context.newPage();
    await global.page.setViewportSize({ width: 1584, height: 864 });
};

export const cleanUpTest = async() => await global.browser.close();

export function randomString(length) {
    const chars = "0123456789abcdefghijklmnopqrstuvwxyz";
    var result = '';
    for (var i = length; i > 0; --i) result += chars[Math.floor(Math.random() * chars.length)];
    return result;
}
