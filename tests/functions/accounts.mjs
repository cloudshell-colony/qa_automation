import { addCaptchaBypass, selectFromDropbox } from "./general.mjs";
import fetch from "node-fetch";
import { expect } from "@playwright/test";
import goToAdminConsole from "./goToAdminConsole.mjs";


export const getSessionAPI = async (USER, PASSWORD, myURL, account) => {
    // get session for a user to use the APIs
    const data = {
        email: USER,
        password: PASSWORD
    }
    const response = await fetch(`${myURL}/api/accounts/${account}/login`, {
        "method": "POST",
        "body": JSON.stringify(data),
        "headers": {
            'Content-Type': 'application/json'
        }
    });

    if (response.status != 200) {
        console.log("got an issue with gettin session, login API ended with " + response.status);
        console.log(`user: ${USER}, in account ${account}, faild to get session`);
        return (response);
    } else {
        const data = await response.json();
        const tocken = await data.access_token;
        return tocken;
    };
};

export const validateGetSessionAPI = async (getSessionApiResponse) => {
    if (typeof (getSessionApiResponse) === "object") {
        console.log(await getSessionApiResponse.json())
        expect(typeof (getSessionApiResponse)).toBe("string");
    } else {
        expect(typeof (getSessionApiResponse)).toBe("string");
    };
};

export const sendInvitationsAPI = async (session, newUserEmail, myURL, space) => {
    // send invitation for a user, invitation must contain the user email (can be invalid if no SMTP is needed)
    // space_role cane be: "Space Developer",,,,,
    // reason can be: "AdminJoinAccount", "TeamMemberJoinSpace", "AdminAuthenticateCloudAccount"
    const data = {
        "emails": [newUserEmail],
        "account_role": "",
        "reason": "TeamMemberJoinSpace",
        "space_name": space,
        "space_role": "Space Developer"
    }
    const response = await fetch(`${myURL}/api/accounts/invitations`, {
        "method": "POST",
        "body": JSON.stringify(data),
        "headers": {
            'Authorization': `Bearer ${session}`,
            'Content-Type': 'application/json'
        }
    });
    return response;
};

export const getInvitationAPI = async (myURL, secret) => {
    // find user invitation by his secret, the secret is calculated from the user e-mail and the account.
    const response = await fetch(`${myURL}/api/accounts/signup/${secret}`, {
        "method": "GET",
        "headers": {
            'Content-Type': 'application/json'
        }
    });
    return response;
};

export const createAccountAPI = async (baseURL, account_name, company_name, email, first_name, last_name, password) => {
    // send invitation for a user, invitation must contain the user email (can be invalid if no SMTP is needed)
    // space_role cane be: "Space Developer",,,,,
    // reason can be: "AdminJoinAccount", "TeamMemberJoinSpace", "AdminAuthenticateCloudAccount"
    const data = {
        "account_name": account_name,
        "first_name": first_name,
        "last_name": last_name,
        "email": email,
        "password": password,
        "company_name": company_name
    }
    const response = await fetch(`${baseURL}/api/accounts/register`, {
        "method": "POST",
        "body": JSON.stringify(data),
        "headers": {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        }
    });
    return response;
};

