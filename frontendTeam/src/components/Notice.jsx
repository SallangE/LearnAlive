import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../styles/ClassroomList.css";

const Notice = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notices, setNotices] = useState([]);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const indexOfLastNotice = currentPage * itemsPerPage;
  const indexOfFirstNotice = indexOfLastNotice - itemsPerPage;
  const currentNotices = notices.slice(indexOfFirstNotice, indexOfLastNotice);
  const totalPages = Math.ceil(notices.length / itemsPerPage);

  useEffect(() => {
    axios
      .get("http://localhost:8080/api/notice")
      .then((response) => {
        setNotices(response.data);
      })
      .catch((error) => {
        console.error("공지사항 불러오기 실패:", error);
      });
  }, []);

  const handleNoticeClick = (notice_id) => {
    if (notice_id != null) {
      navigate(`/notice/${notice_id}`);
    } else {
      console.error("유효하지 않은 notice_id");
    }
  };

  return (
    <div className="classroom-container">
      <div className="classroom-title">공지사항</div>

      {user?.role?.toLowerCase() === "admin" && (
        <button className="normal-button" onClick={() => navigate("/notice/manage")}>
          공지사항 관리
        </button>
      )}

      <ul className="classroom-list">
        {currentNotices.length > 0 ? (
          currentNotices.map((notice) => (
            <li
              key={notice.notice_id}
              className="classroom-item"
              onClick={() => handleNoticeClick(notice.notice_id)}
            >
              <span className="classroom-link">{notice.title}</span>
            </li>
          ))
        ) : (
          <div className="login-container">
            <p className="login-message">등록된 공지사항이 없습니다.</p>
          </div>
        )}
      </ul>

      {/* ✅ 페이지네이션 UI */}
      {totalPages > 1 && (
        <div className="pagination">
          <button
            onClick={() => setCurrentPage((prev) => prev - 1)}
            disabled={currentPage === 1}
            className={currentPage === 1 ? "disabled-button" : ""}
          >
            ◀ 이전
          </button>

          <span style={{ margin: '0 1rem' }}>
            [ {currentPage} / {totalPages} ]
          </span>

          <button
            onClick={() => setCurrentPage((prev) => prev + 1)}
            disabled={currentPage === totalPages}
            className={currentPage === totalPages ? "disabled-button" : ""}
          >
            다음 ▶
          </button>
        </div>
      )}
    </div>
  );
};

export default Notice;
