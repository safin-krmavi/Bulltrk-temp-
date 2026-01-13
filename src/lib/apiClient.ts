import axios from "axios";

export const apiClient = axios.create({
  baseURL:"http://localhost:5000/api/v1",
  headers: {
    "Content-Type": "application/json",
  },
});

// ✅ Attach token automatically
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("AUTH_TOKEN");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);
