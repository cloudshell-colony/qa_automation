import fetch from "node-fetch";
import {goToSpace} from "./spaces.mjs";


export const getPublishedBlueprints = async (session, space_name, myURL) => {
    
    const PBPList = await fetch(`${myURL}/api/spaces/${space_name}/blueprints`, {
        "method": "GET",
        "headers": {
            'Authorization': `Bearer ${session}`,
            'Content-Type': 'application/json'
        }
    });
    return(PBPList);    
};

export const countBlueprintsInSpace = async(page, space_name) => {
    await goToSpace(page, space_name);
    await page.click("[data-test=blueprints-nav-link]");
    await page.waitForSelector("[data-test=space-blueprints-tab-test]");
    const visi = await page.isVisible('button:has-text("Add a Repository")', {timeout: 3000});
    if(visi){
        return 0;
    }
    else{
        await page.waitForSelector('div:has-text("Launch Sandbox")', {timeout: 3000});
        const BPList = page.locator("tr", {has: page.locator("data-testid=moreMenu")});
        const num = await BPList.count();
        return num;
    }
};