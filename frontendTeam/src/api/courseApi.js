import axios from "axios";
const API_BASE_URL = "http://localhost:8080/api/course";

// ✅ 예비 수강신청 가능한 강의 목록 가져오기
export const fetchPreRegistrationCourses = async () => {
  const response = await axios.get(`${API_BASE_URL}/pre/courses`);
  // dayOfWeek 콤마(,)로 넘어오니 배열로 변환
  const transformed = response.data.map(course => ({
    ...course,
    dayOfWeek: course.dayOfWeek ? course.dayOfWeek.split(',') : []
  }));
  return transformed;
};

// ✅ 학생의 예비 수강신청 내역 가져오기
export const fetchMyPreRegisteredCourses = async (studentId, preset) => {
  const response = await axios.get(`${API_BASE_URL}/pre/mycourses`, {
    params: { studentId, preset }
  });
  const transformed = response.data.map(course => ({
    ...course,
    dayOfWeek: course.dayOfWeek ? course.dayOfWeek.split(',') : []
  }));
  return transformed;
};

// ✅ 예비 수강신청 추가 (장바구니 담기)
export const addPreRegistration = async ({ studentId, classId, preset }) => {
  const response = await axios.post(`${API_BASE_URL}/pre`, { studentId, classId, preset }, {
    headers: { "Content-Type": "application/json" }
  });
  return response.data;
};

// ✅ 예비 수강신청 삭제 (취소)
export const removePreRegistration = async ({ studentId, classId, preset }) => {
  const response = await axios.delete(`${API_BASE_URL}/pre`, {
    params: { studentId, classId, preset }
  });
  return response.data;
};

//학점 정보 표기
export const fetchCreditInfo = async (studentId) => {
  const response = await axios.get(`${API_BASE_URL}/credit-info/${studentId}`);
  return response.data;
};

// 강의별 신청 인원 조회 API
export const fetchPreRegistrationCount = async () => {
  const response = await axios.get(`${API_BASE_URL}/pre/counts`);
  return response.data;
};

// ✅ 본 수강신청 추가 API
export const addFinalRegistration = async ({ studentId, classId }) => {
  const response = await axios.post(`http://localhost:8080/api/course/final`, {
    studentId,
    classId
  });
  return response.data;
};

// ✅ 본 수강신청 내역 조회
export const fetchFinalRegisteredCourses = async (studentId) => {
  const response = await axios.get(`http://localhost:8080/api/course/final/mycourses`, {
    params: { studentId }
  });
  const transformed = response.data.map(course => ({
    ...course,
    dayOfWeek: course.dayOfWeek ? course.dayOfWeek.split(',') : []
  }));
  return transformed;
};

// 강의별 본 수강신청 인원 조회 API
export const fetchFinalRegistrationCount = async () => {
  const response = await axios.get(`${API_BASE_URL}/final/counts`);
  return response.data;
};

// ✅ 본 수강신청 취소 API 
export const removeFinalRegistration = async ({ studentId, classId }) => {
  const response = await axios.delete(`${API_BASE_URL}/final`, {
    params: { studentId, classId }
  });
  return response.data;
};