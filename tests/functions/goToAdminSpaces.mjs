export default async (page) => {
    await page.click("div[data-test=sidebar-dropdown]");
    await page.click("[data-test=option__admin]");
    await page.click("[data-test=space-tab]");
    await page.waitForSelector('[role=rowgroup]');
};