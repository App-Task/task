// services/api.js
import axios from "axios";

const instance = axios.create({
  baseURL: "https://task-kq94.onrender.com/api",
  headers: {
    "Content-Type": "application/json",
  },
});

export default instance;
