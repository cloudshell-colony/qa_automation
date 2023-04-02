import { sendInvitationsAPI, signupUserAPI } from "./tests/functions/accounts.mjs";
import { generateSpecificAssetsFromRepoAPI, getBlueprintsDetailsInCatalogAPI, publishBlueprintAPI } from "./tests/functions/blueprints.mjs";
import { associateExecutionHostAPI, createEKSAPI, disassociateExecutionHostAPI, getdeploymentFileAPI, getExecutionHostDetailsAPI } from "./tests/functions/executionHosts.mjs";
import { executeCLIcommand, generateSecret, overwriteAndSaveToFile } from "./tests/functions/general.mjs";
import { addApprovalChannelAPI, checkIfApprovalChannelExistsAPI } from "./tests/functions/policies.mjs";
import { addRepositoryAPI, createSpaceAPI } from "./tests/functions/spaces.mjs"

const namespace = process.env.nameSpace;
const serviceAccount = process.env.serviceAccount;
export var spacesCreated = 0;
export var agentsCreated = 0;
export var repositoriesCreated = 0;
export var assetsAutoGenerated = 0;
export var usersAdded = 0;
export var approvalChannelsCreated = 0;

/**
 * Validates a space exists according to a test's dependency
 * Throws error if space didn't exist & couldn't be created
 * @param {string} session API session for an account
 * @param {string} baseURL base URL of the environment, like https://preview.qualilabs.net
 * @param {string} spaceName name of the requested space
 */
export const spaceDepHandler = async(session, baseURL, spaceName) => {
    const response = await createSpaceAPI(baseURL, session, spaceName);
    if(response.status === 422){
        console.log(`Space '${spaceName}' already exists`);
    }
    else{
        if (response.status === 200) {
            console.log(`Created space '${spaceName}'.`);
            spacesCreated++;
        } else {
            throw Error(`Received status ${response.status} while creating space '${spaceName}'. Full response: \n` + await response.text());
        }
    }
}

/**
 * Validates agents exist and are associated to relevent spaces according to a test's dependency.
 * Throws error if the agents couldn't be created or associated to the relevant spaces
 * @param {*} session API session for an account
 * @param {*} baseURL base URL of the environment, like https://preview.qualilabs.net
 * @param {Array} agentList list of agents, each containing name, type & associated (boolean) value
 * @param {*} spaceName name of the requested space
 */
export const agentDepHandler = async(session, baseURL, agentList, spaceName) =>{
    for (const agentParams of agentList) {
        let agentName = agentParams.name;
        let associated = agentParams.associated;
        try {
            await addAgentHelper(session, baseURL, agentName, associated, spaceName)
        } catch (err) {
            throw Error(`Failed to add agent '${agentName}' for space '${spaceName}'. Full response: \n` + err.message);
        }
    }
}

/**
 * Helper for agentDepHandler.
 * Creates an agent if doesn't exist, and associates it if needed according to @param associated
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
        agentsCreated++;
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
 * @param {*} session API session for an account
 * @param {*} baseURL Base URL of the environment, like https://preview.qualilabs.net
 * @param {*} repoList List of repositories, each containing url, token, name, branch & optionally a list of assets
 * @param {*} spaceName Space which the repository will be added to
 */
export const repositoryDepHandler = async(session, baseURL, repoList, spaceName) =>{
    for (const repoParams of repoList) {
        let response = await addRepositoryAPI(session, baseURL, spaceName, repoParams.url, repoParams.token, repoParams.name, repoParams.branch);
        if(response.status === 200){
            console.log(`Created repo '${repoParams.name}' in space '${spaceName}'`);
            repositoriesCreated++;
        }
        else{
            let responseText = await response.text();
            if (responseText.includes("REPOSITORY_NAME_ALREADY_EXISTS")) {
                console.log(`Repository '${repoParams.name}' already exists`);
            } else {
                throw Error(`Received status ${response.status} while adding repository '${repoParams.name}'. Full response: \n` + responseText);
            }
        }
        if(repoParams.assets != undefined){
            try{
                await autoGeneratedAssetsHelper(session, baseURL, spaceName, repoParams.name, repoParams.assets)
            }
            catch(err){
                throw Error(`Could not generate assets for repository '${repoParams.name}'. Original error: \n ` + err.message);
            }
        }
        if(repoParams.published != undefined){
            for(const blueprint of repoParams.published){
                let response = await publishBlueprintAPI(session, baseURL, spaceName, blueprint, repoParams.name)
                if (response.status != 200){
                    throw Error(`Error publishing blueprint '${blueprint}'. Full response: \n ` + await response.text());
                }
                console.log(`Blueprint ${blueprint} is published in space ${spaceName}`);
            }
        }
    }
}

