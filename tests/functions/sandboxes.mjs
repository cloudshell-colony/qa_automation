
export const startSampleSandbox = async ( page, sandbox ) => {
    // suppoer all three out of the box sample blueprint
    // select BP by passing "Bitnami", "MySql" or "Helm"
    switch (sandbox.toLowerCase()) {
        case "helm" :
          await page.click('[data-test="launch-\[Sample\]Helm Application with MySql and S3 Deployed by Terraform"]');
        break;
        case "mysql" :
          await page.click('[data-test="launch-\[Sample\]MySql Terraform Module"]');
        break;
        case "bitnami" :
          await page.click('[data-test="launch-[Sample]Bitnami Nginx Helm Chart"]');
          await page.locator('[data-test="inputs\.replicaCount"]').fill("22");
        break;
        default :
          console.log("invalid sample sandbox name");
        break;
      }
      await page.locator('[data-test="wizard-next-button"]').click();
      await page.waitForSelector('[data-test="sandbox-info-column"]');
      
};