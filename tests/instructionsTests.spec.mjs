import { expect, test } from "@playwright/test";
import { closeModal, generateUniqueId, openAndPinSideMenu, selectFromDropbox } from "./functions/general.mjs";
import { getSessionAPI, loginToAccount, validateGetSessionAPI } from "./functions/accounts.mjs";
import { goToSpace } from "./functions/spaces.mjs";
import { endSandbox } from "./functions/sandboxes.mjs";

const baseURL = process.env.baseURL;
const user = process.env.adminEMail
const password = process.env.allAccountsPassword;
const account = process.env.account;
const timestemp = Math.floor(Date.now() / 1000);
const id = timestemp.toString().concat(generateUniqueId());
const spaceName = 'Instructions';
const executionHostName = 'qa-eks'
const blueprintNameWithMD = 'multiple-tf'
const blueprintName = 'multiple-tf-2'
const instructionText = 'blah blah blah instructions instructions instructions woohoo'

/** Test prerequisites
 * Have account with credentials as saved in .env file
 * @spaceName should exist in the account
 * space should have repo	https://github.com/Amir-Omazgin/Assets associated
 * and simpleTF asset auto-generated to a published blueprint
 * @executionHostName agent should be associated to space
 */

test.describe.serial("Asset updates test", () => {
    let page;
    let session;
    test.beforeAll(async ({ browser }) => {
        session = await getSessionAPI(user, password, baseURL, account);
        await validateGetSessionAPI(session);
        page = await browser.newPage();
        await loginToAccount(page, user, account, password, baseURL);
        await closeModal(page);
        await openAndPinSideMenu(page);
    });

    // test.afterAll(async () =>{
    //     await page.goto(`${baseURL}/${spaceName}/environments`);
    //     await page.waitForLoadState();
    //     await stopAndValidateAllSBsCompleted(page);
    // });

    test("Validate instructions on multiple-tf-2 blueprint", async () => {
        await goToSpace(page, spaceName);
        await page.locator('[data-test="blueprints-nav-link"]').click()
        await page.locator(`[data-test=blueprint-row-${blueprintName}]`).click()
        await page.getByRole('tab', { name: 'Instructions' }).click()
        const UIinstructionText = await page.locator('.eBgzzq ').textContent()
        console.log(UIinstructionText);
        expect(UIinstructionText).toContain(instructionText, 'Assertion failed: UI instruction text does not contain "' + instructionText + '"');

    })

    test("Validate instructions on multiple-tf-2 catalog", async () => {
        await goToSpace(page, spaceName);
        await page.locator('[data-test="catalog-nav-link"]').click()
        await page.locator(`[data-test=catalog-bp-${blueprintName}]`).click()
        const UIinstructionText = await page.locator('.markdown-body ').textContent()
        console.log(UIinstructionText);
        expect(UIinstructionText).toContain(instructionText, 'Assertion failed: UI instruction text does not contain "' + instructionText + '"');

    })

    test("Validate instructions on multiple-tf with MD ", async () => {
        await goToSpace(page, spaceName);
        await page.locator('[data-test="blueprints-nav-link"]').click()
        await page.locator(`[data-test=blueprint-row-${blueprintNameWithMD}]`).click()
        await page.getByRole('tab', { name: 'Instructions' }).click()

        await page.waitForSelector('iframe[src="https://d2e9m83oslj2p1.cloudfront.net/a63b5c51-6436-4a69-b80c-0a3daea1137b/torque-documentation/instructions-with-image.html"]');
        const iframeElementHandle = await page.$('iframe[src="https://d2e9m83oslj2p1.cloudfront.net/a63b5c51-6436-4a69-b80c-0a3daea1137b/torque-documentation/instructions-with-image.html"]');
        const frame = await iframeElementHandle.contentFrame();
        const jsonFrame = JSON.stringify(frame)
        console.log('the frame is ' + jsonFrame);
        const imgElement = await frame.waitForSelector('img[src="img/torque-high-level-architecture.png"][alt="Locale Dropdown"]');
        const youtubeElement = await frame.waitForSelector('img[src="https://img.youtube.com/vi/kMbJ7IRDV7w/0.jpg"][alt="torque"]')
        console.log('object of image is ' + imgElement);
        console.log('object of youtube is ' + youtubeElement);
        if (imgElement && youtubeElement) {
            console.log('The image and youtube elements exists!');
        } else {
            console.log('The images elements does not exist!');
        }
    })

    test("Launch multiple-tf and validate instructions ", async () => {
        await goToSpace(page, spaceName);
        await page.locator('[data-test="blueprints-nav-link"]').click()
        const multipleTF = await page.locator(`[data-test=blueprint-row-${blueprintNameWithMD}]`)
        await multipleTF.locator('[data-test="launch-environment-from-blueprint"]').click()
        await page.locator('[data-test="go-to-next-step"]').click()
        await selectFromDropbox(page, 'inputs.compute_service_name', executionHostName)
        await page.locator('[data-test="launch-environment"]').click()
        await page.waitForSelector('[data-test="sandbox-info-column"] div:has-text("StatusActive")', { timeout: 10 * 60 * 1000 });
        await page.hover('[data-test="environment-views"]');
        await page.getByText('Resources layout').click();
        await page.getByRole('tab', { name: 'Instructions' }).click()
        await page.waitForSelector('iframe[src="https://d2e9m83oslj2p1.cloudfront.net/a63b5c51-6436-4a69-b80c-0a3daea1137b/torque-documentation/instructions-with-image.html"]');
        const iframeElementHandle = await page.$('iframe[src="https://d2e9m83oslj2p1.cloudfront.net/a63b5c51-6436-4a69-b80c-0a3daea1137b/torque-documentation/instructions-with-image.html"]');
        const frame = await iframeElementHandle.contentFrame();
        const jsonFrame = JSON.stringify(frame)
        console.log('the frame is ' + jsonFrame);
        const imgElement = await frame.waitForSelector('img[src="img/torque-high-level-architecture.png"][alt="Locale Dropdown"]');
        const youtubeElement = await frame.waitForSelector('img[src="https://img.youtube.com/vi/kMbJ7IRDV7w/0.jpg"][alt="torque"]')
        console.log('object of image is ' + imgElement);
        console.log('object of youtube is ' + youtubeElement);
        if (imgElement && youtubeElement) {
            console.log('The image and youtube elements exists!');
        } else {
            console.log('The images elements does not exist!');
        }

        await endSandbox(page)
        await expect(page.locator('[data-test="sandbox-row-0"]')).toContainText('Terminating', { timeout: 2 * 60 * 1000 });
    })
});