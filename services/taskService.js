// services/taskService.js
import axios from "./api";
import * as authStorage from "./authStorage";

const API_URL = "/tasks";

// ✅ Get single task by ID
export const getTaskById = async (taskId) => {
  const token = await authStorage.getToken();
  console.log("📦 [getTaskById] Token:", token);
  console.log("📦 [getTaskById] Task ID:", taskId);

  const res = await axios.get(`${API_URL}/${taskId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  console.log("✅ [getTaskById] Response:", res.data);
  return res.data;
};

// ✅ Delete a task
export const deleteTaskById = async (taskId) => {
  const token = await authStorage.getToken();
  console.log("🗑️ [deleteTaskById] Token:", token);
  console.log("🗑️ [deleteTaskById] Task ID:", taskId);

  await axios.delete(`${API_URL}/${taskId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  console.log("✅ [deleteTaskById] Task deleted");
};

// ✅ Update a task
export const updateTaskById = async (taskId, updatedData) => {
  const token = await authStorage.getToken();
  console.log("📝 [updateTaskById] Token:", token);
  console.log("📝 [updateTaskById] Task ID:", taskId);
  console.log("📝 [updateTaskById] Data:", updatedData);

  const res = await axios.put(`${API_URL}/${taskId}`, updatedData, {
    headers: { Authorization: `Bearer ${token}` },
  });

  console.log("✅ [updateTaskById] Response:", res.data);
  return res.data;
};
