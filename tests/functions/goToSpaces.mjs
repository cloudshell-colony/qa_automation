import {clickButton} from './selectors.mjs';
export default async (page) => {
    await page.click("div[data-test=sidebar-dropdown]");
    await clickButton(page, "option__admin");
    await clickButton(page, "space-tab");
    await page.waitForSelector('[role=rowgroup]');
};