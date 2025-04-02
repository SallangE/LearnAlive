import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import FindAccountModal from "./FindAccountModal";
import "../styles/Header.css";
import NotificationListener from "./NotificationListener";
import { useNotifications } from "../context/NotificationContext";
import { Bell } from "lucide-react"; // 아이콘 라이브러리 사용
import "../styles/notification.css"
import { fetchAlarmList, markAllAlarmsAsRead  } from "../api/scheduleApi";
import MessageModal from './MessageModal'; 



const Header = () => {
  const { user, login, logout } = useAuth();
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);  // 모달 상태 추가
  const navigate = useNavigate();
  const { notifications, clearNotifications  } = useNotifications();
  const [alarmList, setAlarmList] = useState([]);
  const [open, setOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [hasUnread, setHasUnread] = useState(false);

  useEffect(() => {
    console.log("현재 로그인한 사용자:", user);
  }, [user]);

  // useEffect(() => {
  //   const interval = setInterval(() => {
  //     setCurrentTime(new Date());
  //   }, 1000); // 매초 갱신
  
  //   return () => clearInterval(interval); // 언마운트 시 제거
  // }, []);

  useEffect(() => {
    const hasUnread = alarmList.some((n) => n.isRead === false || n.isRead === 0 || n.isRead === "0");
    setHasUnread(hasUnread);
  }, [alarmList]); // ✅ alarmList가 바뀔 때마다 실행

  const handleLogin = (e) => {
    e.preventDefault();
    if (!userId || !password) {
      alert("아이디와 비밀번호를 입력하세요.");
      return;
    }
    login(userId, password);
  };

  const handleLogout = () => {
    logout();
    navigate("/");
    setUserId(""); // 아이디 입력 필드 초기화
    setPassword(""); // 비밀번호 입력 필드 초기화
  };

  // 쪽지 모달 열기
  const openMessageModal = () => {
    setIsMessageModalOpen(true);  // 모달 상태를 true로 설정하여 열기
  };

  const handleToggle = async () => {
    const nextOpen = !open;
    setOpen(nextOpen);
  
    // 알림 창을 여는 순간에만 읽음 처리 + 리스트 갱신
    if (nextOpen && user) {
      try {
        await markAllAlarmsAsRead(user.userId);
        const data = await fetchAlarmList(user.userId);
        setAlarmList(data);
      } catch (error) {
        console.error("🔻 알림 목록 불러오기 실패", error);
      }
    }
  };

  return (
    <header>
      {user ? (
        // 로그인 후 화면
        <div className="user-info"> {/* ✅ 기존 CSS 유지 */}
      {/* 공통 버튼 */}
      <button className="home-button" onClick={() => navigate("/")}>🏠 홈</button>
      <span className="user-message">
        환영합니다, {user.username || user.userId} 님! ({user.role})
      </span>
      <button className="logout-btn" onClick={handleLogout}>로그아웃</button>
      <button className="mypage-btn" onClick={() => navigate("/mypage")}>마이페이지</button>
      <button onClick={() => navigate("/calendar")}>📅</button>

      {/* 쪽지 버튼 */}
          <button
            className="message-btn"
            onClick={openMessageModal}  // 클릭 시 모달 열기
          >
            📨
          </button>
      <div className="divider"></div>

      {/* 관리자 전용 버튼 */}
      {user.role.toLowerCase() === "admin" && (
        <>
          <button
            className="admin-btn"
            onClick={() => navigate("/admin/professors")}
          >
            교수자 관리
          </button>
          <button
            className="admin-btn"
            onClick={() => navigate("/admin/university")}
          >
            대학/학과 관리
          </button>
        </>
      )}

      {/* 알림 영역 */}
      {user?.userId && <NotificationListener userId={user.userId} updateAlarms={setAlarmList} />}
      <div className="notification-area">
        <button onClick={handleToggle} className="bell-button">
          <Bell />
          {alarmList.some((n) => !n.isRead) && <span className="badge" />}
        </button>
        {open && (
          <div className="notification-panel">
          <h4>📥 최근 알림</h4>
          {alarmList.length === 0 && <p>알림이 없습니다.</p>}
          {alarmList.map((n, i) => (
            <div key={i} className="notification-item">
              <strong>[{n.type}]</strong> {n.title}
              <div className="time">
                {new Date(n.createdAt).toLocaleString()}
              </div>
            </div>
          ))}
      </div>
       )}
      </div>
    </div>
      ) : (
        // 로그인 전 화면
        <div className="login-container">  {/* ✅ 기존 CSS 유지 */}
        <button className="home-button" onClick={() => navigate("/")}>🏠 홈</button>
          <form onSubmit={handleLogin} className="login-form">  {/* ✅ 기존 CSS 유지 */}
            <input
              type="text"
              placeholder="아이디"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
            />
            <input
              type="password"
              placeholder="비밀번호"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button type="submit" className="login-button">로그인</button>
          </form>
          <div className="divider"></div>
          <div className="login-form">  {/* 여기는 새로 생긴 부분, 필요하면 CSS 추가 */}
            <button
              className="find-button"
              type="button"
              onClick={() => setIsModalOpen(true)}
            >
              회원정보 찾기
            </button>
            <button
              className="find-button"
              type="button"
              onClick={() => navigate("/register")}
            >
              회원가입
            </button>
          </div>
        </div>
      )}

      <div style={{
          backgroundColor: "white",
          padding: "10px",
          borderRadius: "14px",
          fontWeight: "bold",
          fontSize: "15px",
          marginRight: "5px",
          border: "4px solid #1929A4"
        }}>
          ⏰ {currentTime.toLocaleTimeString('ko-KR')}
        </div>

      {/* 모달 */}
      {isModalOpen && <FindAccountModal onClose={() => setIsModalOpen(false)} />}
      {isMessageModalOpen && (
        <MessageModal
          isOpen={isMessageModalOpen}  // 모달 상태 전달
          onClose={() => setIsMessageModalOpen(false)}  // 모달 닫기
        />
      )}
    </header>
  );
};

export default Header;