/**
 * Helper for repositoryDepHandler.
 * Auto-generates assets if blueprint doesn't already exists and published it.
 * @param {*} session API session for an account
 * @param {*} baseURL base URL of the environment, like https://preview.qualilabs.net
 * @param {*} spaceName Space to associate the agent to if necessary
 * @param {*} repoName Name of the repository to check for assets
 * @param {*} assetList List of assets name to make sure are auto-generated as a blueprint & publishd
 */
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
        assetsAutoGenerated += assetsToGenerate.length;
        for (const assetName of assetsToGenerate) { // publish the blueprints
            let response = await publishBlueprintAPI(session, baseURL, spaceName, `autogen_${assetName}`, 'qtorque')
            if(response.status != 200){
                throw Error(`Failed to publish blueprint generated from asset ${assetName}. Response: \n` + await response.text());
            }
        }
    }
}

/**
 * Adds all the users needed for a test, both admins and space members.
 * Throws error if a user could not be added.
 * @param {*} session API session for an account
 * @param {*} baseURL Base URL of the environment, like https://preview.qualilabs.net
 * @param {*} userList List of users, each containing email, password & role.
 * @param {*} spaceName Space which the repository will be added to
 * @param {*} account Name of the account, needed to sign up users using the API
 */
export const usersDepHandler = async(session, baseURL, usersList, spaceName, account) =>{
    for(const user of usersList){
        const email = user.email;
        const password = user.password;
        const role = user.role;
        console.log(`Adding ${email} to space ${spaceName}`);
        try {
            await addSpaceMemberHelper(session, baseURL, email, password, role, spaceName, account);
        } catch (error) {
            throw Error(`Error adding user '${email}'. Original error: \n ` + await error.message);
        }
    }
}

/**
 * Helper for usersDepHandler.
 * Sign-ups user with certain email & password to a given account and/or space.
 * @param {*} session API session for an account
 * @param {*} baseURL Base URL of the environment, like https://preview.qualilabs.net
 * @param {*} email Email of the user
 * @param {*} password User's password
 * @param {*} role User's role. Can be 'Admin', 'Space Debeloper'
 * @param {*} spaceName Space to add the user to
 * @param {*} account Name of the account to generate secret and signup user
 */
const addSpaceMemberHelper = async(session, baseURL, email, password, role, spaceName, account) =>{
    const secret = generateSecret(email, account);
    let response = await sendInvitationsAPI(session, email, baseURL, spaceName, role);
    if(response.status != 200){
        const respText = await response.text();
        if(respText.includes("INVITATION_EMAIL_USER_EXISTS")){
            console.log(`${email} is already a user in account '${account}' and/or space '${spaceName}'`);
            return;
        }
        throw Error(`Failed to invite user ${email}. Full response: \n` + respText);
    }
    response = await signupUserAPI(baseURL, secret, password);
    if(response.status != 200){
        throw Error(`Failed to sign-up user ${email}. Full response: \n` + await response.text());
    }
    usersAdded++;
}

/**
 * Adds all the approval channels needed for a test to run.
 * Throws error if an approval channel could not be added.
 * @param {*} session API session for an account
 * @param {*} baseURL Base URL of the environment, like https://preview.qualilabs.net
 * @param {*} approvalChannels List of approval channels to add, each containing name, type & approvers (list of emails)
 */
export const approvalChannelDepHandler = async(session, baseURL, approvalChannels) =>{
    for(const channel of approvalChannels){
        if(!(await checkIfApprovalChannelExistsAPI(session, baseURL, channel.name))){
            const response = await addApprovalChannelAPI(session, baseURL, channel.name, channel.type, channel.approvers);
            if (response.status != 200){
                throw Error(`Failed creating approval channel '${channel.name}'. Full response: \n` + await response.text());
            }
            console.log(`Created approval channel '${channel.name}'`);
            approvalChannelsCreated++;
        }
        else{
            console.log(`Approval channel '${channel.name}' already exists`);
        }
    }
}