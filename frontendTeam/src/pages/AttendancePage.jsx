import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { studentCheckIn } from "../api/attendanceApi";
import { useAuth } from "../context/AuthContext";
import "../styles/AttendancePage.css"; // ✅ 스타일 파일 추가
import { useNavigate } from "react-router-dom";

const AttendancePage = () => {
  const { classId } = useParams();
  const { user } = useAuth();
  const [message, setMessage] = useState("");
  const [state, setState] = useState("");
  const navigate = useNavigate();

  const handleCheckIn = async () => {
    if (!user || user.role !== "student") {
      setMessage("❌ 학생만 출석할 수 있습니다.");
      return;
    }

    if (!classId || isNaN(Number(classId))) {
      setMessage("⚠️ 올바른 강의실 정보가 없습니다.");
      return;
    }

    const now = new Date();
    const kstTime = new Date(now.getTime() + 9 * 60 * 60 * 1000);
    const date = kstTime
      .toLocaleDateString("ko-KR", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
      })
      .replace(/\. /g, "-")
      .replace(/\./g, "");

    const studentId = user.userId;

    try {
      const response = await studentCheckIn(studentId, Number(classId), date);
      if (response.data) {
        const { message, state } = response.data;
        setState(state);
        setMessage(`${message} 📌 출석 상태: `);
      } else {
        setMessage("✅ 출석이 정상적으로 처리되었습니다.");
      }
    } catch (error) {
      if (error.response && typeof error.response.data === "object") {
        const { message, state } = error.response.data;
        setState(state);
        setMessage(`${message} 📌 출석 상태: `);
      } else {
        setMessage(
          error.response?.data || "⚠️ 서버와 통신 중 오류가 발생했습니다."
        );
      }
    }
  };

  const getStateLabel = () => {
    switch (state) {
      case "present":
        return "출석";
      case "late":
        return "지각";
      case "absent":
        return "결석";
      default:
        return "미등록";
    }
  };

  const getStateColor = () => {
    switch (state) {
      case "present":
        return "blue";
      case "late":
        return "black";
      case "absent":
        return "red";
      default:
        return "gray";
    }
  };

  return (
    <div className="attendance-container">
      <h2 className="attendance-title">📌 출석 등록</h2>

      <div className="button-group">
        <button className="button-checkin" onClick={handleCheckIn}>
          출석하기
        </button>
      </div>

      {message && (
        <div className="attendance-message-box">
          <p className="attendance-message">
            {message}
            <span
              style={{
                color: getStateColor(),
                fontWeight: "bold",
                marginLeft: "0.5rem"
              }}
            >
              {getStateLabel()}
            </span>
          </p>
        </div>
      )}
  <br></br>
      <button className="delete-button" onClick={() => navigate("/")}>
      메인으로 돌아가기
    </button>
    </div>
  );
};

export default AttendancePage;
