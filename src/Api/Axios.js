import axios from 'axios'
import URLConfigs from './URLConfigs';

let instance = axios.create({
    baseURL: URLConfigs?.baseUrl,
    headers: {
        "Content-Type": "application/json",
        "accept": "application/json"
    },
})

instance.interceptors.request.use(async function (URLConfigs) {

    try {
        const token = localStorage.getItem('jwtToken');
        if (token) {
            URLConfigs.headers.Authorization = token
        }
        return URLConfigs
    } catch {
        return URLConfigs
    }
})

export default instance