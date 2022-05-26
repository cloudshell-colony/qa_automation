const {expect } = require('@playwright/test');
const baseURL = "https://asaf.qtorque.io/api";

const apiGet = async (request, path, options) => {
    const res = await request.get(`${baseURL}${path}`, {
    headers: {
        "Authorization": `Bearer ${token}`,
    },
    options
    });
    return res;
}
const apiPost = async (request, path, options) => {
    const res = await request.post(`${baseURL}${path}`, {
    headers: {
        "Authorization": `Bearer ${token}`,
    },
    options
    });
    return res;
}
const apiPut = async (request, path, options) => {
    const res = await request.put(`${baseURL}${path}`, {
    headers: {
        "Authorization": `Bearer ${token}`,
    },
    options
    });
    return res;
}

const apiDelete = async (request, path, options) => {
    const res = await request.delete(`${baseURL}${path}`, {
    headers: {
        "Authorization": `Bearer ${token}`,
    },
    options
    });
    return res;
}


module.exports = {apiGet, apiPost, apiPut, apiDelete};