import { getInvitationAPI, sendInvitationsAPI, signupUserAPI } from "./tests/functions/accounts.mjs";
import { generateSpecificAssetsFromRepoAPI, getBlueprintsDetailsInCatalogAPI, publishBlueprintAPI } from "./tests/functions/blueprints.mjs";
import { associateExecutionHostAPI, createEKSAPI, disassociateExecutionHostAPI, getdeploymentFileAPI, getExecutionHostDetailsAPI } from "./tests/functions/executionHosts.mjs";
import { executeCLIcommand, generateSecret, overwriteAndSaveToFile } from "./tests/functions/general.mjs";
import { addApprovalChannelAPI, checkIfApprovalChannelExistsAPI } from "./tests/functions/policies.mjs";
import { addRepositoryAPI, createSpaceAPI } from "./tests/functions/spaces.mjs"

const namespace = process.env.nameSpace;
const serviceAccount = process.env.serviceAccount;

/**
 * Validates a space exists according to a test's dependency
 * Throws error if space didn't exist & couldn't be created
 * @param {string} testName Name of the test that needs this space
 * @param {string} session API session for an account
 * @param {string} baseURL base URL of the environment, like https://preview.qualilabs.net
 * @param {string} spaceName name of the requested space
 */
export const spaceDepHandler = async(testName, session, baseURL, spaceName) => {
    const response = await createSpaceAPI(baseURL, session, spaceName);
    if(response.status === 422){
        console.log(`${testName}: Space '${spaceName}' already exists`);
    }
    else{
        if (response.status === 200) {
            console.log(`Created space '${spaceName}' for test '${testName}'`);
        } else {
            throw Error(`Received status ${response.status} while creating space '${spaceName}' for test '${testName}'. Full response: \n` + await response.text());
        }
    }
}

/**
 * Validates agents exist and are associated to relevent spaces according to a test's dependency.
 * Throws error if the agents couldn't be created or associated to the relevant spaces
 * @param {*} testName Name of the test that needs this space
 * @param {*} session API session for an account
 * @param {*} baseURL base URL of the environment, like https://preview.qualilabs.net
 * @param {Array} agentList list of agents, each containing name, type & associated (boolean) value
 * @param {*} spaceName name of the requested space
 */
export const agentDepHandler = async(testName, session, baseURL, agentList, spaceName) =>{
    for (const agentParams of agentList) {
        let agentName = agentParams.name;
        let associated = agentParams.associated;
        try {
            await addAgentHelper(session, baseURL, agentName, associated, spaceName)
        } catch (err) {
            throw Error(`Failed to add agent '${agentName}' for test '${testName}'. Full response: \n` + err.message);
        }
    }
}

/**
 * Helper for agentDepHandler.
 * Creates an agent if doesn't exist, and associates it if needed according to @param associated
 * @param {*} testName Name of the test that needs the agents
 * @param {*} session API session for an account
 * @param {*} baseURL base URL of the environment, like https://preview.qualilabs.net
 * @param {*} agentName Name of the agent name to create & associate
 * @param {*} associated Wether the agent needs to be associated to a space or not
 * @param {*} spaceName Space to associate the agent to if necessary
 */
const addAgentHelper = async(session, baseURL, agentName, associated, spaceName) =>{
    let response = await createEKSAPI(session, baseURL, agentName);
    if (response.status != 200 && response.status != 422) {
        throw Error(`Received status ${response.status} while creating agent. Full response: \n` + await response.text());
    }
    if(response.status === 200) { // status was 200, proceed to create agent
        console.log(`Created agent ${agentName}`);
        response = await getdeploymentFileAPI(session, baseURL, "k8s", agentName);
        await overwriteAndSaveToFile("deploymentFile.yaml", response);
        await executeCLIcommand("kubectl apply -f deploymentFile.yaml");
        let ESInfo, ESText;
        //wait for max 5 minutes until host status is active
        for (let i = 0; i < 5 * 60; i++) {
            ESInfo = await getExecutionHostDetailsAPI(session, baseURL, agentName);
            ESText = await ESInfo.text();
            if (ESText.includes("active")) {
                break;
            }
            await new Promise(r => setTimeout(r, 1000)); //wait for 1 second
        }
        if(!ESText.includes("active")){
            throw Error(`Agent is not active after 5 minutes. Agent info: \n ${ESText}`)
        }
        console.log(`Agent ${agentName} should now be active`);
    }
    if (associated) {
        response = await associateExecutionHostAPI(session, baseURL, spaceName, agentName, namespace, serviceAccount)
        if(response.status != 200 && response.status != 422){ // agent wasn't added successfully and wasn't already associated
            throw Error(`Received status ${response.status} while associating agent to space ${spaceName}. Full response: \n` + await response.text());
        }
        console.log(`Agent ${agentName} is associated to space ${spaceName}`);
    } else {
        response = await disassociateExecutionHostAPI(session, baseURL, spaceName, agentName)
        if(response.status != 200 && response.status != 404){ // agent wasn't removed successfully and was associated to the space
            throw Error(`Received status ${response.status} while removing agent from space ${spaceName}. Full response: \n` + await response.text());
        }
        console.log(`Agent ${agentName} is NOT associated to space ${spaceName}`);
    }
}

