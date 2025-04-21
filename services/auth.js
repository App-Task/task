import axios from "axios";

// 👇 Replace with your actual local IP address
const API_URL = "https://task-kq94.onrender.com/api/auth";
/**
 * Sends user registration data to the backend.
 * @param {Object} userData - { name, email, password }
 * @returns {Object} - Response data from backend
 */
export const registerUser = async (userData) => {
  try {
    const response = await axios.post(`${API_URL}/register`, userData);
    return response.data;
  } catch (error) {
    // Forward a cleaner error message for alerts
    const message =
      error?.response?.data?.msg || "Something went wrong during registration.";
    throw new Error(message);
  }
};

export const loginUser = async (credentials) => {
  try {
    const response = await axios.post(`${API_URL}/login`, credentials);
    return response.data;
  } catch (error) {
    // Forward backend error to frontend catch
    const msg = error.response?.data?.msg || "Server error";
    throw new Error(msg);
  }
};
import { getToken } from "./authStorage";

export const fetchCurrentUser = async () => {
  const token = await getToken();
  const response = await axios.get(`${API_URL}/me`, {
    headers: { Authorization: token },
  });
  return response.data; // returns { name, email }
};
