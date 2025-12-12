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
    let message = error?.response?.data?.msg || "Something went wrong during registration.";
    
    // Include validation details if available - format for better Android display
    if (error?.response?.data?.details && Array.isArray(error.response.data.details) && error.response.data.details.length > 0) {
      // Format details in a more readable and user-friendly way
      const formattedDetails = error.response.data.details
        .map(detail => {
          // Make error messages more user-friendly and clear
          if (detail.includes("2 character") || detail.includes("at least 2")) {
            return "Name must be at least 2 characters";
          }
          if (detail.includes("email") || detail.includes("Invalid email")) {
            return "Please enter a valid email address";
          }
          if (detail.includes("8 character") || detail.includes("at least 8")) {
            return "Password must be at least 8 characters";
          }
          if (detail.includes("5 character") || detail.includes("at least 5")) {
            return "Phone number must be at least 5 characters";
          }
          if (detail.includes("max")) {
            return detail;
          }
          return detail;
        })
        .join("\n");
      
      // Combine message and details with proper formatting
      // Use simple newline format that works on both iOS and Android
      if (message === "Invalid request") {
        message = `Please fix the following errors:\n\n${formattedDetails}`;
      } else {
        message = `${message}\n\n${formattedDetails}`;
      }
    }
    
    console.error("Registration error:", {
      status: error?.response?.status,
      data: error?.response?.data,
      formattedMessage: message,
      userData: { ...userData, password: "***" }
    });
    
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