/**
 * Validates repository is associated to the relevent space according to a test's dependency.
 * Auto-generates blueprints from asset list, if exists.
 * Throws error if the repository couldn't be added / failed to generate BPs from assets
 * @param {*} testName Name of the test that needs these repositories
 * @param {*} session API session for an account
 * @param {*} baseURL Base URL of the environment, like https://preview.qualilabs.net
 * @param {*} repoList List of repositories, each containing url, token, name, branch & optionally a list of assets
 * @param {*} spaceName Space which the repository will be added to
 */
export const repositoryDepHandler = async(testName, session, baseURL, repoList, spaceName) =>{
    for (const repoParams of repoList) {
        let response = await addRepositoryAPI(session, baseURL, spaceName, repoParams.url, repoParams.token, repoParams.name, repoParams.branch);
        if(response.status === 200){
            console.log(`Created repo '${repoParams.name}' for test '${testName}'`);
        }
        else{
            let responseText = await response.text();
            if (responseText.includes("REPOSITORY_NAME_ALREADY_EXISTS")) {
                console.log(`${testName}: Repository '${repoParams.name}' already exists`);
            } else {
                throw Error(`Received status ${response.status} while adding repository '${repoParams.name}' for test '${testName}'. Full response: \n` + responseText);
            }
        }
        if(repoParams.assets != undefined){
            try{
                await autoGeneratedAssetsHelper(session, baseURL, spaceName, repoParams.name, repoParams.assets)
            }
            catch(err){
                throw Error(`${testName}: Could not generate assets for repository '${repoParams.name}'. Original error: \n ` + err.message);
            }
        }
        if(repoParams.published != undefined){
            for(const blueprint of repoParams.published){
                let response = await publishBlueprintAPI(session, baseURL, spaceName, blueprint, repoParams.name)
                if (response.status != 200){
                    throw Error(`${testName}: Error publishing blueprint '${blueprint}'. Full response: \n ` + await response.text());
                }
                console.log(`${testName}: Blueprint ${blueprint} is published in space ${spaceName}`);
            }
        }
    }
}

const autoGeneratedAssetsHelper = async(session, baseURL, spaceName, repoName, assetList) =>{
    const assetsToGenerate = [];
    for (const assetName of assetList) { //check which assets don't already exist
        const response = await getBlueprintsDetailsInCatalogAPI(session, baseURL, spaceName, `autogen_${assetName}`, 'qtorque');
        const respText = await response.text();
        if(respText.includes("BLUEPRINT_NOT_FOUND")){
            console.log(`Added asset ${assetName} to list for auto-generation`);
            assetsToGenerate.push(assetName);
        }
    }
    if (assetsToGenerate.length === 0) {
        console.log(`All assets for repo ${repoName} were already generated`);
    } 
    else {
        await generateSpecificAssetsFromRepoAPI(session, baseURL, spaceName, repoName, assetsToGenerate) // create blueprints from assets
        for (const assetName of assetsToGenerate) { // publish the blueprints
            let response = await publishBlueprintAPI(session, baseURL, spaceName, `autogen_${assetName}`, 'qtorque')
            if(response.status != 200){
                throw Error(`Failed to publish blueprint generated from asset ${assetName}. Response: \n` + await response.text());
            }
        }
    }
}

export const spaceMembersDepHandler = async(testName, session, baseURL, membersList, spaceName, account) =>{
    for(const member of membersList){
        const email = member.email;
        const password = member.password;
        console.log(`${testName}: Adding ${email} to space ${spaceName}`);
        try {
            await addSpaceMemberHelper(session, baseURL, email, password, spaceName, account);
        } catch (error) {
            throw Error(`${testName}: Error adding user '${email}'. Original error: \n ` + await error.message);
        }
    }
}

const addSpaceMemberHelper = async(session, baseURL, email, password, spaceName, account) =>{
    const secret = generateSecret(email, account);
    let response = await sendInvitationsAPI(session, email, baseURL, spaceName);
    if(response.status != 200){
        const respText = await response.text();
        if(respText.includes("INVITATION_EMAIL_USER_EXISTS")){
            console.log(`${email} is already a member in space ${spaceName}`);
            return;
        }
        throw Error(`Failed to invite member ${email}. Full response: \n` + respText);
    }
    response = await signupUserAPI(baseURL, secret, password);
    if(response.status != 200){
        throw Error(`Failed to sign-up member ${email}. Full response: \n` + await response.text());
    }

}

export const approvalChannelDepHandler = async(testName, session, baseURL, approvalChannels) =>{
    for(const channel of approvalChannels){
        if(!(await checkIfApprovalChannelExistsAPI(session, baseURL, channel.name))){
            const response = await addApprovalChannelAPI(session, baseURL, channel.name, channel.type, channel.approvers);
            if (response.status != 200){
                throw Error(`${testName}: Failed creating approval channel '${channel.name}'. Full response: \n` + await response.text());
            }
            console.log(`${testName}: Created approval channel '${channel.name}'`);
        }
        else{
            console.log(`${testName}: Approval channel '${channel.name}' already exists`);
        }
    }
}