import axios from "axios";
import Swal from "sweetalert2";

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000",
});

axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error.response?.status;

    // Token expired or not authenticated
    if (status === 401) {
      localStorage.clear();

      await Swal.fire({
        icon: "warning",
        title: "Session Expired",
        text: "Please log in again.",
        confirmButtonText: "OK",
      });

      window.location.href = "/login";
    }

    // Authenticated but no permission
    if (status === 403) {
      await Swal.fire({
        icon: "error",
        title: "403 - Access Denied",
        text: error.response?.data?.message ||
              "You don't have permission to perform this action.",
        confirmButtonColor: "#d33",
      });
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
