import axios from './axios'
import URLConfigs from '../URLConfigs'

const API = {

}

// async function CallAPI(url, method = 'GET', data = {}, headers = {}) {
//     try {
//         console.log(`API URL: ${method} ${url} ${JSON.stringify(data)}`)
//         const response = await axios({
//             method,
//             url,
//             data,
//             params: method === 'GET' ? data : null,
//             headers
//         })
//         return response?.data
//     } catch (err) {
//         console.log('API ERROR', err)
//         if (err?.response?.status === 401) {
//             localStorage.clear()
//             window.location.href = '/'
//             return err?.response?.data
//         }
//     }
// }

export default API