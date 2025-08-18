import axios from "axios";

import * as SecureStore from "expo-secure-store";


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

    // ✅ Save user ID securely for message alignment later
    if (response.data?.user?.id) {
      await SecureStore.setItemAsync("user_id", response.data.user.id.toString());
    }

    return response.data;
  } catch (error) {
    const msg = error.response?.data?.msg || "Server error";
    throw new Error(msg);
  }
};

import { getToken } from "./authStorage";

export const fetchCurrentUser = async () => {
  const token = await getToken();
  const response = await axios.get(`${API_URL}/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data; // returns { name, email }
};


export const updateUserProfile = async (data) => {
  const token = await getToken();
  const response = await axios.put(`${API_URL}/me`, data, {
    headers: { Authorization: token },
  });
  return response.data;
};

export const forgotPassword = async (email, role) => {
  try {
    console.log(`🔍 Sending forgot password request:`, { email, role });
    
    const response = await axios.post(`${API_URL}/forgot-password`, { email, role });
    return response.data; // always returns a generic success message
  } catch (error) {
    console.error(`❌ Forgot password error:`, error.response?.data || error.message);
    const msg = error?.response?.data?.msg || "Something went wrong.";
    throw new Error(msg);
  }
};

export const resetPassword = async ({ email, code, newPassword, role }) => {
  try {
    console.log(`🔍 Sending reset password request:`, { email, code: code ? '***' : 'missing', newPassword: newPassword ? '***' : 'missing', role });
    
    const response = await axios.post(`${API_URL}/reset-password`, {
      email,
      code,
      newPassword,
      role,
    });
    return response.data; // { msg: "Password updated..." }
  } catch (error) {
    console.error(`❌ Reset password error:`, error.response?.data || error.message);
    const msg = error?.response?.data?.msg || "Reset failed.";
    throw new Error(msg);
  }
};

