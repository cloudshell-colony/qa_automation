import * as dotenv from 'dotenv';
import fetch from "node-fetch";
import { agentDepHandler, approvalChannelDepHandler, repositoryDepHandler, spaceDepHandler, spaceMembersDepHandler } from './depHandlers.mjs';
import { createAccountAPI, getSessionAPI } from './tests/functions/accounts.mjs';
dotenv.config();

const baseURL = process.env.baseURL;
const password = process.env.allAccountsPassword;
const email = process.env.adminEMail;
const accountName = process.env.account;
const qualiNextToken = process.env.qualiNextToken

// missing dependencies - aks for endingSB space.
// need to develop methods for adding AKS (K8S context switch etc)

const testsDependencies = {
    actionTestsUI: {space: "Actions", agents: [{name: 'qa-eks', type: 'eks',associated: true}], repositories: [{url: "https://github.com/QualiNext/test-spec2-public", 
            token: qualiNextToken, name: 'test-spec2-public', branch: 'master', assets: ['create-ec2-instance']}]},

    blueprintValidation: {space: "bp-validation", agents: [{name: 'qa-eks', type: 'eks',associated: true}, {name: 'bp-validation2', type: 'eks',associated: false}],
            repositories: [{url: "https://github.com/QualiNext/qa-bp-validation", token: qualiNextToken, name: 'qa-bp-validation', branch: 'master'}]},

    collaboratorsTests: {space: "Collaborator", agents: [{name: 'qa-eks', type: 'eks',associated: true}], repositories: [{url: "https://github.com/QualiNext/qa-bp-validation",
            token: qualiNextToken, name: 'qa-bp-validation', branch: 'master', assets: ['simpleTF']}], members: [{email: 'asaf.y@quali.com', password:'Qual!123'}]},

    driftCheckAPI: {space: "drift-api", agents: [{name: 'qa-eks', type: 'eks',associated: true}], repositories: [{url: "https://github.com/QualiNext/qa-bp-validation",
            token: qualiNextToken, name: 'qa-bp-validation', branch: 'master', assets: ['s3']}]},

    driftTestUI: {space: "drift-test", agents: [{name: 'qa-eks', type: 'eks',associated: true}], repositories: [{url: "https://github.com/QualiNext/torque-demo",
            token: qualiNextToken, name: 'torque-demo', branch: 'master', published: ['drift-test']}]},
    
    endingSB: {space: "EndingSB", agents: [{name: 'qa-eks', type: 'eks',associated: true}], repositories: [{url: "https://github.com/QualiNext/test-spec2-public",
            token: qualiNextToken, name: 'test-spec2-public', branch: 'master', assets: ['azure_vm_legacy_wi', 'create-ec2-instance']}]},

    parametersTests: {space: process.env.space},

    policiesTestAWS: {space: 'aws-policies', agents: [{name: 'qa-eks', type: 'eks',associated: true}], repositories: [{url: "https://github.com/QualiNext/test-spec2-public", 
            token: qualiNextToken, name: 'test-spec2-public', branch: 'master', assets: ['create-ec2-instance']}, {url: "https://github.com/QualiNext/qa-bp-validation",
            token: qualiNextToken, name: 'qa-bp-validation', branch: 'master', assets: ['s3']}], 
            channels:[{name: 'policy approval', type: 'Email', approvers: ['amir.o@quali.com']}]},

    sendboxAutomateShutdownTests: {space: "extend-test", agents: [{name: 'qa-eks', type: 'eks',associated: true}], repositories: [{url: "https://github.com/QualiNext/qa-bp-validation",
            token: qualiNextToken, name: 'qa-bp-validation', branch: 'master', assets: ['simpleTF']}]},

    updatesTest: {space: 'update-test', agents: [{name: 'qa-eks', type: 'eks',associated: true}], repositories: [{url: "https://github.com/cloudshell-colony/qa_automation",
            token: process.env.githubToken, name: 'qa_automation', branch: 'main', assets: ['simpleTF']}]},
    
    workFlows: {space: "Workflows", agents: [{name: 'qa-eks', type: 'eks',associated: true}], repositories: [{url: "https://github.com/QualiNext/test-spec2-public", 
            token: qualiNextToken, name: 'test-spec2-public', branch: 'master', assets: ['create-ec2-instance']}]},
            
    blueprintsCatalogTests: {space: "API-tests", repositories: [{url: "https://github.com/QualiNext/test-spec2-public", 
            token: qualiNextToken, name: 'test-spec2-public', branch: 'master', assets: ['create-ec2-instance']},{url: "https://github.com/QualiNext/torque-demo", 
            token: qualiNextToken, name: 'torque-demo', branch: 'master', assets: ['drift-test']}]},
            
    extendSendboxTest: {space: "API-tests", agents: [{name: 'qa-eks', type: 'eks',associated: true}], repositories: [{url: "https://github.com/QualiNext/test-spec2-public", 
            token: qualiNextToken, name: 'test-spec2-public', branch: 'master', assets: ['create-ec2-instance']}]},
    
    validateBlueprintTest: {space: "API-tests", repositories: [{url: "https://github.com/QualiNext/test-spec2-public", 
            token: qualiNextToken, name: 'test-spec2-public', branch: 'master', assets: ['create-ec2-instance']}]}


}



const runAllTestDependencies = async(testName, testDeps) =>{
    console.log(`Validating and creating dependencies for test ${testName}`);
    let testSpace = testDeps.space;
    await spaceDepHandler(testName, session, baseURL, testSpace);
    if(testDeps.agents != undefined){
        await agentDepHandler(testName, session, baseURL, testDeps.agents, testSpace);
    }
    if(testDeps.repositories != undefined){
        await repositoryDepHandler(testName, session, baseURL, testDeps.repositories, testSpace);
    }
    if(testDeps.members != undefined){
        await spaceMembersDepHandler(testName, session, baseURL, testDeps.members, testSpace, accountName);
    }
    if(testDeps.channels != undefined){
        await approvalChannelDepHandler(testName, session, baseURL, testDeps.channels);
    }
    console.log('*********************************************************');
}

// Initiate tests list to create / validate dependencies for.
// If list in .env file was empty then we will check all tests
var testsList;
if(process.env.dependencyTests === "" || process.env.dependencyTests === undefined){
    testsList = Object.keys(testsDependencies);
}
else{
    testsList = process.env.dependencyTests.split(", "); // .env file can only handle strings
}

// Create account if doesn't exist and get session
const response = await fetch(`${baseURL}/api/accounts/${accountName}/details`, {
    "method": "GET",
    "headers": {
        'Content-Type': 'application/json'
    }
});
if(response.status === 404){
    console.log(`Account ${accountName} doesn't exist, creating it`);
    await createAccountAPI(baseURL, accountName, 'quali', email, 'FN', 'LN', password)
}
else{console.log(`Account ${accountName} exists`);}
let session = await getSessionAPI(email, password, baseURL, accountName);

// run dependencies for each test in the list
const testErrorList = [];
for (const test of testsList) {
    if(testsDependencies[test] != undefined){
        try {
            await runAllTestDependencies(test, testsDependencies[test]);
        } catch (error) {
            testErrorList.push(error);
        }
    }
    else{
        console.log(`Test '${test}' has no dependencies. Did you spell it according to the test file name?`);
    }
}

if (testErrorList.length === 0) {
    console.log('All test dependencies were handled successfully, tests should now be runable');
} else {
    console.error(`${testErrorList.length} tests failed. Full tests error list:`);
    for (const errors of testErrorList) {
        console.error(errors);
    }
}
