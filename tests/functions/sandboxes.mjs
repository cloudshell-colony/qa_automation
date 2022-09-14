import { expect } from "@playwright/test";
import { goToSpace } from "./spaces.mjs";

export const startSampleSandbox = async (page, sandboxFullName) => {
  // starts a sample sandbox from the "sample sandbox launcher"
  // suppoert all three out of the box sample blueprint
  await page.click(`[data-test="launch-\[Sample\]${sandboxFullName}"]`);
  await page.locator('[data-test="wizard-next-button"]').click();
  await page.waitForSelector('[data-test="sandbox-info-column"]');
};

export const validateSBisActive = async (page) => {

  await page.waitForSelector('[data-test="sandbox-info-column"] div:has-text("StatusActive")', { timeout: 5 * 60 * 1000 });
  expect(await page.isVisible('[data-test="sandbox-info-column"] div:has-text("StatusActive")', 500)).toBeTruthy();
  await page.click('[data-test="open-logs"]');
  // const logTable = await page.locator('tr');
  // for (let i = 0; i < logTable.length; i++) {
  //   console.log(`i index number is ${i} and should reach ${logTable.length}`);
  //   await expect(logTable[i]).toContainText(/ComplMMMMMeted/);
  //   await expect(logTable[i]).toContainText(/Started/);
  //   let rowText = logTable[i];
  //   console.log(`validated row ${i} is active and contains ${rowText}`);
  // };
  // await page.pause();


  // const items = await page.locator('[data-test="grain-kind-indicator"]');
  // for (let i = 0; i < await items.count(); i++) {
  //   await items.nth(i).click();
  // }
  const prepare = await page.locator('td:has-text("Prepare")');
  const install = await page.locator('td:has-text("Install")');
  const apply = await page.locator('td:has-text("Apply")');
  for (let i = 0; i < await prepare.count(); i++) {
    await expect(prepare.nth(i)).toContainText(/Completed/);
    console.log("found Completed prepare");
  };
  for (let i = 0; i < await install.count(); i++) {
    await expect(install.nth(i)).toContainText(/Completed/)
    console.log("found Completed install");
  };
  for (let i = 0; i < await apply.count(); i++) {
    await expect(apply.nth(i)).toContainText(/Completed/)
    console.log("found Completed apply");
  };
};

export const validateS3BucketWasCreatedInSB = async (page, bucketName) => {
  // await page.click('text=/ApplyCompleted/');
  await page.click(`[data-test=event-name]:has-text("Apply")`);
  const applyResultedText = await page.locator('[data-test="log-block"]');
  // expect(applyResultedText).toContainText(`s3_bucket_arn = "arn:aws:s3:::${bucketName}`, { timeout: 120 * 1000 });
  expect(applyResultedText).toContainText(`s3_bucket_arn = "arn:aws:s3:::${bucketName}`);
  console.log(`validated bucket arn is arn:aws:s3:::${bucketName}`);
};

export const goToSandbox = async (page, sandboxName) => {
  await goToSpace(page, "Sample");
  await page.click("[data-test=sandboxes-nav-link]");
  await page.click(`tr:has-text("${sandboxName}")`);
};

export const endSandbox = async (page) => {
  //end sandbox from sandbox detals page (not from sandbox list)
  await page.click("[data-test=end-sandbox]");
  await page.click("[data-test=confirm-end-sandbox]");
};

export const endSandboxValidation = async (page, sandboxName) => {
  try {
    await page.click(`[data-toggle=true]`); //Need UI to add data-test for this button
  }
  catch { }
  await page.click(`tr:has-text("${sandboxName}")`);
  await page.waitForSelector("[data-test=sandbox-page-content]");
  await page.waitForSelector('[data-test="sandbox-info-column"] div:has-text("Ended")', { timeout: 5 * 60 * 1000 });
  await page.click('[data-test="open-logs"]');
  const destroy = await page.locator('td:has-text("Destroy")');
  const uninstall = await page.locator('td:has-text("Uninstall")');
  for (let i = 0; i < await destroy.count(); i++) {
    await expect(destroy.nth(i), "Destroy did not complete properly").toContainText(/Completed/);
    console.log("found Completed destroy");
  };
  for (let i = 0; i < await uninstall.count(); i++) {
    await expect(uninstall.nth(i), "Uninstall did not complete properly").toContainText(/Completed/);
    console.log("found Completed uninstall");
  };
};

export const validateAllSBCompleted = async (page) => {
  let visi = await page.isVisible(`tr:has-text("Active")`, { has: page.locator("data-testid=moreMenu") });
  if (await visi) {
    console.log("active SBs");
  }
  for (let index = 0; index < 4; index++) {
    visi = await page.isVisible(`tr:has-text("Terminating")`, { has: page.locator("data-testid=moreMenu") });
    if (await visi) {
      await page.waitForTimeout(30 * 1000);
    } else {
      break;
    }
  }
  visi = await page.isVisible(`tr:has-text("Terminating")`, { has: page.locator("data-testid=moreMenu") });
  if (await visi) {
    expect(visi, "we have a problem, SB are not completed after two minutes").toBeFalsy();
  }
};

export const goToSandboxListPage = async (page) => {
  await page.click('[data-test="sandboxes-nav-link"]');
};
