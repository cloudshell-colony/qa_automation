import { expect } from "@playwright/test";
import { goToSpace } from "./spaces.mjs";
import fetch from "node-fetch";
import { selectFromDropbox } from "./general.mjs";


export const startSampleSandbox = async (page, sandboxFullName) => {
  // starts a sample sandbox from the "sample sandbox launcher"
  // suppoert all three out of the box sample blueprint
  await page.click(`[data-test="launch-\[Sample\]${sandboxFullName}"]`);
  await page.click("[data-test=go-to-next-step]");
  await page.locator('[data-test="launch-environment"]').click();
  await page.waitForSelector('[data-test="sandbox-info-column"]');
};

export const validateSBisActive = async (page) => {

  await page.waitForSelector('[data-test="sandbox-info-column"] div:has-text("StatusActive")', { timeout: 5 * 60 * 1000 });
  expect(await page.isVisible('[data-test="sandbox-info-column"] div:has-text("StatusActive")', 500)).toBeTruthy();
  expect(await page.isVisible('[data-test="sandbox-info-column"] div:has-text("StatusActive With Error")', 500), "Sandbox is Active with error!").toBeFalsy();
  await page.click('[data-test="logs-card"]');
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

export const goToSandbox = async (page, sandboxName, space = "Sample") => {
  await goToSpace(page, space);
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
    // await page.click(`[data-toggle=true]`); //Need UI to add data-test for this button
  }
  catch { }
  await page.click(`tr:has-text("${sandboxName}")`);
  await page.waitForSelector("[data-test=sandbox-page-content]");
  await page.waitForSelector('[data-test="sandbox-info-column"] div:has-text("Ended")', { timeout: 5 * 60 * 1000 });
  await page.click('[data-test="logs-card"]');
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
      console.log(`Waiting for SBs to end, waiting for the ${index + 1} time, max number of wait loops is ${loopsToWait}, each for ${waitTimeInSec} seconds`);
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
  expect(await visiLaunching, "We have a problem, we still have launching sandboxes").toBeFalsy();

};

export const stopAndValidateAllSBsCompletedAPI = async (session, baseURL, spaceName, minutesToWait = 4) => {
  const waitTimeInSec = 15;
  const loopsToWait = 4 * minutesToWait;
  const sandboxesJson = await (await getAllSandboxesAPI(session, baseURL, spaceName)).json();
  for (const sandbox of sandboxesJson) {
    console.log('Ending sandbox ' + sandbox.details.definition.metadata.name);
    await endSandboxAPI(session, baseURL, spaceName, sandbox.id);
  }
  for (let index = 0; index < loopsToWait; index++) {
    let cont = false
    let sandboxes = await (await getAllSandboxesAPI(session, baseURL, spaceName)).json();
    console.log(`Waiting for SBs to end, waiting for the ${index + 1} time, max number of wait loops is ${loopsToWait}, each for ${waitTimeInSec} seconds`);
    for (const sandboxData of sandboxes) {
      if (sandboxData.details.computed_status === 'Terminating') {
        cont = true;
        console.log('Sandbox ' + sandboxData.details.definition.metadata.name + ' is still terminating');
        break;
      }
    }
    if (!cont) {
      break
    }
    await new Promise(r => setTimeout(r, waitTimeInSec * 1000)); //wait for 15 seconds
  }
  let sandboxes = await (await getAllSandboxesAPI(session, baseURL, spaceName)).json();
  expect.soft(Object.keys(sandboxes).length, 'We have a problem, some sandboxes have not ended: \n' + JSON.stringify(sandboxes)).toBe(0)

}

export const goToSandboxListPage = async (page) => {
  await page.click('[data-test="sandboxes-nav-link"]');
};

