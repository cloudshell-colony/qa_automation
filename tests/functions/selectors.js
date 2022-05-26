const {expect } = require('@playwright/test');
const clickButton = async (page, selector, timeout = 30000, force=false) => {
    await page.click(`[data-test=${selector}]`, { timeout, force });
};
const getElement = (page, selector) => page.$(`[data-test=${selector}]`);

const waitForElement = (page, selector, options = {}) => page.waitForSelector(`[data-test=${selector}]`, options);

const fillInput = async (page, selector, value, keyToPress) => { 
    await page.fill(`[data-test=${selector}]`, value);
    if (keyToPress) await page.keyboard.press(keyToPress);
};

/**
 * 
 * @param {Page} page
 * @param {String} rowIdentifier - data-test attribute of the row
 * @param {String} optionSelector - defaults are: "edit-more-menu-option" for top option, "delete-more-menu-option" for bottom
 */
const pressOptionFromCommonTable = async (page, rowIdentifier, optionSelector="edit-more-menu-option") => {
    const moreMenuOptionsSelector = `[data-test=${rowIdentifier}] [data-testid=moreMenu]`; 
    await page.click(moreMenuOptionsSelector);
    const optionToSelect = `${moreMenuOptionsSelector} [data-test="${optionSelector}"]`;
    await page.click(optionToSelect);
};

const fillSearchableSelectInput = async (page, name, text="") => {
    await page.click(`[class~="select-${name}"]`);
    await page.type(`[class~="select-${name}"]`, text);
    await page.keyboard.press("Enter");
};

const clearInputThenFill = async (page, selector, value, keyToPress) => {
    await page.click(`[data-test=${selector}]`);
    await page.keyboard.down("Control");
    await page.keyboard.press("KeyA");
    await page.keyboard.up("Control");
    await page.keyboard.press("Backspace");
    return fillInput(page, selector, value, keyToPress);
};

const focusOnElement = async (page, selector) => { 
    await page.focus(`[data-test=${selector}]`);
};
const waitForElementToDisappear = async (page, selector) => {
    await page.waitForFunction((selector) => !document.querySelector(`[data-test=${selector}]`), selector);
};

const getElements = async (page, selector) => page.$$(`[data-test=${selector}]`);

const getElementCount = async (page, selector) => {
    const elements = await getElements(page, selector);
    return elements.length;
};

const clickSwitcherValue = async (page, switcherDataTest, shouldActivate = false) => {
    const switcherDiv = await getElement(page, switcherDataTest);
    expect(switcherDiv).toBeTruthy();
    const isActive = await switcherDiv.getAttribute("data-toggle");
    if (!!isActive !== shouldActivate) {
        await clickButton(page, switcherDataTest);
    }
};

const getTestSelector = (selector) => `[data-test="${selector}"]`;

const checkOrUncheckCheckbox = async (page, dataTest, value, options = {}) => page[value ? "check" : "uncheck"](getTestSelector(dataTest), options);

const waitForInnerText = async (page, selector, innerText, options = {}) => {
    return page.waitForFunction(({selector, innerText}) => {
        const element = document.querySelector(selector);
        return element && element.innerText === innerText;
    }, {selector : getTestSelector(selector), innerText}, options);
};

module.exports = {
    clickButton,
    clickSwitcherValue,
    getElement,
    waitForElement,
    waitForInnerText,
    getTestSelector,
    fillInput,
    clearInputThenFill,
    getElements,
    getElementCount,
    fillSearchableSelectInput,
    focusOnElement,
    checkOrUncheckCheckbox,
    waitForElementToDisappear,
    pressOptionFromCommonTable
};