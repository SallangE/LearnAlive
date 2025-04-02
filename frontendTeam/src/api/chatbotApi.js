import axios from 'axios';

const API_URL = 'http://localhost:8080/api/chatbot';

// ✅ 모든 챗봇 질문/답변 가져오기
export const fetchAllChatBots = async () => {
  try {
    const response = await axios.get(`${API_URL}/all`);
    return response.data;
  } catch (error) {
    console.error('❌ 챗봇 데이터를 불러오는 데 실패했습니다:', error);
    throw error;
  }
};

// ✅ 특정 키워드로 챗봇 질문 검색
export const searchChatBot = async (keyword) => {
  try {
    const response = await axios.get(`${API_URL}/search`, {
      params: { keyword },
    });
    return response.data;
  } catch (error) {
    console.error('❌ 챗봇 검색 실패:', error);
    throw error;
  }
};