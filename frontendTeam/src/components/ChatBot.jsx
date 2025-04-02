import { useState, useEffect, useRef } from 'react';
import { fetchAllChatBots, searchChatBot } from '../api/chatbotApi'; // ✅ API 파일에서 가져오기
import '../styles/ChatBot.css';

const ChatBot = () => {
  const [isVisible, setIsVisible] = useState(false); // 대화창의 표시 여부
  const [chatBotData, setChatBotData] = useState(null); // 챗봇 데이터
  const [searchKeyword, setSearchKeyword] = useState(''); // 검색어 상태
  const [filteredQuestions, setFilteredQuestions] = useState([]);
  const [messages, setMessages] = useState([]); // 사용자가 보낸 메시지와 챗봇의 응답을 저장할 상태
  const chatEndRef = useRef(null); // 채팅 끝을 참조하는 Ref (스크롤을 맨 아래로 이동하기 위해 사용)

  useEffect(() => {
    const loadChatBotData = async () => {
      try {
        const data = await fetchAllChatBots();
        setChatBotData(data);
      } catch (error) {
        console.error('ChatBot 데이터 불러오기 실패:', error);
      }
    };
    loadChatBotData();
  }, []);

  useEffect(() => {
    if (!searchKeyword.trim()) {
      setFilteredQuestions([]);
      return;
    }
    const filtered = chatBotData.filter((bot) =>
      bot.question.includes(searchKeyword)
    );
    setFilteredQuestions(filtered);
  }, [searchKeyword, chatBotData]);

  const handleSendMessage = async () => {
    if (!searchKeyword.trim()) return;

    setMessages([...messages, { text: searchKeyword, sender: 'user' }]);

    try {
      const data = await searchChatBot(searchKeyword);
      const botResponse =
        data.length > 0
          ? data[0].answer
          : '질문을 잘 이해하지 못했어요. 😥 다시 질문해 주세요!';
      setMessages((prevMessages) => [
        ...prevMessages,
        { text: botResponse, sender: 'bot' },
      ]);
    } catch (error) {
      console.error('챗봇 응답 실패:', error);
    }

    setSearchKeyword('');
    setFilteredQuestions([]);
  };

  const handleQuestionClick = (question) => {
    setSearchKeyword(question);
    setFilteredQuestions([]);
  };
  // 채팅 끝으로 스크롤을 자동으로 이동
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleKeywordClick = (keyword) => {
    setSearchKeyword(keyword); // 클릭한 키워드를 입력란에 표시
    handleSendMessage(); // 메시지 처리 함수 호출
  };

  if (!isVisible) {
    return (
      <div className="ChatBot-image" onClick={() => setIsVisible(true)}>
        <img src="/ChatBot.png" alt="ChatBot" />
        {/* 챗봇 이미지 클릭 시 대화창 열기 */}
      </div>
    );
  }

  return (
    <div className="chatbot-wrapper">
    <div className="chatbot-container">
      <div className="chatbot-header">
        <span className="chatbot-title">ChatBot 💬</span>
        <button className="close-btn" onClick={() => setIsVisible(false)}>
          X
        </button>
      </div>

      {/* 키워드 박스 */}
      <div className="keyword-box">
        <span
          className="keyword"
          onClick={() => handleKeywordClick('회원가입')}
        >
          회원가입
        </span>
        <span className="keyword" onClick={() => handleKeywordClick('로그인')}>
          로그인
        </span>
        <span className="keyword" onClick={() => handleKeywordClick('강의실')}>
          강의실
        </span>
        <span className="keyword" onClick={() => handleKeywordClick('게시판')}>
          게시판
        </span>
        <span className="keyword" onClick={() => handleKeywordClick('출석')}>
          출석
        </span>
        <span
          className="keyword"
          onClick={() => handleKeywordClick('마이페이지')}
        >
          마이페이지
        </span>
        <span className="keyword" onClick={() => handleKeywordClick('시험')}>
          시험
        </span>
        <span className="keyword" onClick={() => handleKeywordClick('캘린더')}>
          캘린더
        </span>
        <span className="keyword" onClick={() => handleKeywordClick('메시지')}>
          메시지
        </span>
      </div>

      <div className="chatbot-body">
        <div className="chat">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`chat-message ${
                message.sender === 'user' ? 'user-message1' : 'bot-message'
              }`}
            >
              <span>{message.text}</span>
            </div>
          ))}
          <div ref={chatEndRef}></div>
        </div>
      </div>

      {filteredQuestions.length > 0 && (
        <div className="autocomplete-box">
          {filteredQuestions.map((q, index) => (
            <div
              key={index}
              className="autocomplete-item"
              onClick={() => handleQuestionClick(q.question)}
            >
              {q.question}
            </div>
          ))}
        </div>
      )}

      {/* 검색 입력란과 검색 버튼 */}
      <div className="search-bar">
        <input
          type="text"
          placeholder="질문을 입력하세요..."
          value={searchKeyword}
          onChange={(e) => setSearchKeyword(e.target.value)}
        />
        <button onClick={handleSendMessage}>
          {' '}
          <img src="/fly.png" alt="검색 아이콘" />
        </button>
      </div>
    </div>
    </div>
  );
};


export default ChatBot;