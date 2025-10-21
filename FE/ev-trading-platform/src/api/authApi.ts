// src/api/authApi.ts
import axiosClient from "./axiosClient";

const authApi = {
  // POST /api/auth/login
  login: (email: string, password: string) => {
    return axiosClient.post("/auth/login", { email, password });
  },
  // register
  register: (email: string, password: string) => {
    return axiosClient.post("/auth/register", {
      email,
      password,
    });
  },
  completeRegistration: (
    userId: string,
    payload: {
      fullName: string;
      phone: string;
      address: string;
      dateOfBirth: string;
    }
  ) => {
    return axiosClient.post("/auth/register/complete", {
      userId,
      ...payload,
    });
  },
};

export default authApi;
