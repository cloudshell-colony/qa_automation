import fetch from "node-fetch";

const getAllUsersAPI = async (session, myURL) => {
    const userList = await fetch(`${myURL}/api/accounts/users`, {
        "method": "GET",
        "headers": {
            'Authorization': `Bearer ${session}`,
            'Content-Type': 'application/json'
        }
    });
    
    return(userList);
    
};

export default getAllUsersAPI;
