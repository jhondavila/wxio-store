import axios from 'axios'

const service = axios.create({
    // baseURL: process.env.BASE_API, // url = base url + request url
    // withCredentials: true, // send cookies when cross-domain requests
    timeout: 3600 * 1000 // request timeout
})

export default service;