export const deleteAccountAPI = async (baseURL, account_name, session) => {
    console.log(`Attempting to delete account: ${account_name}`);
    const response = await fetch(`${baseURL}/api/accounts/${account_name}`, {
        "method": "DELETE",
        "headers": {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session}`
        }
    });
    console.log(`Delete account ${account_name} ended with status code ${response.status}. ${await response.text()}`);
    return response;
};

export const signupUserAPI = async (myURL, secret, password = "Quali!Pass@Fail3") => {
    // signup user by approving the secret that was sent to his e-mail addrees, the secret is calculated from the user e-mail and the account.
    // after this call the user is a registarted user and can use APIs based on his role in the system.
    const data = {
        "first_name": "",
        "last_name": "",
        "password": password,
        "secret": secret
    }
    const response = await fetch(`${myURL}/api/accounts/signup`, {
        "method": "POST",
        "body": JSON.stringify(data),
        "headers": {
            'Content-Type': 'application/json'
        }
    });
    return response;
};

export const deleteUserAPI = async (user_email, myURL, session) => {

    const response = await fetch(`${myURL}/api/accounts/users/${user_email}`, {
        "method": "DELETE",
        "headers": {
            'Authorization': `Bearer ${session}`,
            'Content-Type': 'application/json; charset=utf-8',
            'Accept': 'application/json'
        }
    });
    return response;
};

export const createAccount = async (page, firstName, lastName, companyName, email, accountName, allAccountsPassword, baseURL) => {
    await page.goto(`${baseURL}/register`);
    await addCaptchaBypass(page);
    await page.locator('[data-test="firstName"]').fill(firstName);
    await page.locator('[data-test="lastName"]').fill(lastName);
    await page.locator('[data-test="companyName"]').fill(companyName);
    await page.locator('[data-test="email"]').fill(email);
    await page.locator('[data-test="password"]').fill(allAccountsPassword);
    await page.locator('[data-test="subdomain"]').fill(accountName);
    await page.click('[data-test="submit-signup"]');
    console.log(`New account name: ${accountName}`);
    console.log(`New user email: ${email}`);
    console.log(`Account created at ${baseURL}`);
};

export const loginToAccount = async (page, email, accountName, allAccountsPassword, baseURL) => {
    await page.goto(`${baseURL}`, { timeout: 90000 });
    // await page.locator('[data-test="subdomain"]').fill(accountName);
    // await page.click('[data-test="submit"]');
    await page.click('[data-test="login-with-email"]');
    await page.locator('[data-test="email"]').fill(email);
    await page.locator('[data-test="password"]').fill(allAccountsPassword);
    await page.click('[data-test="submit"]');
    // TO DO
    // need to add validation and handeling for account selection
    // currently - YAGNI
    await page.waitForTimeout(1000);
    let visi = await page.isVisible("[data-test=login-title]");
    if(visi){
        await selectFromDropbox(page, 'account__control', accountName);
    }
    // await page.click('class="select-account__control"');
    await page.waitForSelector("[data-test=sidebar-dropdown]");
};

export const loginToAccountAfterDelite = async (page, email, accountName, allAccountsPassword, baseURL) => {
    //await page.goto(`${baseURL}`, { timeout: 90000 });
    await page.pause();
    await page.locator('[data-test="subdomain"]').fill(accountName);
    await page.click('[data-test="submit"]');
    await page.click('[data-test="login-with-email"]');
    await page.locator('[data-test="email"]').fill(email);
    await page.locator('[data-test="password"]').fill(allAccountsPassword);
    await page.click('[data-test="submit"]');
    await page.waitForURL(`${baseURL}/Sample`);
};
export const validateSbLauncher = async (page, baseURL) => {
    await page.waitForURL(`${baseURL}/Sample`);
    await page.waitForSelector('[data-test="launch-\[Sample\]MySql Terraform Module"]');
    const errorMessage = 'something went wrong in our quick launcher page, Launch action is miisng'
    expect(page.locator('[data-test="launch-\[Sample\]MySql Terraform Module"]'), errorMessage).toContainText('Launch');
    expect(page.locator('[data-test="launch-\[Sample\]Bitnami Nginx Helm Chart"]'), errorMessage).toContainText('Launch');
    expect(page.locator('[data-test="launch-[Sample]Helm Application with MySql and S3 Deployed by Terraform"]'), errorMessage).toContainText('Launch');
};

export const DeleteAcountUI = async (accountName, page, baseURL) => {
    // await page.goto(`${baseURL}/admin/account_billing`);
    await goToAdminConsole(page, "account")
    await page.click('[data-test="delete-account"]');
    await page.locator('[data-test="confirm-delete-account"]').click();
};

export const ValidteBackButtonAfterDelition = async (accountName, page, baseURL) => {
    await page.goBack();
    await page.goBack();
    let result = await page.locator('[data-test="signup-with-email"]');
    await expect(result, "Back option should navigate to sign up page").toContainText("Sign");
};

export const ValidteLoginFalureAfterDelition = async (accountName, allAccountsPassword, email, page, baseURL) => {
    await loginToAccount(page, email, accountName, allAccountsPassword, baseURL);
    expect(await page.locator('[data-test="auth-error"]'), "Login Should Fail");

};

export const logOut = async(page, firstLetter) =>{
    await page.getByText(firstLetter).first().click();
    await page.click("[data-test=logout-button]");
}
