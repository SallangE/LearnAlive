import { useEffect, useState } from "react";
import { updatePost, downloadFile, likePost, checkIfLiked, getPostById } from "../api/postApi";
import { useAuth } from "../context/AuthContext";

function PostDetail({ post, onBack, onUpdate, onLikeToggle, fetchData }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState("");
  const [editedContent, setEditedContent] = useState("");
  const { user } = useAuth();
  const [isLiked, setIsLiked] = useState(false);
  const [postLikes, setPostLikes] = useState(post.likes || 0);
  const [loading, setLoading] = useState(true);
  const [updatedPost, setUpdatedPost] = useState(post);

  const handleBackClick = () => {
    if (onBack) {
      onBack();
      if (fetchData) {
        fetchData();
      }
    }
  };

  useEffect(() => {
    if (post && user) {
      const fetchLikedStatus = async () => {
        setLoading(true);
        try {
          const liked = await checkIfLiked(post.postId, user.userId);
          setIsLiked(liked);
        } catch (error) {
          console.error("좋아요 상태 확인 오류:", error);
        } finally {
          setLoading(false);
        }
      };
      fetchLikedStatus();
      setEditedTitle(post.title);
      setEditedContent(post.content);
      setPostLikes(post.likes);
    }
  }, [post, user]);

  const handleLikeClick = async (postId) => {
    try {
      const updatedPost = await likePost(postId, user.userId);
      setIsLiked((prev) => !prev);
      setPostLikes(updatedPost.data.totalLikes);
      onLikeToggle(postId, updatedPost.data.totalLikes);
      alert(!isLiked ? "좋아요를 눌렀습니다." : "좋아요가 취소되었습니다.");
    } catch (error) {
      console.error("좋아요 처리 중 오류:", error);
      alert("좋아요 처리 중 오류가 발생했습니다.");
    }
  };

  const handleEditClick = () => {
    setIsEditing(true);
  };

  const handleUpdate = async () => {
    try {
      const updatedPost = {
        title: editedTitle,
        content: editedContent,
      };
      await updatePost(post.postId, updatedPost);
      alert("게시글이 수정되었습니다.");
      setIsEditing(false);
      const freshPost = await getPostById(post.postId);
      setUpdatedPost(freshPost);
      onUpdate(updatedPost);
    } catch (error) {
      alert("게시글 수정에 실패했습니다.");
      console.error("게시글 수정 오류:", error);
    }
  };

  const handleDownloadClick = async () => {
    try {
      const fileData = await downloadFile(post.postId, { responseType: 'blob' });
      const fileBlob = new Blob([fileData], { type: fileData.type });
      const fileName = post.filePath.split("/").pop();
      const link = document.createElement("a");
      link.href = URL.createObjectURL(fileBlob);
      link.download = fileName;
      link.click();
    } catch (error) {
      console.error("파일 다운로드 오류:", error);
      alert("파일 다운로드에 실패했습니다.");
    }
  };

  return (
    <div
      className="p-4"
      style={{
        backgroundColor: "#fff",
        borderRadius: "12px",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
        maxWidth: "100%",
        width: "100%",
        margin: "0 auto",
        padding: "20px",
        boxSizing: "border-box"
      }}
    >
      <div className="post-card">
      <button onClick={onBack} className="back-button" style={{ display: "block", marginLeft: "auto" }}>
        ⬅ 돌아가기
      </button>
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
            <button className="save-button" onClick={handleUpdate}>수정 완료</button>
            <button className="cancel-button" onClick={() => setIsEditing(false)}>취소</button>
          </>
        ) : (
          <>
            <h2>{updatedPost.title || "제목 없음"}</h2>
            <hr />
            <div className="post-meta">
              <p><strong>작성자:</strong> {updatedPost.author || "작성자 정보 없음"}</p>
              <p><strong>작성자 ID:</strong> {updatedPost.authorId || "ID 없음"}</p>
              <p><strong>작성일:</strong> {new Date(updatedPost.createdAt).toLocaleString() || "날짜 없음"}</p>
              <p><strong>조회수:</strong> {updatedPost.view || 0}</p>
              <p><strong>좋아요:</strong> {postLikes || 0}</p>
            </div>
            <hr />
            <div>
              <p className="post-content">{updatedPost.content || "내용 없음"}</p>

              {/* ✅ 버튼 한 줄에 하나씩 표시 */}
              <div style={{ display: "flex", flexDirection: "row", gap: "5px", marginTop: "20px", flexWrap: "wrap" }}>
              <button
                  onClick={() => handleLikeClick(updatedPost.postId)}
                  className="like-button"
                >
                  {isLiked ? "좋아요 취소" : "👍 좋아요"}
                </button>

                {post.filePath && (
                  <button className="normal-button" onClick={handleDownloadClick}>
                    파일 다운로드 : {post.createdAt}({postLikes})
                  </button>
                )}

                {updatedPost.authorId === user.userId && (
                  <button className="edit-button" onClick={handleEditClick}>
                    수정
                  </button>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default PostDetail;
