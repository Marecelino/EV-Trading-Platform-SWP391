// src/api/axiosClient.ts
import axios from 'axios';

const axiosClient = axios.create({
  baseURL: 'http://localhost:5000/api', // Base URL
  headers: {
    'Content-Type': 'application/json',
  },
});


// axiosClient.interceptors.request.use(async (config) => {
//   const token = localStorage.getItem('jwt_token');
//   if (token) {
//     config.headers.Authorization = `Bearer ${token}`;
//   }
//   return config;
// });

export default axiosClient;