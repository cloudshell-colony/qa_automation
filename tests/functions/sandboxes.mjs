
export const startSampleSandboxBitnami = async ( page ) => {
    await page.click('[data-test="launch-[Sample]Bitnami Nginx Helm Chart"]');
    await page.locator('[data-test="inputs\.replicaCount"]').fill("2");
    await page.locator('[data-test="wizard-next-button"]').click();
    await page.waitForSelector('[data-test="sandbox-info-column"]');
    await page.locator('[data-test="grain-kind-indicator"]').click();
    await page.waitForSelector('[data-test="sandbox-info-column"] div:has-text("Sandbox StatusActive")');
};