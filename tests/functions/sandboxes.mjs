import { expect } from "@playwright/test";
import { goToSpace } from "./spaces.mjs";
import fetch from "node-fetch";


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
  expect(await page.isVisible('[data-test="sandbox-info-column"] div:has-text("StatusActive With Error")', 500), "Sandbox is Active with error!").toBeFalsy();
  await page.click('[data-test="open-logs"]');
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

export const stopAndValidateAllSBsCompleted = async (page) => {
  const waitTimeInSec = 15;
  const loopsToWait = 16;
  let LaunchingSB = await page.isVisible(`td:has-text("Launching")`);
  if (await LaunchingSB) {
    console.log("Found sandboxes in Launching state");
    for (let index = 0; index < loopsToWait; index++) {
      console.log(`Waiting for SBs to be active, witing for the ${index + 1} time, max number of wait loops is ${loopsToWait}, each for ${waitTimeInSec} seconds`);
      LaunchingSB = await page.isVisible(`tr:has-text("Launching")`);
      if (await LaunchingSB) {
        await page.waitForTimeout(waitTimeInSec * 1000);
      } else {
        break;
      }
    }
  }

  let activeSB = await page.locator(`td:has-text("Active")`);
  const loops = await activeSB.count();
  console.log(`there are ${loops} active sandboxes to stop`);
  for (let i = 0; i < loops; i++) {
    console.log(`Stopping the ${i + 1} sandbox from ${loops}`);
    await page.locator(`tr:has-text("Active")`, { has: page.locator("data-testid=moreMenu") }).first().click();
    await page.click('[data-test="end-sandbox"]');
    await page.click('[data-test="confirm-end-sandbox"]');
  };
  await page.waitForTimeout(1000);
  let TerminatingSB = await page.isVisible(`td:has-text("Terminating")`);
  if (await TerminatingSB) {
    console.log("found sandboxes in Terminating state");
    for (let index = 0; index < loopsToWait; index++) {
      console.log(`Waiting for SBs to end, witing for the ${index + 1} time, max number of wait loops is ${loopsToWait}, each for ${waitTimeInSec} seconds`);
      TerminatingSB = await page.isVisible(`tr:has-text("Terminating")`);
      if (await TerminatingSB) {
        await page.waitForTimeout(waitTimeInSec * 1000);
      } else {
        break;
      }
    }
  }
  // printing error logs if end SB faild
  let visiTerminating = await page.isVisible(`td:has-text("Terminating")`);
  expect(await visiTerminating, "We have a problem, SB ware not completed").toBeFalsy();
  let visiActive = await page.isVisible(`td:has-text("Active")`);
  expect(await visiActive, "We have a problem, we still have active sandboxes").toBeFalsy();
  let visiLaunching = await page.isVisible(`td:has-text("Launching")`);
  expect(await visiActive, "We have a problem, we still have launching sandboxes").toBeFalsy();

};

export const goToSandboxListPage = async (page) => {
  await page.click('[data-test="sandboxes-nav-link"]');
};

export const getSandboxDetailsAPI = async(session, baseURL, spaceName, sandboxId) => {
  const response = await fetch(`${baseURL}/api/spaces/${spaceName}/environments/${sandboxId}`, {
    "method": "GET",
    "headers": {
        'Authorization': `Bearer ${session}`,
        'Content-Type': 'application/json',
    }
  });
  return response;
}

const validateSBStatusWrapperAPI = async (session, baseURL, sandboxId, space, status) => {
  let sandboxInfo, state, sandboxJson;
  console.log(`Waiting for sandbox status to be '${status}'`)
  //wait for ~4 minutes until sandbox status is active/ended
  for(let i=0; i<2*60; i++){
    sandboxInfo = await getSandboxDetailsAPI(session, baseURL, space, sandboxId);
    sandboxJson = await sandboxInfo.json();
    state = await sandboxJson.details.computed_status;
    if(state.includes(status)){
      break;
    }
    await new Promise(r => setTimeout(r, 2000)); //wait for 2 seconds
  }
  expect(state,`"Sandbox status is not '${status}' after 3 minutes. Sandbox info: \n` +  sandboxJson).toBe(status);
  console.log(`Sandbox status is '${status}'`)
  let stages = sandboxJson['details']['state']['grains'][0]['state']['stages'];
  for (var type in stages){
    let stage = stages[type];
    if((stage.name === 'Apply' && status === 'Active') || (stage.name === 'Destroy' && status === 'Ended')){
      for (var index in stage['activities']){
        //check all activities ended with a valid status
        let action = stage['activities'][index]
        expect(['Done', 'Skipped']).toContain(action.status);
        console.log(`${action.name} ended with status '${action.status}'`);
      }
    }
  }
}

export const validateSBisActiveAPI = async(session, baseURL, sandboxId, space) =>{
  await validateSBStatusWrapperAPI(session, baseURL, sandboxId, space, 'Active');
}

export const validateSBisEndedAPI = async(session, baseURL, sandboxId, space) =>{
  await validateSBStatusWrapperAPI(session, baseURL, sandboxId, space, 'Ended');
}

export const endSandboxAPI = async(session, baseURL, spaceName, sandboxId) => {
  const response = await fetch(`${baseURL}/api/spaces/${spaceName}/environments/${sandboxId}`, {
    "method": "DELETE",
    "headers": {
        'Authorization': `Bearer ${session}`,
        'Content-Type': 'application/json',
    }
  });
  return response;
}