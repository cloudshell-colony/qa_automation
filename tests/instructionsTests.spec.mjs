import { expect, test } from "@playwright/test";
import { closeModal, generateUniqueId, openAndPinSideMenu, selectFromDropbox } from "./functions/general.mjs";
import { getSessionAPI, loginToAccount, validateGetSessionAPI } from "./functions/accounts.mjs";
import { endSandbox } from "./functions/sandboxes.mjs";
import { generateRepoSpecificKeys, goToSpace } from "./functions/spaces.mjs";

const baseURL = process.env.baseURL;
const user = process.env.adminEMail
const password = process.env.allAccountsPassword;
const account = process.env.account;
const repProvider = process.env.repProvider;
const timestemp = Math.floor(Date.now() / 1000);
const id = timestemp.toString().concat(generateUniqueId());
const spaceName = 'Instructions';
const executionHostName = 'qa-eks'
const blueprintNameWithMD = 'multiple-tf'
const blueprintName = 'multiple-tf-2'
const instructionText = 'blah blah blah instructions instructions instructions woohoo'
const newText = 'New Text ' + id
const iframeSelector = 'iframe[src="https://d2e9m83oslj2p1.cloudfront.net/86234c96-435d-4865-b25e-828552c00f85/torque-documentation/instructions-with-image.html"]'


/** Test prerequisites
 * Have account with credentials as saved in .env file
 * @spaceName should exist in the account
 * space should have repo https://github.com/cloudshell-colony/qa_automation associated
 * and simpleTF asset auto-generated to a published blueprint
 * @executionHostName agent should be associated to space
 */

test.describe.serial("Instructions Tests", () => {
    let page;
    let session;
    let repoKeys;
    let context;

    test.beforeAll(async ({ browser }) => {
        repoKeys = await generateRepoSpecificKeys(repProvider);
        session = await getSessionAPI(user, password, baseURL, account);
        await validateGetSessionAPI(session);
        context = await browser.newContext();
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

    test.skip("Change TF file in github", async () => {
        await page.goto('https://github.com/cloudshell-colony/qa_automation');
        //Sign in to github
        await page.locator('header[role="banner"] >> text=Sign in').click();
        await page.locator('input[name="login"]').fill(repoKeys.userName);
        await page.locator('input[name="password"]').fill(repoKeys.password);
        await page.locator('input:has-text("Sign in")').click();
        console.log('Signed in to github');
        //Edit tf file
        await page.goto('https://github.com/cloudshell-colony/qa_automation/edit/main/instructions/torque-documentation/instructions-with-image.md');
        const mdContentLocator = await page.locator('pre').filter({ hasText: 'New Text' })
        const mdContent = await mdContentLocator.textContent()
        console.log('the content is ' + mdContent);
        console.log('the new MD is ' + id);
        // Delete the content
        const mdElement = await mdContentLocator.first();
        await mdElement.click(); // Ensure the element is focused before typing
        await page.keyboard.press('End'); // Move the cursor to the end of the text content
        await page.keyboard.down('Shift'); // Hold the Shift key for selection
        await page.keyboard.press('Home'); // Select the existing text content
        await page.keyboard.up('Shift'); // Release the Shift key
        await page.keyboard.press('Backspace'); // Delete the selected text

        await page.keyboard.type(newText); // Type the new content
        await page.click('button:has-text("Commit changes")');
        await page.click('button:has-text("Commit changes")');
    })

    test("Validate instructions on multiple-tf-2 catalog", async () => {
        await page.goto(`${baseURL}`, {timeout: 150000, waitUntil: 'load'});
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

        await page.waitForSelector(iframeSelector);
        const iframeElementHandle = await page.$(iframeSelector);
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
        await page.waitForSelector(iframeSelector);
        const iframeElementHandle = await page.$(iframeSelector);
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

 

    test.skip("Validate updated instructions on multiple-tf catalog", async () => {
        await goToSpace(page, spaceName);
        await page.locator('[data-test="catalog-nav-link"]').click()
        await page.locator(`[data-test=catalog-bp-${blueprintNameWithMD}]`).click()
        await page.waitForTimeout(15 * 1000);
        await page.reload();
        await page.waitForTimeout(5 * 1000);
        await page.reload();
        await page.waitForSelector(iframeSelector);
        const iframeElementHandle = await page.$(iframeSelector);
        const frame = await iframeElementHandle.contentFrame();
        const jsonFrame = JSON.stringify(frame)
        console.log('the frame is ' + jsonFrame);
        const paragraphElement = await frame.waitForSelector('p'); 
        const textContent = await paragraphElement.textContent(); 
        console.log(textContent); 
        expect(textContent).toContain(newText, {timeout: 1 * 60 * 1000 })
    })
});