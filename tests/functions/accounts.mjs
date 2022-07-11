import { addCaptchaBypass } from "./general.mjs";
import fetch from "node-fetch";
import { expect } from "@playwright/test";


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
        return (response);
    } else {
        const data = await response.json();
        const tocken = await data.access_token;
        return tocken;
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

export const signupUserAPI = async (myURL, secret) => {
    // signup user by approving the secret that was sewnt to his e-mail addrees, the secret is calculated from the user e-mail and the account.
    // after this call the user is a registarted user and can use APIs based hon his role in the system.
    const data = {
        "first_name": "",
        "last_name": "",
        "password": "Quali!Pass@Fail3",
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

export const createAccount = async (page, email, accountName, allAccountsPassword, baseURL) => {
    await page.goto(`${baseURL}/register`);
    await addCaptchaBypass(page);
    await page.locator('[data-test="email"]').fill(email);
    await page.locator('[data-test="password"]').fill(allAccountsPassword);
    await page.locator('[data-test="subdomain"]').fill(accountName);
    await page.click('[data-test="submit-signup"]');
    console.log(`new domain name: ${accountName}`);
    console.log(`new user email: ${email}`);
};

export const loginToAccount = async (page, email, accountName, allAccountsPassword, baseURL) => {
    await page.goto(`${baseURL}`, { timeout: 90000 });
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
    expect(page.locator('[data-test="launch-\[Sample\]MySql Terraform Module"]')).toContainText('Launch');
    expect(page.locator('[data-test="launch-\[Sample\]Bitnami Nginx Helm Chart"]')).toContainText('Launch');
    expect(page.locator('[data-test="launch-[Sample]Helm Application with MySql and S3 Deployed by Terraform"]')).toContainText('Launch');
};