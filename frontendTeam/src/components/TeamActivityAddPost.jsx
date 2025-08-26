import { useState } from "react";
import { useParams } from "react-router-dom";
import { createTeamActivityPost } from "../api/teamActivityApi";
import { useAuth } from "../context/AuthContext";

const TeamActivityAddPost = ({ onCancel, onPostCreated }) => {
  const { classId } = useParams();
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const newPost = {
        classId: parseInt(classId, 10),
        title,
        content,
        authorId: user?.userId || "",
        authorName: user?.username || "",
        department: "",
        email: "",
        contact: "",
        likes: 0,
        teamMembers: []
      };
      const createdPost = await createTeamActivityPost(newPost);
      onPostCreated(createdPost);
    } catch (error) {
      console.error("\u274C \ud300 \ud65c\ub3d9 \uac8c\uc2dc\uae00 \ucd94\uac00 \uc624\ub958:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 d-flex flex-column align-items-center">
      <h3 className="fw-bold mb-4 w-100 text-start">📄 팀 활동 게시글 작성</h3>

      <form onSubmit={handleSubmit} className="w-100 d-flex flex-column align-items-center gap-3">
        {/* 제목 */}
        <div className="w-100" style={{ maxWidth: "95%", marginBottom: "1rem" }}>
          <label className="form-label d-block" style={{ fontSize: "1.1rem", fontWeight: "600", marginBottom: "0.5rem" }}>
            제목
          </label>
          <input
            type="text"
            className="form-control w-100"
            style={{ height: "48px", fontSize: "1rem", maxWidth: '100%', marginTop: "8px" }}
            placeholder="제목을 입력하세요"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>

        {/* 내용 */}
        <div className="w-100" style={{ maxWidth: "95%", marginBottom: "1rem" }}>
          <label className="form-label d-block fw-semibold" style={{ fontSize: "1.1rem", fontWeight: "600", marginBottom: "0.5rem" }}>내용</label>
          <textarea
            className="form-control w-100"
            style={{ maxWidth: "99%", marginTop: "8px" }}
            placeholder="내용을 입력하세요"
            rows="12"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
          />
        </div>

        {/* 버튼 */}
        <div className="d-flex justify-content-center gap-2 w-100">
          <div style={{ width: "95%", display: "flex", justifyContent: "center", gap: "1rem" }}>
            <button type="submit" className="normal-button" disabled={loading}>
              {loading ? "추가 중..." : "작성"}
            </button>
            <button type="button" className="delete-button" onClick={onCancel}>
              취소
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default TeamActivityAddPost;