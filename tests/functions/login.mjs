export default async (page, user, password, account) => {
    await page.goto(`https://preview.qtorque.io/login`);
    await page.waitForSelector(`[data-test=subdomain]`);
    await page.fill(`[data-test=subdomain]`, account);
    await page.click(`[data-test=submit]`);
    await page.waitForSelector(`[data-test=login-with-email]`);
    await page.click(`[data-test=login-with-email]`);
    await page.waitForSelector(`[data-test=email]`);
    await page.fill(`[data-test=email]`, user);
    await page.fill(`[data-test=password]`, password);
    await page.click(`[data-test=submit]`);
    await page.click(`[data-test=close-modal]`);
};