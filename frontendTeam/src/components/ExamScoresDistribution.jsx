import { useEffect, useState } from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { fetchAllExams, ExamResultsByExamId } from "../api/examApi";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

// 등급 계산 함수
const computeGrade = (score) => {
  if (score < 64) return "F";
  if (score < 67) return "D-";
  if (score < 70) return "D";
  if (score < 73) return "D+";
  if (score < 76) return "C-";
  if (score < 79) return "C";
  if (score < 82) return "C+";
  if (score < 85) return "B-";
  if (score < 88) return "B";
  if (score < 91) return "B+";
  if (score < 94) return "A-";
  if (score < 97) return "A";
  return "A+";
};

const GRADE_ORDER = [
  "F", "D-", "D", "D+", "C-", "C", "C+", "B-", "B", "B+", "A-", "A", "A+"
];

const ExamScoresDistribution = ({ classId }) => {
  const [exams, setExams] = useState([]);
  const [selectedExamId, setSelectedExamId] = useState("");
  const [distribution, setDistribution] = useState({});

  useEffect(() => {
    if (!classId) return;

    fetchAllExams(classId)
      .then((data) => {
        if (!Array.isArray(data)) {
          console.error("❌ 시험 목록 응답이 배열이 아님:", data);
          return;
        }
        setExams(data);
        if (data.length > 0) {
          setSelectedExamId(String(data[0].examId));
        }
      })
      .catch((err) => console.error("시험 목록 조회 오류:", err));
  }, [classId]);

  useEffect(() => {
    if (!selectedExamId) return;
    ExamResultsByExamId(Number(selectedExamId))
      .then((results) => {
        const buckets = {};
        GRADE_ORDER.forEach((grade) => {
          buckets[grade] = 0;
        });

        results.forEach((r) => {
          const score = Number(r.score);
          if (isNaN(score)) return;
          const grade = computeGrade(score);
          buckets[grade]++;
        });

        setDistribution(buckets);
      })
      .catch((err) => console.error("시험 점수 조회 오류:", err));
  }, [selectedExamId]);

  const values = GRADE_ORDER.map((grade) => distribution[grade] || 0);
  const max = Math.max(...values);

  const backgroundColors = values.map((v) =>
    v === max && v > 0 ? "#FFB247" : "lightgrey"
  );

  const chartData = {
    labels: GRADE_ORDER,
    datasets: [
      {
        label: "학생 수",
        data: values,
        backgroundColor: backgroundColors,
        borderColor: backgroundColors.map((color) =>
          color === "#FFB247" ? "darkorange" : "lightgrey"
        ),
        borderWidth: 1,
      },
    ],
  };

  return (
    <div>
      <h2>시험 점수 분포</h2>
      {exams.length > 0 ? (
        <>
          {/* 선택 영역 카드 */}
            <div
            style={{
                marginBottom: "24px",
                padding: "16px",
                backgroundColor: "#f9f9f9",
                borderRadius: "12px",
                boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
                display: "flex",
                alignItems: "center",
                gap: "12px",
                maxWidth: "290px",
                boxSizing: "border-box",
            }}
            >
            <label style={{ fontWeight: "bold", marginRight: "8px" }}>시험 선택:</label>
            <select
                value={selectedExamId}
                onChange={(e) => setSelectedExamId(e.target.value)}
                style={{ padding: "6px 10px", borderRadius: "6px", flex: 1 }}
            >
                {exams.map((exam) => (
                <option key={exam.examId} value={String(exam.examId)}>
                    {exam.title}
                </option>
                ))}
            </select>
            </div>

          {values.some((v) => v > 0) ? (
            <div style={{ width: "800px", height: "400px" }}>
              <Bar
                data={chartData}
                options={{
                  plugins: {
                    title: {
                      display: true,
                      text: "시험 성적 분포 (등급 기준)",
                      font: { size: 20 },
                    },
                    legend: { display: false },
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      ticks: { stepSize: 1, font: { size: 14 } },
                    },
                    x: {
                      ticks: { font: { size: 14 } },
                    },
                  },
                }}
              />
            </div>
          ) : (
            <p style={{ color: "#888" }}>해당 시험에 대한 점수 데이터가 없습니다.</p>
          )}
        </>
      ) : (
        <p>시험 정보가 없습니다.</p>
      )}
    </div>
  );
};

export default ExamScoresDistribution;
