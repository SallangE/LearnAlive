import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getPostById, updatePost } from "../api/postApi";

const MyPostDetail = () => {
  const { postId } = useParams(); // URL에서 postId 가져오기
  const navigate = useNavigate(); // 페이지 이동을 위한 useNavigate
  const [post, setPost] = useState(null);
  const [editedTitle, setEditedTitle] = useState("");
  const [editedContent, setEditedContent] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        console.log("📌 게시글 상세 요청 - postId:", postId);
        const data = await getPostById(postId);
        console.log("✅ 게시글 상세 응답:", data);
        setPost(data);
        setEditedTitle(data.title);
        setEditedContent(data.content);
      } catch (err) {
        console.error("❌ 게시글 상세 요청 실패:", err);
        setError("게시글을 불러오는 중 오류가 발생했습니다.");
      } finally {
        setLoading(false);
      }
    };
    fetchPost();
  }, [postId]);

  const handleUpdate = async () => {
    try {
      const updatedPost = {
        title: editedTitle,
        content: editedContent,
      };
      await updatePost(post.postId, updatedPost);
      alert("게시글이 수정되었습니다.");
      // 수정 후 최신 데이터 불러오기
      const freshData = await getPostById(postId);
      setPost(freshData);
      setIsEditing(false);
    } catch (err) {
      console.error("게시글 수정 오류:", err);
      alert("게시글 수정에 실패했습니다.");
    }
  };

  if (loading) return <p>게시글 불러오는 중...</p>;
  if (error) return <p>{error}</p>;
  if (!post) return <p>게시글을 찾을 수 없습니다.</p>;

  return (
    <div className="post-container">
      <div className="post-card">
        {/* 뒤로가기 버튼을 오른쪽 정렬 */}
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button onClick={() => navigate(-1)} className="back-button">
            ⬅ 뒤로가기
          </button>
        </div>
        {isEditing ? (
          <>
            <input
              type="text"
              value={editedTitle}
              onChange={(e) => setEditedTitle(e.target.value)}
              className="edit-title"
            />
            <textarea
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              className="edit-content"
            />
            <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
              <button onClick={handleUpdate}>수정 완료</button>
              <button onClick={() => setIsEditing(false)}>취소</button>
            </div>
          </>
        ) : (
          <>
            <h2 className="post-title">{post.title}</h2>
            <div className="post-meta">
              <p><strong>작성자:</strong> {post.author}</p>
              <p><strong>작성자 ID:</strong> {post.authorId}</p>
              <p>
                <strong>작성일:</strong>{" "}
                {new Date(post.createdAt).toLocaleString()}
              </p>
              <p><strong>조회수:</strong> {post.view}</p>
            </div>
            <hr />
            <p className="post-content">{post.content || "내용 없음"}</p>
            <div
              style={{
                display: "flex",
                justifyContent: "flex-start",
                gap: "10px",
                marginTop: "20px",
              }}
            >
              <button onClick={() => setIsEditing(true)} className="edit-button">
                수정
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default MyPostDetail;