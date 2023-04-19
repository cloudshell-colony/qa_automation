import { expect } from "@playwright/test";
import goToAdminConsole from "./goToAdminConsole.mjs";
import fetch from "node-fetch";
import { selectFromDropbox } from "./general.mjs";



export const performEC2Action = async (page, resource, instance,  action, actionInstance, provider) => {
    await page.hover('[data-test="environment-views"]');
    await page.getByText('Resources layout').click();
    await page.locator(`[data-test="resource-card-${resource}"]`).click();
    await page.getByText(`Power-${action} ${instance}`).hover();
    await page.locator(`[data-test="execute-action-${provider}-power-${action}-${actionInstance}-tf"]`).click();
  }
  


  