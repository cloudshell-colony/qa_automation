import { expect } from "@playwright/test";
import { goToSpace } from "./spaces.mjs";

export const startSampleSandbox = async (page, sandbox) => {
  // starts a sample sandbox from the "sample sandbox launcher"
  // suppoert all three out of the box sample blueprint
  // select BP by passing "Bitnami", "MySql" or "Helm"
  switch (sandbox.toLowerCase()) {
    case "helm":
      await page.click('[data-test="launch-\[Sample\]Helm Application with MySql and S3 Deployed by Terraform"]');
      break;
    case "mysql":
      await page.click('[data-test="launch-\[Sample\]MySql Terraform Module"]');
      break;
    case "bitnami":
      await page.click('[data-test="launch-[Sample]Bitnami Nginx Helm Chart"]');
      await page.locator('[data-test="inputs\.replicaCount"]').fill("22");
      break;
    default:
      console.log("invalid sample sandbox name");
      break;
  }
  await page.locator('[data-test="wizard-next-button"]').click();
  await page.waitForSelector('[data-test="sandbox-info-column"]');
};

export const validateSBisActive = async (page) => {
  await page.waitForSelector('[data-test="sandbox-info-column"] div:has-text("Sandbox StatusActive")', { timeout: 120000 });
  expect(await page.isVisible('[data-test="sandbox-info-column"] div:has-text("Sandbox StatusActive")', 500)).toBeTruthy();
  const items = await page.locator('[data-test="grain-kind-indicator"]');
  for (let i = 0; i < await items.count(); i++) {
    await items.nth(i).click();
  }
  const prepare = await page.locator('text=/PrepareCompleted/');
  const install = await page.locator('text=/InstallCompleted/');
  const apply = await page.locator('text=/ApplyCompleted/');
  for (let i = 0; i < await prepare.count(); i++) {
    expect(prepare.nth(i)).toContainText(/Completed/);
    console.log("found Completed prepare");
  };
  for (let i = 0; i < await install.count(); i++) {
    expect(install.nth(i)).toContainText(/Completed/)
    console.log("found Completed install");
  };
  for (let i = 0; i < await apply.count(); i++) {
    expect(apply.nth(i)).toContainText(/Completed/)
    console.log("found Completed apply");
  };
};

export const validateS3BucketWasCreatedInSB = async (page, bucketName) => {
  await page.click('text=/ApplyCompleted/');
  const applyResultedText = await page.locator('[data-test="log-block"]');
  expect(applyResultedText).toContainText(`s3_bucket_arn = "arn:aws:s3:::${bucketName}`, { timeout: 120 * 1000 });
};

export const goToSandbox = async (page, sandboxName) => {
  await goToSpace(page, "Sample");
  await page.click("[data-test=sandboxes-nav-link]");
  await page.click(`tr:has-text("${sandboxName}")`);
};

export const endSandbox = async (page) => {
  //end sandbox from sandbox detals page (not from sandbox list)
  // end sandbox from the sandbox detailed view page - NOT from list.
  await page.click("[data-test=end-sandbox]");
  page.click("[data-test=confirm-end-sandbox]");
  await page.waitForNavigation();
};

export const endSandboxValidation = async (page,sandboxName) => {
await page.waitForSelector(`tr:has-text("${sandboxName}")`, { has: page.locator("data-testid=moreMenu") });
        let visi = page.isVisible(`tr:has-text("${sandboxName}")`, { has: page.locator("data-testid=moreMenu") });
        expect(await page.locator(`tr:has-text("${sandboxName}")`, { has: page.locator("data-testid=moreMenu") })).toContainText("Terminating");
        while (await visi) {
            await page.waitForTimeout(50);
            visi = page.isVisible(`tr:has-text("${sandboxName}")`);
        }
        await page.click(`[data-toggle=true]`); //Need UI to add data-test for this button
        await page.click(`tr:has-text("${sandboxName}")`);
        await page.waitForSelector("[data-test=sandbox-page-content]");
        const items = await page.locator('[data-test="grain-kind-indicator"]');
        for (let i = 0; i < await items.count(); i++) {
            await items.nth(i).click();
        }
        const destroy = await page.locator('text=/DestroyCompleted/');
        const uninstall = await page.locator('text=/UninstallCompleted/');
        for (let i = 0; i < await destroy.count(); i++) {
            expect(destroy.nth(i)).toContainText(/Completed/);
            console.log("found Completed destroy");
        };
        for (let i = 0; i < await uninstall.count(); i++) {
            expect(uninstall.nth(i)).toContainText(/Completed/);
            console.log("found Completed uninstall");
        }; 
      };

export const goToSandboxListPage = async (page, account) => {

  await page.click('[data-test="sandboxes-nav-link"]');
  // todo  
};
