import axios from "axios";

// 세션에서 userId 가져오기
const user = JSON.parse(sessionStorage.getItem('user'));  // JSON 파싱
const userId = user ? user.userId : null;  // user가 없을 경우 대비
const API_BASE_URL = `http://localhost:8080/api/schedules/${userId}`;


// 일정 목록 가져오기
export const getAllSchedule = async () => {
    const response = await axios.get(`http://localhost:8080/api/schedules/${userId}/`);
    console.log( "일정 가져오기 실행", response.data);
    return response.data;
  };

  // 일정 추가하기
export const createSchedule = async (schedule) => {
    const response = await axios.post(`${API_BASE_URL}/`, schedule);
    return response.data;
  };

  //일정 삭제
  export const deleteSchedule = async (scheduleId) => {
    console.log("deleteSchedule 함수 호출, scheduleId:", scheduleId);  // 삭제할 id 로그 확인
    const response = await axios.delete(`${API_BASE_URL}/${scheduleId}`);  // 기존 API_BASE_URL에 scheduleId 추가
    return response;
  }

  //일정 수정
  export const updateSchedule = async (scheduleId, updatedData) => {
    return axios.put(`${API_BASE_URL}/${scheduleId}`, updatedData);
  };

  //날짜별 일정 가져오기
  export const getScheduleByDate = async (date) => {
    const response = await axios.get(`${API_BASE_URL}/${date}`);
   
    return response.data;
  }

  // 알람이 설정된 일정 조회
  export const getSchedulesWithAlarm = async () => {
    const response = await axios.get(`${API_BASE_URL}/alarm`);
    return response.data;
  }

  //-------------------todo 일정 
  // 가져오기
  export const getTodo = async () => {
    const response = await axios.get(`${API_BASE_URL}/todos`);
    console.log( "todo 가져오기 실행", response.data);
    return response.data;
  };
  // 추가
  export const createTodo = async (todo) => {
      const response = await axios.post(`${API_BASE_URL}/todos`, todo);
      return response.data;
    };
    // 삭제
  export const deleteTodo = async (todoId) => {
    const response = await axios.delete(`${API_BASE_URL}/todos/${todoId}`);  // 기존 API_BASE_URL에 scheduleId 추가
    return response;
  }
  // 수정
  export const updateTodo = async (todoId, updatedData) => {
    return axios.put(`${API_BASE_URL}/todos/${todoId}`, updatedData);
  };

  //학생의 설문조사 가져오기
  export const getSurveyTitles = async (userId) => {
    const response = await axios.get(`http://localhost:8080/api/schedules/${userId}/calendar`);
    return response.data;
  };

//헤더에서 띄울 알람 가져오기
  export const fetchAlarmList = async (userId) => {
    const response = await axios.get(`http://localhost:8080/api/alarms/${userId}`);
    return response.data;
  };

  //완료된 투두 밑줄 상황 업데이트
  export const updateTodoCompletion = async (todoId, updatedData) => {
    return axios.put(`${API_BASE_URL}/todos/${todoId}/complete`, updatedData);
  };

  // 🔄 알림 읽음 처리
export const markAllAlarmsAsRead = async (userId) => {
  const res = await fetch(`http://localhost:8080/api/alarms/read/${userId}`, {
    method: "PUT",
  });
  if (!res.ok) throw new Error("알림 읽음 처리 실패");
};