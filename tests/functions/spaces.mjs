import fetch from "node-fetch";

export default function removeUserFromSpaceAPI(user_email, myURL, session, space_name) {
    
    const response = fetch(`${myURL}/api/spaces/${space_name}/users/${user_email}`, {
        "method": "DELETE",
        "headers": {
            'Authorization': `Bearer ${session}`,
            'Content-Type': 'application/json'
        }
    });
    return response;
};

// export default deleteUser;

// const deleteTheblip = await deleteUser("marvel2@dc.com", "http://colony.localhost:80", "dTc48Kt2GyLSzviT7zf3By6kP6eGIWeOOEJ5AaUpHrI", "gmp");
// const deleteTheblipjson = await deleteTheblip.text()
// console.log(`testing my delete ${deleteTheblip.status}, ${await deleteTheblipjson}`);