export const getSandboxDetailsAPI = async (session, baseURL, spaceName, sandboxId) => {
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
  //wait for ~8 minutes until sandbox status is active/ended
  for (let i = 0; i < 4 * 60; i++) {
    sandboxInfo = await getSandboxDetailsAPI(session, baseURL, space, sandboxId);
    sandboxJson = await sandboxInfo.json();
    state = await sandboxJson.details.computed_status;
    if (state.includes(status)) {
      break;
    }
    await new Promise(r => setTimeout(r, 2000)); //wait for 2 seconds
  }
  expect(state, `"Sandbox status is not '${status}' after 6 minutes. Sandbox info: \n` + JSON.stringify(sandboxJson)).toBe(status);
  console.log(`Sandbox status is '${status}'`)
  // access relevant part of stages executed using the JSON structure
  let stages = sandboxJson['details']['state']['grains'][0]['state']['stages'];
  for (var type in stages) {
    let stage = stages[type];
    if ((stage.name === 'Apply' && status === 'Active') || (stage.name === 'Destroy' && status === 'Ended')) {
      for (var index in stage['activities']) {
        //check all activities ended with a valid status
        let action = stage['activities'][index]
        expect(['Done', 'Skipped']).toContain(action.status);
        console.log(`${action.name} ended with status '${action.status}'`);
      }
    }
  }
}

export const validateSBisActiveAPI = async (session, baseURL, sandboxId, space) => {
  await validateSBStatusWrapperAPI(session, baseURL, sandboxId, space, 'Active');
}

export const validateSBisEndedAPI = async (session, baseURL, sandboxId, space) => {
  await validateSBStatusWrapperAPI(session, baseURL, sandboxId, space, 'Ended');
}

export const endSandboxAPI = async (session, baseURL, spaceName, sandboxId) => {
  const response = await fetch(`${baseURL}/api/spaces/${spaceName}/environments/${sandboxId}`, {
    "method": "DELETE",
    "headers": {
      'Authorization': `Bearer ${session}`,
      'Content-Type': 'application/json',
    }
  });
  return response;
}

export const getAllSandboxesAPI = async (session, baseURL, spaceName, activeOnly = true) => {
  let apiUrl = `${baseURL}/api/spaces/${spaceName}/environments`;
  if (activeOnly) {
    apiUrl = apiUrl.concat('?active_only=true')
  }
  const response = await fetch(apiUrl, {
    "method": "GET",
    "headers": {
      'Authorization': `Bearer ${session}`,
      'Content-Type': 'application/json',
    }
  });
  return response;
}

export const getAllSpaceSandboxesAPI = async (session, baseURL, spaceName) => {
  const response = await fetch(`${baseURL}/api/spaces/${spaceName}/environments`, {
    "method": "GET",
    "headers": {
      'Authorization': `Bearer ${session}`,
      'Content-Type': 'application/json',
    }
  });
  return response;
}

/**
 * Finds all sandboxes in a given space which haven't ended yet
 * but have a status that is different than 'Active'
 * @returns A list of strings containing the relevant info for all alive sandboxes which are not active
 */
export const getNonActiveAliveSandboxesAPI = async (session, baseURL, spaceName) => {
  let badSandboxesList = [];
  const aliveSandboxes = await (await getAllSandboxesAPI(session, baseURL, spaceName)).json();
  for (const sandboxData of aliveSandboxes) {
    if (sandboxData.details.computed_status !== 'Active') {
      const sandboxDetails = await (await getSandboxDetailsAPI(session, baseURL, spaceName, sandboxData.id)).json()
      console.log('Found sandbox that is not active: ' + sandboxData.details.definition.metadata.name);
      const badSandboxInfo = { 'Name': sandboxData.details.definition.metadata.name, 'Status': sandboxData.details.computed_status, 'Errors': sandboxDetails.details.state.errors };
      badSandboxesList.push(JSON.stringify(badSandboxInfo));
    }
  }
  return badSandboxesList
}

/**
 * Waits a given amount of minutes (defaults to 6) until all sandboxes in a given space are active.
 * Will fail test if after waiting some sandboxes are still deploying
 */
