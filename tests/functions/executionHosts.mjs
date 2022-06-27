const associateExecutionHost = async(page, executionHost, nameSpace, space) => {
    //await page.waitForSelector("[data-test=add-new-execution-host]");
    //const visi = await page.isVisible(`[data-test=execution-hosts-${executionHost}]`);
    try{
        await page.waitForSelector(`[data-test=execution-hosts-${executionHost}]`, {timeout: 2000})
    }
    catch(err){
        throw(`Execution host "${executionHost}" not found`);
    }
    await page.locator(`[data-test=execution-hosts-${executionHost}]`).locator("[data-testid=moreMenu]").click();
    await page.click("[data-test=add-host-to-space-more-menu-option]");
    await page.type('div:has-text("Select a space...") input', space);
    await page.keyboard.press("Enter");
    await page.fill("[data-test=namespace]", nameSpace);
    await page.click("[data-test=submit-button]");
};

export default associateExecutionHost;