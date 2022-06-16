const {clickButton} = require("./selectors.mjs");
export default async (page) => {
    await page.click("div[data-test=sidebar-dropdown]");
    await clickButton(page, "option__admin");
};