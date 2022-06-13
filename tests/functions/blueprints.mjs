import fetch from "node-fetch";

const getPublishedBlueprints = async (session, space_name, myURL) => {
    
    const PBPList = await fetch(`${myURL}/api/spaces/${space_name}/blueprints`, {
        "method": "GET",
        "headers": {
            'Authorization': `Bearer ${session}`,
            'Content-Type': 'application/json'
        }
    });
    return(PBPList);    
};

export default getPublishedBlueprints;