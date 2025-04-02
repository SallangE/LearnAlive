import axios from "axios";

const API_BASE_URL = "http://localhost:8080/api";

// 기존 함수들...
export const createClassMilestones = async (classId, milestones) => {
  const response = await axios.post(`${API_BASE_URL}/class-milestones/${classId}`, { milestones });
  return response.data;
};

export const getClassMilestones = async (classId) => {
  const response = await axios.get(`${API_BASE_URL}/class-milestones/${classId}`);
  return response.data;
};

export const updateClassMilestone = async (milestoneId, milestoneData) => {
  const response = await axios.put(`${API_BASE_URL}/class-milestones/${milestoneId}`, milestoneData);
  return response.data;
};

// 삭제 API 추가
export const deleteClassMilestone = async (milestoneId) => {
  const response = await axios.delete(`${API_BASE_URL}/class-milestones/${milestoneId}`);
  return response.data;
};

export const getCommonMilestonesForPost = async (classId, postId) => {
  const response = await axios.get(`${API_BASE_URL}/class-milestones/${classId}/posts/${postId}`);
  return response.data;
};

export const updatePostMilestoneStatus = async (postId, milestoneId, status) => {
  const response = await axios.put(`${API_BASE_URL}/post-milestone-status/${postId}/${milestoneId}`, null, {
    params: { status },
  });
  return response.data;
};