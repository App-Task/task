import axios from "axios";
import { storeToken } from "./authStorage";

const API_URL = "https://a59d-41-45-81-142.ngrok-free.app/api/auth";




export const registerUser = async (data) => {
  try {
    const res = await axios.post(`${API_URL}/register`, data);
    return res.data;
  } catch (err) {
    throw err.response?.data?.msg || "Registration failed";
  }
};

export const loginUser = async (data) => {
  try {
    const res = await axios.post(`${API_URL}/login`, data);
    await storeToken(res.data.token); // ✅ Save the token securely
    return res.data;
  } catch (err) {
    throw err.response?.data?.msg || "Login failed";
  }
};
