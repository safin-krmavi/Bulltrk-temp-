import axios from "axios";

const baseURL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/v1";

const apiClient = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// Request interceptor: add auth header and normalize URL
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("AUTH_TOKEN");
    if (token) {
      config.headers = config.headers || {};
      (config.headers as any).Authorization = `Bearer ${token}`;
    }

    if (config.url && !/^https?:\/\//i.test(config.url)) {
      // Ensure it starts with a single slash
      const path = config.url.startsWith("/") ? config.url : `/${config.url}`;
      // Strip any duplicate /api/v1 prefix in the path
      config.url = path.replace(/^\/+api\/v1(\/|$)/i, "/");
    }

    // Simple debug log
    // console.log("API Request:", {
    //   url: config.url,
    //   method: config.method,
    //   headhttps://xkw0wblf-5000.inc1.devtunnels.ms/ers: config.headers,
    // });
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // console.error("API Error:", {
    //   url: error?.config?.url,
    //   status: error?.response?.status,
    //   data: error?.response?.data,
    //   message: error?.message,
    // });
    return Promise.reject(error);
  }
);

export default apiClient;