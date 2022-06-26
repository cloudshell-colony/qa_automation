export default async (page) => {
    // await page.click("div[data-test=sidebar-dropdown]");
    await page.click("[data-test=option__admin]");
    await page.click("[data-test=space-tab]");
    await page.waitForSelector('[role=rowgroup]');
};


/*
ToDo
need to refactor as follow:
export default async (page, target) => {
    await page.click("[data-test=option__admin]");
    switch (target.toLowerCase()) {
        case "space":
            await page.click("[data-test=space-tab]");
            await page.waitForSelector('[role=rowgroup]');
          break;
        case "users":
            .
            .
            .
            break;
        default:
      console.log("invalid location in admin page");
      break;
    };
*/