
// import * as dotenv from 'dotenv';
const dotenv = require('dotenv')



// import './dotenv';
dotenv.config();
// require('dotenv').config();
const { getSessionAPI } = require("./tests/functions/accounts.mjs");
const { getFirstSandboxesAPI, getSandboxDetailsAPI } = require('./tests/functions/sandboxes.mjs');
const fs = require('fs');

const baseURL: string = process.env.baseURL;
const password: string = process.env.allAccountsPassword;
const account: string = process.env.account;
const user: string = process.env.adminEMail
let sendboxes:any
const spaceNameList:string[] = ['update-test', 'API-tests', 'EndingSB', 'drift-test', 'endlessSB', 'Actions', 'Annotations', 'extend-test', 'PendingTest', 'Workflows', 'bp-validation', 'aws-policies', 'Collaborator']
let session:any;
let ids:string[] = []
let id:string
const reportData:any[] = []
session = await getSessionAPI(user, password, baseURL, account)
console.log(session);

for (let i = 0; i < spaceNameList.length; i++) {
    const spaceName = spaceNameList[i];
    sendboxes = await getFirstSandboxesAPI(session, baseURL, spaceName, 10)
    const sendboxesJson = await sendboxes.json()
    ids = await sendboxesJson.map((obj: { id: any; }) => obj.id)
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





export { };
// export { };

