// src/api/authApi.ts
import axiosClient from "./axiosClient";

const authApi = {
  // POST /api/auth/login
  login: (email: string, password: string) => {
    return axiosClient.post("/auth/login", { email, password });
  },
  // register
  register: (fullName: string, email: string, password: string) => {
    return axiosClient.post("/auth/register", {
      name: fullName,
      email,
      password,
    });
  },
};

export default authApi;
