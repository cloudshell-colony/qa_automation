export default async (page) => {
    await page.pause();
    await page.click('[data-test="currently-selected-space"]');
    await page.click("[data-test=option__admin]");
    await page.click("[data-test=space-tab]");
    await page.waitForSelector('[role=rowgroup]');
};