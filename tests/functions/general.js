const playwright = require("playwright");
const {apiPost} = require("./apiFuncs");
const baseURL = "https://asaf.qtorque.io/api";


const initTest = (browserType) => async () => {
    global.browser = await playwright[process.env.TEST_BROWSER || browserType].launch({
        headless: !!process.env.HEADLESS,
    });
    const context = await global.browser.newContext();
    // setting global so we can access the page instance in our custom test Environment
    global.page = await context.newPage();
    await global.page.setViewportSize({ width: 1584, height: 864 });
};

const cleanUpTest = async() => await global.browser.close();

const initAPI = async({request}) => {
    let res = await request.post(`${baseURL}/accounts/asaf/login`, {
            data: {
                'email': 'asaf.y@quali.com',
                'password': 'Asaf1234'
            }
        });
    let sessions =  await res.json();
    global.token = sessions.access_token;
}

const revokeToken = async({request}) => await apiPost(request, "/token/revoke");

function randomString(length) {
    const chars = "0123456789abcdefghijklmnopqrstuvwxyz";
    var result = '';
    for (var i = length; i > 0; --i) result += chars[Math.floor(Math.random() * chars.length)];
    return result;
}
module.exports = {initTest, cleanUpTest, initAPI, revokeToken, randomString};