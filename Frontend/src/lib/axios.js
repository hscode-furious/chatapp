import axios from "axios";

export const axiosInstance = axios.create({
    // baseURL: "https://chatapp-2syn.onrender.com",
  baseURL: "http://localhost:5000/api",
  withCredentials: true,
});
