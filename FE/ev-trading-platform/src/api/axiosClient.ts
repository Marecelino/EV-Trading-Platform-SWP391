// src/api/axiosClient.ts
import axios from "axios";

const baseURL = (
  import.meta.env.VITE_API_URL ?? "http://localhost:3000/api"
).replace(/\/$/, "");

const axiosClient = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
});

axiosClient.interceptors.request.use(async (config) => {
  const token = localStorage.getItem("token"); // Lấy token đã lưu khi đăng nhập
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default axiosClient;
