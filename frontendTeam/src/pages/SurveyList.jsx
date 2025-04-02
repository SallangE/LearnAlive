import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { fetchSurveysByBoard, deleteSurvey } from "../api/surveyApi";
import SurveyDetail from "../components/SurveyDetail"; 
import SurveyCreate from "../components/SurveyCreate";
import SurveyResponseStatusList from "../components/SurveyResponseStatusList";
import SurveyResponseVisualization from "../components/SurveyResponseVisualization";
import SurveyUpdate from "../components/SurveyUpdate";
import "../styles/SurveyList.css"; // ✅ 스타일 추가

const SurveyList = ({ boardId }) => {
  const { user } = useAuth();
  const isProfessor = user?.role === "professor";

  const [surveys, setSurveys] = useState([]);
  const [selectedSurveyId, setSelectedSurveyId] = useState(null);
  const [isCreatingSurvey, setIsCreatingSurvey] = useState(false);
  const [showResponseStatus, setShowResponseStatus] = useState(false);
  const [showVisualization, setShowVisualization] = useState(false);
  const [showPastSurveys, setShowPastSurveys] = useState(false); //종료된 설문 토글
  const [showUpdate, setShowUpdate] = useState(false);

  useEffect(() => {
    if (!boardId) return;
    fetchSurveysByBoard(boardId)
      .then((data) => {
        console.log("📌 불러온 설문조사 목록:", data);
        setSurveys(data);
      })
      .catch((error) => console.error("❌ 설문조사 목록 조회 오류:", error));
  }, [boardId]);

  const handleSelectSurvey = (surveyId) => {
    console.log("✅ 클릭된 설문 ID:", surveyId);
    setSelectedSurveyId(surveyId);
  };

  const handleBackToList = () => {
    // 설문 목록 재조회
    fetchSurveysByBoard(boardId)
      .then((data) => {
        console.log("📌 최신 설문조사 목록:", data);
        setSurveys(data);
        // 선택된 설문 초기화 등 필요한 상태 리셋
        setSelectedSurveyId(null);
        setIsCreatingSurvey(false);
        setShowUpdate(false);
        setShowResponseStatus(false);
        setShowVisualization(false);
      })
      .catch((error) => console.error("❌ 설문조사 목록 갱신 오류:", error));
  };

  const handleBackToDetail = () => {
    setShowResponseStatus(false);
    setShowVisualization(false);
    setShowUpdate(false);
  };

  const handleAddSurvey = () => {
    console.log("📌 설문 추가 버튼 클릭됨");
    setIsCreatingSurvey(true);
  };

  const handleShowResponseStatus = (surveyId) => {
    console.log("📊 응답 여부 보기 클릭됨:", surveyId);
    setSelectedSurveyId(surveyId);
    setShowResponseStatus(true);
    setShowVisualization(false); // ✅ 시각화가 켜져있다면 꺼줌
  };

  const handleShowVisualization = (surveyId) => {
    console.log("📈 응답 시각화 보기 클릭됨:", surveyId);
    setSelectedSurveyId(surveyId);
    setShowVisualization(true);
    setShowResponseStatus(false); // ✅ 응답 여부 보기가 켜져있다면 꺼줌
  };

  const handleShowUpdate = (surveyId) => {
    console.log("✏️ 설문 수정 클릭됨:", surveyId);
    setSelectedSurveyId(surveyId);
    setShowUpdate(true); // ✅ 설문 수정 모드로 변경
    setShowResponseStatus(false);
    setShowVisualization(false);
  };

  const handleDeleteSurvey = async (surveyId) => {
    const success = await deleteSurvey(surveyId);
    if (success) {
      console.log(`🗑️ 설문조사 ${surveyId} 삭제 성공`);
      // ✅ 삭제 후 최신 목록 다시 불러오기
      fetchSurveysByBoard(boardId)
        .then((data) => {
          console.log("📌 삭제 후 최신 설문조사 목록:", data);
          setSurveys(data);
        })
        .catch((error) => console.error("❌ 설문조사 목록 갱신 오류:", error));
    }
  };

  // ✅ 현재 한국 시간 기준으로 비교하기
  const currentDateTimeKST = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Seoul" })); // 한국 시간으로 변환
  const filteredSurveys = showPastSurveys
    ? surveys // ✅ 토글 활성화 시 모든 설문 표시
    : surveys.filter(survey => new Date(survey.endTime) > currentDateTimeKST); // ✅ 종료되지 않은 설문만 표시

  console.log("🔄 현재 상태 - selectedSurveyId:", selectedSurveyId, "isCreatingSurvey:", isCreatingSurvey, "showVisualization:", showVisualization, "showResponseStatus:", showResponseStatus, "showUpdate:", showUpdate);

  return (
    <div className="post-container">
      {selectedSurveyId ? (
        showUpdate ? ( 
          <SurveyUpdate surveyId={selectedSurveyId} onSurveyUpdated={handleBackToDetail} onBack={handleBackToDetail} />
        ) : showVisualization ? (
          <SurveyResponseVisualization surveyId={selectedSurveyId} onBack={handleBackToDetail} />
        ) : showResponseStatus ? (
          <SurveyResponseStatusList surveyId={selectedSurveyId} onBack={handleBackToDetail} />
        ) : (
          <SurveyDetail
            surveyId={selectedSurveyId}
            onBack={handleBackToList}
            onShowResponseStatus={handleShowResponseStatus}
            onShowVisualization={handleShowVisualization}
            onShowUpdate={handleShowUpdate} 
          />
        )
      ) : isCreatingSurvey ? (
        <SurveyCreate boardId={boardId} onSurveyCreated={handleBackToList} onBack={handleBackToList} />
      ) : (
        <>
          <h2 className="title-bar">📋 설문조사 목록</h2>
          
          <div style={{ 
            display: "flex", 
            justifyContent: "space-between", 
            alignItems: "center", 
            marginBottom: "10px",
            marginTop: "10px",
            gap: "50px"
          }}>
            {isProfessor && (
              <button onClick={handleAddSurvey} className="normal-button">💁‍♀️ 설문조사 추가</button>
            )}

            {/* ✅ 토글은 오른쪽으로 */}
            <button className="normal-button">
              <label style={{ display: "flex", alignItems: "center", gap: "10px" }} className="past-survey-label">
                <input 
                  type="checkbox" 
                  checked={showPastSurveys} 
                  onChange={() => setShowPastSurveys(!showPastSurveys)} 
                  className="past-survey-checkbox"
                />
                지난 설문조사
              </label>
            </button>
          </div>

          {/* ✅ 리스트를 표 형태로 표시 */}
          {filteredSurveys.length > 0 ? (
            <table className="survey-table" style={{ width: "100%", marginTop: "1rem" }}>
              <thead>
                <tr>
                  <th>제목</th>
                  <th>시작 시간</th>
                  <th>종료 시간</th>
                  {isProfessor && <th>관리</th>}
                </tr>
              </thead>
              <tbody>
                {filteredSurveys.map((survey) => (
                  <tr key={survey.surveyId}>
                    <td
                      style={{ cursor: "pointer", fontWeight: "bold" }}
                      onClick={() => handleSelectSurvey(survey.surveyId)}
                      className="post-title"
                    >
                      {survey.title}
                    </td>
                    <td>{survey.startTime}</td>
                    <td>{survey.endTime}</td>
                    {isProfessor && (
                      <td>
                        <button 
                          onClick={() => {
                            if (window.confirm("정말로 삭제하시겠습니까?")) {
                              handleDeleteSurvey(survey.surveyId);
                            }
                          }}
                          className="delete-button"
                        >
                          삭제
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="normal-title">📌 아직 설문조사가 없습니다. 새로 추가해 보세요.</p>
          )}
        </>
      )}
    </div>
  );
};

export default SurveyList;
