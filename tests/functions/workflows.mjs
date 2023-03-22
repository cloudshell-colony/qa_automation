import { expect } from "@playwright/test";
import goToAdminConsole from "./goToAdminConsole.mjs";
import fetch from "node-fetch";
import { selectFromDropbox } from "./general.mjs";

export const addWorkflow = async (page, name, displayName, description, actionControlValue, space) => {
    await page.getByRole('button', { name: 'Add Workflow' }).click();
    await page.locator('[data-test="name"]').fill(name);
    await page.locator('[data-test="displayName"]').fill(displayName);
    await page.locator('[data-test="description"]').fill(description);
    await selectFromDropbox(page, 'action__control', actionControlValue);
    await selectFromDropbox(page, 'spaces', space);
    await page.locator('.iA-DCaG').click();
    await page.getByRole('button', { name: 'Save' }).first().click();
  
};

export const removeWorkflow = async (page, searchText) => {
    const row = await page.getByText(searchText)
    await row.hover(`[data-test="remove-workflow-power-off-${searchText.includes("resource") ? "ec2" : "env"}"]`)
    await page.locator(`[data-test="remove-workflow-power-off-${searchText.includes("resource") ? "ec2" : "env"}"]`).click()
    await page.locator('[data-test="confirm-button"]').click()
};


  