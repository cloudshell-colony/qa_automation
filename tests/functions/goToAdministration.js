const {clickButton} = require("./selectors");
module.exports = async (page) => {
    await page.click("div[data-test=sidebar-dropdown]");
    await clickButton(page, "option__admin");
};