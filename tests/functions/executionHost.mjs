import fetch from "node-fetch";

export const getdeploymentFile = async (session, myURL) => {
    // 
    const data = {
        "details": {
            "sandbox_namespaces": [
                "gmp-agent"
            ]
        },
        "service_type": "k8s",
        "service_name": "eks"
    }
    const response = await fetch(`${myURL}/api/settings/computeservices/deployment`, {
        "method": "POST",
        "body": JSON.stringify(data),
        "headers": {
            'Authorization': `Bearer ${session}`,
            'Content-Type': 'application/json',
            'Accept': '*/*'
        }
    });
    return response;
};