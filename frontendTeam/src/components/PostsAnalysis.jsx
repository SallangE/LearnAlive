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
import { fetchPostBoards, fetchPostsByBoardAndMonth } from "../api/postApi";

// Chart.js 기본 요소 등록 (플러그인 제거됨)
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const PostsAnalysis = ({ classId }) => {
  const [boards, setBoards] = useState([]);
  const [selectedBoard, setSelectedBoard] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(""); // "YYYY-MM"
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    if (!classId) return;
    fetchPostBoards(classId)
      .then((data) => {
        if (Array.isArray(data)) {
          setBoards(data);
          if (data.length > 0) setSelectedBoard(String(data[0].boardId));
        } else {
          console.error("게시판 데이터가 배열이 아님:", data);
        }
      })
      .catch((err) => console.error("게시판 조회 오류:", err));
  }, [classId]);

  useEffect(() => {
    const now = new Date();
    const month = now.toISOString().slice(0, 7);
    setSelectedMonth(month);
  }, []);

  useEffect(() => {
    if (!selectedBoard || !selectedMonth) return;
    fetchPostsByBoardAndMonth(selectedBoard, selectedMonth)
      .then((data) => {
        if (Array.isArray(data)) {
          setPosts(data);
        } else {
          console.error("게시글 데이터가 배열이 아님:", data);
        }
      })
      .catch((err) => console.error("게시글 조회 오류:", err));
  }, [selectedBoard, selectedMonth]);

  const aggregatePosts = (posts, metric) => {
    const aggregation = {};
    posts.forEach((post) => {
      const author = post.author;
      let value =
        metric === "count"
          ? 1
          : metric === "likeCount"
          ? Number(post.likes) || 0
          : Number(post.view) || 0;
      aggregation[author] = (aggregation[author] || 0) + value;
    });

    return Object.entries(aggregation)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
  };

  const getChartData = (data, title) => {
    const labels = data.map((item) => item[0]);
    const values = data.map((item) => item[1]);

    const max = Math.max(...values);

    const backgroundColor = values.map((v) =>
        v === max && v > 0 ? "#FFB247" : "lightgrey"
      );
      
      const borderColor = values.map((v) =>
        v === max && v > 0 ? "darkorange" : "lightgrey"
      );

    while (labels.length < 10) {
      labels.push("");
      values.push(0);
      backgroundColor.push("lightgrey");
      borderColor.push("lightgrey");
    }

    return {
      labels,
      datasets: [
        {
          label: title,
          data: values,
          backgroundColor,
          borderColor,
          borderWidth: 1,
        },
      ],
    };
  };

  const getTitleText = (keyword) => `${keyword} 상위 10명`;

  const topPostCount = aggregatePosts(posts, "count");
  const topLikes = aggregatePosts(posts, "likeCount");
  const topViews = aggregatePosts(posts, "view");

  return (
    <div style={{ marginTop: "20px", width: "100%" }}>
      <h2>게시글 통계 분석</h2>

      {/* 선택 영역 카드 */}
      <div
        style={{
          marginBottom: "24px",
          padding: "16px",
          backgroundColor: "#f9f9f9",
          borderRadius: "12px",
          boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
          display: "flex",
          gap: "24px",
          alignItems: "center",
          maxWidth: "420px",
          boxSizing: "border-box"
        }}
      >
        {/* 게시판 선택 */}
        <div>
          <label style={{ fontWeight: "bold", marginRight: "8px" }}>게시판:</label>
          <select
            value={selectedBoard}
            onChange={(e) => setSelectedBoard(e.target.value)}
            style={{ padding: "6px 10px", borderRadius: "6px" }}
          >
            {boards.map((board) => (
              <option key={board.boardId} value={String(board.boardId)}>
                {board.boardName || board.title}
              </option>
            ))}
          </select>
        </div>

        {/* 월 선택 */}
        <div style={{boxSizing: "border-box"}}>
          <label style={{ fontWeight: "bold", marginRight: "8px" , boxSizing: "border-box" }}>월 선택:</label>
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            style={{ padding: "6px 10px", borderRadius: "6px" }}
          />
        </div>
      </div>

      {/* 차트 영역 */}
      {posts.length === 0 ? (
        <p>선택된 조건에 맞는 게시글이 없습니다.</p>
      ) : (
        <>
          <div style={{ marginBottom: "40px", width: "800px", height: "400px" }}>
            <Bar
              data={getChartData(topPostCount, "게시글 수")}
              options={{
                plugins: {
                  title: {
                    display: true,
                    text: getTitleText("게시글 수"),
                    font: { size: 20 },
                  },
                  legend: { display: false },
                },
                scales: {
                  y: { beginAtZero: true, ticks: { stepSize: 1 } },
                },
              }}
            />
          </div>
          <div style={{ marginBottom: "40px", width: "800px", height: "400px" }}>
            <Bar
              data={getChartData(topLikes, "좋아요 수")}
              options={{
                plugins: {
                  title: {
                    display: true,
                    text: getTitleText("좋아요 수"),
                    font: { size: 20 },
                  },
                  legend: { display: false },
                },
                scales: {
                  y: { beginAtZero: true, ticks: { stepSize: 1 } },
                },
              }}
            />
          </div>
          <div style={{ marginBottom: "40px", width: "800px", height: "400px" }}>
            <Bar
              data={getChartData(topViews, "조회수")}
              options={{
                plugins: {
                  title: {
                    display: true,
                    text: getTitleText("조회수"),
                    font: { size: 20 },
                  },
                  legend: { display: false },
                },
                scales: {
                  y: { beginAtZero: true, ticks: { stepSize: 1 } },
                },
              }}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default PostsAnalysis;
