const {clickButton} = require("../selectors");
module.exports = async (page, spaceName) => {
    await page.click("div[data-test=sidebar-dropdown]");
    await clickButton(page, `option__${spaceName}`);
};