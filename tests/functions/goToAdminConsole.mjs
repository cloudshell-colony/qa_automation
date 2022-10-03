export default async (page, target) => {
  // await page.click("[data-test=sidebar-dropdown]");
  // await page.click("[data-test=option__admin]");
  await page.click('[data-test="administration-console"]');
  switch (target.toLowerCase()) {
    case "cloud accounts":
      await page.click('[data-test="cloudaccounts-tab"]');
      break;
    case "spaces":
      await page.click("[data-test=space-tab]");
      await page.waitForSelector('[role=rowgroup]');
      break;
    case "users":
      await page.click('[data-test="users-tab"]');
      break;
    // case "roles":
    //   await page.click('[data-test=""]');
    //   break;
    // case "cost":
    //   await page.click('[data-test=""]');
    //   break;
    case "account":
      await page.click('[data-test="settings-tab"]');
      break;
    // case "parameters":
    //   await page.click('[data-test=""]');
    //   break;
    case "policies":
      await page.click('[data-test="policies-tab"]');
      break;
    case "tags":
      await page.click('[data-test="tags-tab"]');
      break;
    default:
      console.log(`${target} is not a valid location in admin page`);
      break;
  };
};