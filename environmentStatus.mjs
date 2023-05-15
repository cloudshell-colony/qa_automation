import * as dotenv from 'dotenv';
import { getSessionAPI } from "./tests/functions/accounts.mjs";
import { getFirstSandboxesAPI, getSandboxDetailsAPI } from './tests/functions/sandboxes.mjs';
import fs from 'fs';




dotenv.config();

const baseURL = process.env.baseURL
const password = process.env.allAccountsPassword;
const account = process.env.account;
const user = process.env.adminEMail
let sendboxes
const spaceNameList = ['update-test', 'API-tests', 'EndingSB', 'drift-test', 'endlessSB', 'Actions', 'Annotations', 'extend-test', 'PendingTest', 'Workflows', 'bp-validation', 'aws-policies', 'Collaborator']
let session;
let ids = []
let id
const reportData = []
session = await getSessionAPI(user, password, baseURL, account)
console.log(session);

for (let i = 0; i < spaceNameList.length; i++) {
    const spaceName = spaceNameList[i];
    sendboxes = await getFirstSandboxesAPI(session, baseURL, spaceName, 10)
    const sendboxesJson = await sendboxes.json()
    ids = await sendboxesJson.map(obj => obj.id)
    for (let k = 0; k < ids.length; k++) {
        id = ids[k];
        const sbDetails = await getSandboxDetailsAPI(session, baseURL, spaceName, id)
        const sbResponse = await sbDetails.json()
        const state = await sbResponse.details.computed_status
        const error = await sbResponse.details.state.errors
        const startTime = await sbResponse.details.state.execution.retention.time
        switch (state) {
            case 'Terminating':
            case 'Active':
            case 'Launching':
            case 'Terminate Failed':
            case 'Pending':    

                const report = {
                    id,
                    spaceName,
                    state,
                    startTime,
                    error: JSON.stringify(error)
                };
                reportData.push(report);
                console.log(report);
                // const report = `env ${id} from space ${spaceName} is in constant ${state} status since ${startTime}. The error is ${JSON.stringify(error)}`;
                // console.log(report);                
                break;
        }
      
      
    }
}

// Convert reportData to CSV string
const csvContent = reportData.map(report => {
    return Object.values(report).join(',');
  }).join('\n');
  
  // Write CSV content to a file
  fs.writeFileSync('report.csv', csvContent, 'utf-8');
  console.log('Report exported to report.csv');




