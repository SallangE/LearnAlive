import { useState, useEffect } from "react";
import {
  getTeamActivityApplications,
  approveTeamActivityApplication,
  rejectTeamActivityApplication
} from "../api/teamActivityApi";
import "../styles/ApplicationApproval.css"; // 👈 CSS 파일 추가

const statusMapping = {
  PENDING: "대기",
  APPROVED: "✅ 승인",
  REJECTED: "❌ 거절"
};

const ApplicationApproval = ({ postId, onBack }) => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    fetchApplications();
  }, [postId]);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const data = await getTeamActivityApplications(postId);
      setApplications(data);
    } catch (error) {
      console.error("신청 목록 조회 오류:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (applicationId) => {
    try {
      await approveTeamActivityApplication(applicationId);
      setMessage("✅ 신청이 승인되었습니다.");
      fetchApplications();
    } catch (error) {
      console.error("승인 오류:", error);
    }
  };

  const handleReject = async (applicationId) => {
    try {
      await rejectTeamActivityApplication(applicationId);
      setMessage("❌ 신청이 거절되었습니다.");
      fetchApplications();
    } catch (error) {
      console.error("거절 오류:", error);
    }
  };

  return (
    <div className="approval-container">
      <div className="approval-header">
        <h2>📋 참가 신청 목록</h2>
        <button className="delete-button" onClick={onBack}>
          ← 목록으로 돌아가기
        </button>
      </div>

      {message && <div className="alert">{message}</div>}
      {loading ? (
        <p>⏳ 신청 목록을 불러오는 중...</p>
      ) : applications.length === 0 ? (
        <p>신청된 참가자가 없습니다.</p>
      ) : (
        <table className="approval-table">
          <thead>
            <tr>
              <th>#</th>
              <th>신청자 ID</th>
              <th>상태</th>
              <th>처리</th>
            </tr>
          </thead>
          <tbody>
            {applications.map((app, idx) => (
              <tr key={app.applicationId}>
                <td>{idx + 1}</td>
                <td>{app.applicantStudentId}</td>
                <td>{statusMapping[app.status] || app.status}</td>
                <td>
                  {app.status === "PENDING" ? (
                    <>
                      <button
                        className="approve-button"
                        onClick={() => handleApprove(app.applicationId)}
                      >
                        승인
                      </button>
                      <button
                        className="reject-button"
                        onClick={() => handleReject(app.applicationId)}
                      >
                        거절
                      </button>
                    </>
                  ) : (
                    <span className="status-fixed">처리 완료</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default ApplicationApproval;
