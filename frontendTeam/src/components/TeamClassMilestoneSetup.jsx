import React, { useState, useEffect } from "react";
import { getClassMilestones, createClassMilestones, updateClassMilestone, deleteClassMilestone } from "../api/milestoneApi";
import "../styles/ProjectMilestones.css";

const TeamClassMilestoneSetup = ({ classId, onBack, onSetupComplete }) => {
  const [milestones, setMilestones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // 컴포넌트 마운트 시, 기존 마일스톤 불러오기
  useEffect(() => {
    if (!classId) return;
    loadExistingMilestones();
  }, [classId]);

  const loadExistingMilestones = async () => {
    setLoading(true);
    try {
      const data = await getClassMilestones(classId);
      const converted = data.map(m => ({
        milestoneId: m.milestoneId,
        title: m.title,
        dueDate: m.dueDate ? m.dueDate.replace(" ", "T") : "",
        status: "pending"  // DB에 상태 컬럼이 없으면 기본값 "pending"
      }));
      setMilestones(converted);
    } catch (error) {
      console.error("기존 마일스톤 불러오기 오류:", error);
      setErrorMessage("기존 마일스톤을 불러오는 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const total = milestones.length;
  const completed = milestones.filter(m => m.status === "completed").length;
  const progressPercent = total > 0 ? Math.round((completed / total) * 100) : 0;

  const handleMilestoneChange = (index, field, value) => {
    const newList = [...milestones];
    newList[index][field] = value;
    setMilestones(newList);
  };

  const addMilestone = () => {
    setMilestones([...milestones, { title: "", dueDate: "", status: "pending" }]);
  };

  // 신규 항목 등록 (등록 후 중복 등록 방지를 위해 신규 항목만 필터링)
  const handleRegisterMilestone = async (index) => {
    const milestone = milestones[index];
    try {
      setLoading(true);
      await createClassMilestones(classId, [milestone]);
      alert("등록되었습니다.");
      loadExistingMilestones();
    } catch (error) {
      console.error("마일스톤 등록 오류:", error);
      setErrorMessage("마일스톤 등록 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 기존 항목 수정
  const handleUpdateMilestone = async (index) => {
    const milestone = milestones[index];
    if (!milestone.milestoneId) {
      alert("신규 항목은 '등록' 버튼으로 처리해주세요.");
      return;
    }
    try {
      setLoading(true);
      await updateClassMilestone(milestone.milestoneId, {
        title: milestone.title,
        dueDate: milestone.dueDate
      });
      alert("수정되었습니다.");
      loadExistingMilestones();
    } catch (error) {
      console.error("마일스톤 수정 오류:", error);
      setErrorMessage("마일스톤 수정 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 삭제 함수
  const handleRemoveMilestone = async (index) => {
    const milestone = milestones[index];
    if (milestone.milestoneId) {
      try {
        setLoading(true);
        await deleteClassMilestone(milestone.milestoneId);
        setMilestones(milestones.filter((_, i) => i !== index));
      } catch (error) {
        console.error("마일스톤 삭제 오류:", error);
        setErrorMessage("마일스톤 삭제 중 오류가 발생했습니다.");
      } finally {
        setLoading(false);
      }
    } else {
      setMilestones(milestones.filter((_, i) => i !== index));
    }
  };

  // "설정 저장" 버튼은 제거하고, 각각의 수정/삭제 버튼만 사용 (원하는 경우 수정, 삭제 후 전체 재불러오기)
  // 만약 전체 저장 기능도 필요하다면 handleSubmit를 별도로 추가할 수 있습니다.

  return  (
    
    <div className="milestones-container" style={{ maxWidth: "600px", margin: "0 auto" }}>
      <h3 className="title-bar">팀 프로젝트 마일스톤 설정</h3>
      <button onClick={onBack} className="back-button" style={{ display: "block", marginLeft: "auto" }}>
        ⬅ 돌아가기
      </button>
      <br></br>

      {/* 진행률 바 */}
      <div className="progress-bar" style={{ marginBottom: "1rem" }}>
        <div className="progress-bar-fill" style={{ width: `${progressPercent}%` }}></div>
      </div>
      <p>
        {completed} / {total} 마일스톤 완료 ({progressPercent}%)
      </p>

      {errorMessage && <p style={{ color: "red" }}>{errorMessage}</p>}

      {loading ? (
        <p>불러오는 중...</p>
      ) : (
        <form onSubmit={(e) => e.preventDefault()}>
          {milestones.map((ms, index) => (
            <div
              key={index}
              style={{
                border: "1px solid #ccc",
                padding: "0.75rem",
                marginBottom: "0.75rem",
                borderRadius: "5px"
              }}
            >
              <label style={{ display: "block", marginBottom: "0.5rem" }}>
                마일스톤 제목:
                <input
                  type="text"
                  placeholder="예: 1. 팀원모집 / 2. 기획"
                  value={ms.title}
                  onChange={(e) => handleMilestoneChange(index, "title", e.target.value)}
                  required
                  style={{ marginLeft: "0.5rem" }}
                />
              </label>

              <label style={{ display: "block", marginBottom: "0.5rem" }}>
                Due Date:
                <input
                  type="datetime-local"
                  value={ms.dueDate}
                  onChange={(e) => handleMilestoneChange(index, "dueDate", e.target.value)}
                  required
                  style={{ marginLeft: "0.5rem" }}
                />
              </label>

              <label style={{ display: "block", marginBottom: "0.5rem" }}>
                상태:
                <select
                  value={ms.status}
                  onChange={(e) => handleMilestoneChange(index, "status", e.target.value)}
                  style={{ marginLeft: "0.5rem" }}
                >
                  <option value="pending">미완료</option>
                  <option value="in-progress">진행 중</option>
                  <option value="completed">완료</option>
                </select>
              </label>

              <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
                {/* 만약 이미 등록된 항목이면 수정과 삭제 버튼 표시, 그렇지 않으면 등록 버튼 표시 */}
                {ms.milestoneId ? (
                  <>
                    <button
                      type="button"
                      onClick={() => handleUpdateMilestone(index)}
                      className="edit-button"
                    >
                      수정
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveMilestone(index)}
                      className="delete-button"
                    >
                      삭제
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleRegisterMilestone(index)}
                    style={{
                      backgroundColor: "#4caf50",
                      color: "#fff",
                      padding: "0.4rem 0.8rem",
                      border: "none",
                      cursor: "pointer"
                    }}
                  >
                    등록
                  </button>
                )}
              </div>
            </div>
          ))}
        </form>
      )}

      {/* 마일스톤 추가 + 뒤로가기 버튼 한 줄에 배치 */}
      <div style={{ display: "flex", justifyContent: "center", gap: "1rem", marginTop: "1.5rem" }}>
        <button
          type="button"
          onClick={addMilestone}
          className="normal-button"
        >
          마일스톤 추가
        </button>
      </div>
    </div>
  );
};

export default TeamClassMilestoneSetup;