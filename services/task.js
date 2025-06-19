import axios from "./api";

// ✅ Fetch single task by ID
export const fetchTaskById = async (taskId) => {
  const res = await axios.get(`/tasks/${taskId}`);
  return res.data;
};

// ✅ Update task by ID
export const updateTask = async (taskId, updatedData) => {
  const res = await axios.put(`/tasks/${taskId}`, updatedData);
  return res.data;
};

// ✅ Delete task by ID
export const deleteTask = async (taskId) => {
  const res = await axios.delete(`/tasks/${taskId}`);
  return res.data;
};
