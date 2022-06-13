/*
test objectives
invite new user
validate the number of users in the system increases by one
the user approve the registration 
new user can login to the system and use basic API
the admin deletes the new user
the user cannot use its old session any more
the user cannot obtain a new session
*/

import test, { expect } from "@playwright/test";
import { log } from "console";
import { request } from "http";
import generateSecret from './functions/general.mjs';
import {signupUserAPI, getSessionAPI, sendInvitationsAPI, getInvitationAPI, deleteUserAPI} from "./functions/accounts.mjs";
import getAllUsersAPI from "./functions/users.mjs";
import getPublishedBlueprints from "./functions/blueprints.mjs";

const account = 'trial-60b15ddc';
const space = 'gmp'
const USER = 'gilad.m@quali.com';
const PASSWORD = 'Quali!Pass@Fail3';

let initialNumberOfUsersInDomain = 0;
let newNumberOfUsersInDomain = 0;
let newUserSession = "";
const myURL = "http://colony.localhost";

const session = await getSessionAPI(USER, PASSWORD, myURL, account);
// new user data
const newUserEmail = "marvel10@dc.com";
const secret = generateSecret(newUserEmail, account);

test.describe.serial('basic API tests', () => {
    
    test('get all users', async () => {
        const usersList = await getAllUsersAPI(session, myURL);
       
        const usersListJson = await usersList.json()
        if (usersList.status === 200) {
            console.log(await usersListJson);
            initialNumberOfUsersInDomain = Object.keys(await usersListJson).length;
            console.log(`the total number of users in the first users request is: ${initialNumberOfUsersInDomain}`);
        } else {
            console.log(usersListJson);
            expect(usersList.status).toBe(200);
            expect(usersList.ok).toBeTruthy();
        }
                
    });
   
    test('invite new user', async () => {        
        const userInvitation = await sendInvitationsAPI(session, newUserEmail, myURL, space)        
        if (userInvitation.status === 200 ) {
            expect(userInvitation.ok).toBeTruthy(); 
            console.log(`invitation to ${newUserEmail} was submited`);                
        } else {            
            console.log(await userInvitation.json());
            expect(userInvitation.status).toBe(200);
        }
        
    });
    
    test('get invitation by secret', async () => {             
        const invitationInfo = await getInvitationAPI(myURL, secret);
        if (invitationInfo.status === 200 ) {
            expect(invitationInfo.ok).toBeTruthy();   
            console.log(await invitationInfo.json());
        } else {
            console.log(await invitationInfo.json());
            expect(invitationInfo.status).toBe(200);    
        };
        
    });
    
    test("user signup by useing his secret", async () => {
             
        const signupUserAPIrequest = await signupUserAPI(myURL, secret);
        if (signupUserAPIrequest.status != 200 ) {
            console.log(await signupUserAPIrequest.json());
            expect(signupUserAPIrequest.status).toBe(200);
            expect(signupUserAPIrequest.ok).toBeTruthy();     
        } else {
            expect(signupUserAPIrequest.status).toBe(200);
            expect(signupUserAPIrequest.ok).toBeTruthy();
        }
        
    });

    test('user invitation by secret is no longer available after the user registrated', async () => {             
        const invitationInfo = await getInvitationAPI(myURL, secret);
        const body = await invitationInfo.json()
        if (invitationInfo.status === 404 ) {
            expect(invitationInfo.status).toBe(404);
            console.log(await body);
            expect(body.errors[0].message).toBe('Invitation was not found');            
        } else {
            console.log(await body);
            expect(invitationInfo.status).toBe(404);    
        };        
    });

    test('get all users again', async () => {
        const usersList = await getAllUsersAPI(session, myURL);
        expect(usersList.status).toBe(200);
        expect(usersList.ok).toBeTruthy();
        const response = await usersList.json()
        console.log(await response);
        newNumberOfUsersInDomain = Object.keys(await response).length;
        console.log(`the total number of users is: ${newNumberOfUsersInDomain}`);
        expect(newNumberOfUsersInDomain - initialNumberOfUsersInDomain).toEqual(1);
    });

    test('new user can get a session', async () => {
        newUserSession = await getSessionAPI(newUserEmail, PASSWORD, myURL, account);
        if (typeof(newUserSession) === "object") {
            console.log(await newUserSession.json())
            expect(typeof(newUserSession)).toBe("string");    
        } else {
        expect(typeof(newUserSession)).toBe("string");
        console.log(`email: ${newUserEmail},   session: ${newUserSession}`);
        };
    });
    
    test('New user can get all published blueprints', async () => {
        const publishedBlueprints = await getPublishedBlueprints(newUserSession, space, myURL);
        expect(publishedBlueprints.status).toBe(200);
        expect(publishedBlueprints.ok).toBeTruthy();
        const publishedBlueprintsData = await publishedBlueprints.json();
        console.log(`new user found ${Object.keys(publishedBlueprintsData).length} published blueprints and they are: ${publishedBlueprintsData}`);
    });

    test('Admin can delete a user from the system', async () => {
        const deleteUserAPIResponse = await deleteUserAPI(newUserEmail, myURL, session);
        if (deleteUserAPIResponse.status != 200 ) {
            console.log(`my log text should be: ${await deleteUserAPIResponse.text()}`);
            expect(deleteUserAPIResponse.status).toBe(200);
            expect(deleteUserAPIResponse.ok).toBeTruthy();     
        } else {            
            expect(deleteUserAPIResponse.status).toBe(200);
            expect(deleteUserAPIResponse.ok).toBeTruthy();
        }
        
    });

    test('Deleted user should NOT be able to use his active session', async () => {
        const publishedBlueprints = await getPublishedBlueprints(newUserSession, space, myURL);
        expect(publishedBlueprints.status).toBe(401);
        const response = await publishedBlueprints.text();
        console.log(`user got error: ${response}`);
        expect(response).toContain("Unauthorized to access account");
    });

    test('Deleted user cannot obtain a session', async () => {
        newUserSession = await getSessionAPI(newUserEmail, PASSWORD, myURL, account);
        if (typeof(newUserSession) === "object") {
            const response = await newUserSession.json();
            console.log(await response);
            expect(newUserSession.status).toBe(401);
            expect(response.errors[0].message).toBe("The email address or password is incorrect");    
        } else {
        console.log("Deleted user was able to get active session");
        expect(typeof(newUserSession)).toBe("object");
        expect(newUserSession.status).toBe(401);
        };
    })

});



