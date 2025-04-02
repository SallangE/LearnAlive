import { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  BarElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { fetchAttendanceData } from "../api/attendanceApi";

import DatePicker, { registerLocale } from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import ko from "date-fns/locale/ko";
import { format } from "date-fns";

registerLocale("ko", ko);

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  BarElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const AttendanceAnalysis = ({ classId }) => {
  const [attendanceData, setAttendanceData] = useState([]);
  const [dailyRates, setDailyRates] = useState({});
  const [warningStudents, setWarningStudents] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date());

  useEffect(() => {
    if (!classId || !selectedMonth) return;
  
    const monthStr = format(selectedMonth, "yyyy-MM");
  
    fetchAttendanceData(classId, monthStr) // ✅ 선택한 달을 백엔드로 전달
      .then((data) => {
        setAttendanceData(data);
        processAttendanceData(data); // ❓ 이때도 month로 필터할 필요 없다면 그대로 OK
      })
      .catch((err) => console.error("출결 데이터 조회 오류:", err));
  }, [classId, selectedMonth]);

  const processAttendanceData = (data) => {
    const monthStr = format(selectedMonth, "yyyy-MM");
    const filteredData = data.filter((record) => record.date.startsWith(monthStr));

    const groupedByDate = {};
    filteredData.forEach((record) => {
      if (!groupedByDate[record.date]) {
        groupedByDate[record.date] = [];
      }
      groupedByDate[record.date].push(record);
    });

    const totalStudents = new Set(filteredData.map((record) => record.studentId)).size;

    const dailyRatesTemp = {};
    Object.keys(groupedByDate).forEach((date) => {
      const records = groupedByDate[date];
      const presentCount = records.filter((rec) => rec.state === "present").length;
      dailyRatesTemp[date] = (presentCount / totalStudents) * 100;
    });
    setDailyRates(dailyRatesTemp);

    const studentAttendance = {};
    filteredData.forEach((record) => {
      if (!studentAttendance[record.studentId]) {
        studentAttendance[record.studentId] = { name: record.name, absenceScore: 0 };
      }
      if (record.state === "absent") {
        studentAttendance[record.studentId].absenceScore += 1;
      } else if (record.state === "late") {
        studentAttendance[record.studentId].absenceScore += 0.5;
      }
    });

    const warnings = Object.entries(studentAttendance)
      .filter(([_, info]) => info.absenceScore >= 2)
      .map(([id, info]) => ({
        studentId: id,
        name: info.name,
        absenceScore: info.absenceScore,
      }));
    setWarningStudents(warnings);
  };

  const sortedDates = Object.keys(dailyRates).sort();
  const attendanceValues = sortedDates.map((date) => dailyRates[date]);
  const maxRate = Math.max(...attendanceValues);
  const maxIndex = attendanceValues.indexOf(maxRate);

  const chartData = {
    labels: sortedDates,
    datasets: [
      {
        type: "line",
        label: ".",
        data: attendanceValues,
        borderColor: "black",
        borderWidth: 2,
        fill: false,
        tension: 0,
        pointRadius: 4,
        pointBackgroundColor: "white",
      },
      {
        type: "bar",
        label: "출석률 (%)",
        data: attendanceValues,
        backgroundColor: attendanceValues.map((_, i) =>
          i === maxIndex ? "#FFB247" : "lightgrey"
        ),
        borderColor: attendanceValues.map((_, i) =>
          i === maxIndex ? "darkorange" : "lightgrey"
        ),
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
      },
      tooltip: {
        mode: "index",
        intersect: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        title: {
          display: true,
          text: "출석률 (%)",
        },
      },
    },
  };

  return (
    <div>
      <h2>📊 월간 출결률 분석</h2>

      {/* 월 선택 카드 */}
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
        <label style={{ fontWeight: "bold" }}>📅 월 선택:</label>
        <DatePicker
            selected={selectedMonth}
            onChange={(date) => setSelectedMonth(date)}
            dateFormat="yyyy-MM"
            showMonthYearPicker
            locale="ko"
            wrapperClassName="date-picker"
            popperPlacement="bottom-start"
            style={{ padding: "6px 10px", borderRadius: "6px" }}
        />
        </div>

      {/* 차트 */}
      <div style={{ width: "800px", margin: "0 auto 30px", height: "400px" }}>
        <Line data={chartData} options={options} />
      </div>

      {/* 경고 박스 */}
      <div
        style={{
          border: "1px solid #ccc",
          borderRadius: "8px",
          padding: "20px",
          margin: "30px auto",
          maxWidth: "600px",
          backgroundColor: "#fdfdfd",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
          textAlign: "center",
        }}
      >
        <h3 style={{ color: "black", marginBottom: "15px" }}>
          ⚠️ 경고 대상 학생 (누적 결석 점수 2 이상)
        </h3>

        {warningStudents.length > 0 ? (
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {warningStudents.map((student) => (
              <li key={student.studentId} style={{ marginBottom: "8px" }}>
                <strong>{student.name}</strong> (ID: {student.studentId}) -{" "}
                <span style={{ color: "#d9534f" }}>
                  결석 점수: {student.absenceScore}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p style={{ color: "#888" }}>경고 대상 학생이 없습니다.</p>
        )}
      </div>
    </div>
  );
};

export default AttendanceAnalysis;