export const waitForSandboxesToBeActiveAPI = async (session, baseURL, spaceName, minutesToWait = 6) => {
  console.log('Waiting for launched sandboxes to finish deploying');
  let sandboxes, cont;
  for (let index = 0; index < 12 * minutesToWait; index++) {
    cont = false
    sandboxes = await (await getAllSandboxesAPI(session, baseURL, spaceName)).json();
    for (const sandboxData of sandboxes) {
      if (sandboxData.details.state.current_state === 'deploying') {
        cont = true;
        console.log('Sandbox ' + sandboxData.details.definition.metadata.name + ' is still deploying');
        break;
      }
    }
    if (!cont) {
      break
    }
    await new Promise(r => setTimeout(r, 5000)); //wait for 5 seconds
  }
  expect(cont, 'We have a problem, some sandboxes are still launching: \n' + JSON.stringify(sandboxes)).toBeFalsy();
  console.log('All sandboxes finished launching');
}

export const ExtendSendbox = async (baseURL, space, ID, TIME, session) => {
  const response = await fetch(`${baseURL}/api/spaces/${space}/environments/${ID}/scheduled_end_time?value=${TIME}`, {
    "method": "PUT",
    "headers": {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session}`
    },
  });
  return response;
};

export const getFirstSandboxesAPI = async (session, baseURL, spaceName, count) => {
  let apiUrl = `${baseURL}/api/spaces/${spaceName}/environments?filter=my&count=${count}`;

  const response = await fetch(apiUrl, {
    "method": "GET",
    "headers": {
      'Authorization': `Bearer ${session}`,
      'Content-Type': 'application/json',
    }
  });
  return response;
}


export const driftCheckAPI = async (session, baseURL, spaceName, sandboxId, grainId) => {
  const response = fetch(`${baseURL}/api/spaces/${spaceName}/environments/${sandboxId}/driftcheck/${grainId}`, {
    "method": "POST",
    "headers": {
      'Authorization': `Bearer ${session}`,
      'Content-Type': 'application/json'
    }
  });
  return response;
}

export const reconcileDriftAPI = async (session, baseURL, spaceName, sandboxId, grainsIdList) => {
  const data = {
    "grain_ids": grainsIdList
  }
  const response = await fetch(`${baseURL}/api/spaces/${spaceName}/environments/${sandboxId}/reconcile`, {
    "method": "POST",
    "body": JSON.stringify(data),
    "headers": {
      'Authorization': `Bearer ${session}`,
      'Content-Type': 'application/json',
    }
  });
  return response;
}

/**
 * Waits up to 1 minute for a specific drift detection status in a given grain
 * @param {*} grainId ID of the grain you want to check drift status
 * @param {*} desiredStatus Boolean parameter to indicate if drift should be detected or not
 */
export const waitForDriftStatusAPI = async (session, baseURL, spaceName, sandboxId, grainId, desiredStatus = true) => {
  console.log('Waiting for drift detected status in grain to be ' + desiredStatus);
  let detectedDrift = !desiredStatus;
  let sandboxDetails;
  for (let i = 0; i < 18; i++) {
    sandboxDetails = await (await getSandboxDetailsAPI(session, baseURL, spaceName, sandboxId)).json();
    let grains = sandboxDetails.details.state.grains; // list of all sandbox grains
    for (var grain of grains) {
      if (grain.id === grainId) { // update detection status for relevant grain
        detectedDrift = grain.state.drift.deployment.detected;
        break;
      }
    }
    if (detectedDrift === desiredStatus) { // end loop if desired status was reached
      console.log(`Drift detection status in grain '${grainId}' is now ${detectedDrift}`);
      break
    }
    await new Promise(r => setTimeout(r, 5000)); //wait for 5 seconds
  }
  expect(detectedDrift, `Drift status is not ${desiredStatus} after 1 minute, sandbox details: \n` + JSON.stringify(sandboxDetails)).toBe(desiredStatus);
}

/**
 * Returns the last activity that was performed on a specific grain
 * @param {*} grainId ID of the grain you want to get activity of
 * @returns JSON Object containing the last grain activity as returned from Sandbox Details 
 */
export const getLastSandboxActivityFromGrainAPI = async (session, baseURL, spaceName, sandboxId, grainId) => {
  let sandboxDetails = await (await getSandboxDetailsAPI(session, baseURL, spaceName, sandboxId)).json();
  let lastActivity
  let grains = sandboxDetails.details.state.grains; // list of all sandbox grains
  for (var grain of grains) {
    if (grain.id === grainId) { // update detection status for relevant grain
      let stages = grain.state.stages;
      let activities = stages[stages.length - 1].activities;
      lastActivity = activities[activities.length - 1];
      return lastActivity;
    }
  }
}

/**
 * Checks current sandbox is 'Active With Error' and failed due to policy
 * @param {*} page assumes page is viewing a certain sandbox already
 * @param {*} expectedText part of text that the error includes. Should have policy specific text
 */
export const validateSandboxFailedDueToPolicy = async (page, expectedText) => {
  const regExpected = new RegExp(`${expectedText}`);
  await page.waitForSelector('[data-test="sandbox-info-column"] div:has-text("StatusActive")', { timeout: 5 * 60 * 1000 });
  expect(await page.isVisible('[data-test="sandbox-info-column"] div:has-text("StatusActive With Error")', 500), "Sandbox is Active with error!").toBeTruthy();
  await page.click('[data-test=logs-card]');
  await page.click('[data-test=event-name]:has-text("Plan Validation")');
  const logLocator = await page.locator('[data-test=log-block]');
  await expect(logLocator).toHaveText(regExpected);
}

export const addCollaboratorToSandbox = async (page, email) => {
  await page.getByText('Add').click();
  await selectFromDropbox(page, 'add_collab', email);
  await page.getByRole('button', { name: 'Save' }).click();
}

export const changeSBCollaboratorAPI = async (session, baseURL, sandboxId, colabEmails, allSpaceMembers = false) => {
  const data = {
    "all_space_members": allSpaceMembers,
    "collaborators_emails": colabEmails
  }
  const response = await fetch(`${baseURL}/api/spaces/Collaborator/environments/${sandboxId}/collaborators`, {
    "method": "PUT",
    "body": JSON.stringify(data),
    "headers": {
      'Authorization': `Bearer ${session}`,
      'Content-Type': 'application/json',
      'Accept': '*/*'
    }
  });
  return response;
}

export const findSandboxIdByNameAPI = async (session, baseURL, spaceName, sandboxName) => {
  let sandboxId;
  const sandboxesJson = await (await getAllSandboxesAPI(session, baseURL, spaceName)).json();
  for (const sandbox of sandboxesJson) {
    if (sandbox.details.definition.metadata.name === sandboxName) {
      sandboxId = sandbox.id;
      break
    }
  }
  return sandboxId;
}

export const  getSendboxID = async (session, baseURL, space, numOfenvsToFetch, maxRetries )  => {
  let sendboxID;
  for (let retry = 1; retry <= maxRetries; retry++) {
    try {
      let sendboxes = await getFirstSandboxesAPI(session, baseURL, space, numOfenvsToFetch);
      const sendboxesJson = await sendboxes.json();
      console.log(sendboxesJson);
      sendboxID = sendboxesJson[0].id;
      // console.log('sendbox id is ' + sendboxID);
      break; // Exit the loop if the sendboxID is successfully obtained
    } catch (error) {
      console.error('Error occurred:', error);
      if (retry === maxRetries) {
        console.error('Maximum retry attempts reached. Unable to retrieve sendboxID.');
      } else {
        console.log(`Retrying... Attempt ${retry}/${maxRetries}`);
      }
    }
  }
  return sendboxID;
}

