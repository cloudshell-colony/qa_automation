const { test, expect} = require('@playwright/test');
const {initAPI, revokeToken} = require("./functions/general");
const {apiGet} = require("./functions/apiFuncs");

test.describe("API testing", () => {
    test.beforeAll(initAPI);
    test.afterAll(revokeToken);
    test("get blueprints", async({request}) => {
       /* const bp = await request.get("https://asaf.qtorque.io/api/spaces/Sample/blueprints",{
            headers: {
                "Authorization": `Bearer ${token}`,
            },
        });
        */
        const bp = await apiGet(request, "/spaces/Sample/blueprints");
        console.log(await bp.json());
    })
});
