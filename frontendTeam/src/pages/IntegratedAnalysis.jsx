// src/pages/IntegratedAnalysis.jsx
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

// API 함수들 import
import { fetchAttendanceByDate } from "../api/attendanceApi";
import { fetchClassDetail, fetchExamScores } from "../api/classroomApi";
import { getAllPosts } from "../api/postApi";
import { fetchSurveyBoards } from "../api/surveyApi";

import AttendanceAnalysis from "../components/AttendanceAnalysis";
import ExamScoresDistribution from "../components/ExamScoresDistribution";
import PostsAnalysis from "../components/PostsAnalysis";



const IntegratedAnalysis = () => {
  // URL에서 classId를 받아옴
  const { classId } = useParams();
  const [classDetail, setClassDetail] = useState(null);


  // 오늘 날짜 (YYYY-MM-DD 형식)
  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    if (!classId) return; // classId가 없으면 데이터 요청을 하지 않음

    // 2. 강의실 상세 정보 조회
    fetchClassDetail(classId)
      .then((data) => setClassDetail(data))
      .catch((err) => console.error("강의실 정보 조회 오류:", err));


  }, [classId, today]);

  if (!classId) return <p>강의실 정보가 없습니다.</p>;

  return (
    <div className="dashboard"  
        style={{
        padding: "20px",
        fontFamily: "Arial, sans-serif",
        display: "flex",
        flexDirection: "column",
        alignItems: "center", // 내부 요소 가운데 정렬
      }}
    >
      <h1
        style={{
          fontSize: '2.5rem',
          color: 'black',
          textAlign: 'center',
          marginBottom: '20px',
          borderBottom: '2px solid #ddd',
          paddingBottom: '10px'
        }}
      >통합 분석</h1>

      {/* 강의실 상세 정보 */}
      {classDetail ? (
        <div className="class-detail" style={{ marginBottom: "20px", borderBottom: "1px solid #ccc" }}>
          <h2>{classDetail.className}</h2>
          <p>
            교수: <strong>{classDetail.professorName}</strong> (<em>{classDetail.professorEmail}</em>)
          </p>
        </div>
      ) : (
        <p>강의실 정보를 불러오는 중...</p>
      )}

      {/* 출결 분석 섹션 (새 컴포넌트로 이식) */}
      <section style={{ marginBottom: "20px" }}>
        <AttendanceAnalysis classId={classId} />
        <hr></hr>
      </section>

      {/* 시험 점수 분석 섹션 (컴포넌트로 분리) */}
        <section style={{ marginBottom: "20px" }}>
        <ExamScoresDistribution classId={classId} />
        <hr></hr>
        </section>

      {/* 게시글 섹션 */}
      <section style={{ marginBottom: "20px" }}>
        <PostsAnalysis classId={classId} />
      </section>
    </div>
  );
};

export default IntegratedAnalysis;
