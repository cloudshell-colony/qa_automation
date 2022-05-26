const {fillInput, clickButton, waitForElement} = require("./selectors");


module.exports = async(page, user, password) => {
    await page.goto(`https://asaf.qtorque.io/login`);
    await waitForElement(page, `login-with-email`);
    await clickButton(page, `login-with-email`);
    await waitForElement(page, `email`);
    await fillInput(page, `email`, user);
    await fillInput(page, `password`, password);
    await clickButton(page, `submit`);
    await clickButton(page, "close-launch-sample-modal");
};