import axios from "axios";

const fallbackApiUrl =
  typeof window !== "undefined" && window.location.hostname === "localhost"
    ? "http://localhost:4000"
    : "https://attendence-status-6.onrender.com";

export const API_BASE_URL = (import.meta.env.VITE_API_URL || fallbackApiUrl).replace(/\/+$/, "");

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === "ERR_NETWORK") {
      error.friendlyMessage =
        "Cannot reach the JSON Server backend. Make sure it is running on " +
        API_BASE_URL;
    } else {
      error.friendlyMessage =
        error.response?.data?.message ||
        error.message ||
        "Something went wrong";
    }

    return Promise.reject(error);
  }
);

export default api;