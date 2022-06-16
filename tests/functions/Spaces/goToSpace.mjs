import {clickButton} from '../selectors.mjs';
export default async (page, spaceName) => {
    await page.click("div[data-test=sidebar-dropdown]");
    await clickButton(page, `option__${spaceName}`);
};