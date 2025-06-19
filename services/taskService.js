// services/taskService.js
import axios from "./api";
import * as authStorage from "./authStorage";

const API_URL = "/tasks";

// ✅ Get single task by ID
export const getTaskById = async (taskId) => {
  const token = await authStorage.getToken();


  const res = await axios.get(`${API_URL}/${taskId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  return res.data;
};

// ✅ Delete a task
export const deleteTaskById = async (taskId) => {
  const token = await authStorage.getToken();


  await axios.delete(`${API_URL}/${taskId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });


};

// ✅ Update a task
export const updateTaskById = async (taskId, updatedData) => {
  const token = await authStorage.getToken();


  const res = await axios.put(`${API_URL}/${taskId}`, updatedData, {
    headers: { Authorization: `Bearer ${token}` },
  });


  return res.data;
};
