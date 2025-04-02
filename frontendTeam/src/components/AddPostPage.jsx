import { useState } from "react";
import { createPost } from "../api/postApi";
import { useAuth } from "../context/AuthContext";

function AddPostPage({ boardId, onCancle, onPostCreated }) {
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleAddPost = async (e) => {
    e.preventDefault();
    if (!boardId) {
      alert("boardId가 없습니다.");
      return;
    }

    const postData = {
      boardId,
      authorId: user.userId,
      authorRole: user.role,
      author: user.username,
      title,
      content,
    };

    const formData = new FormData();
    if (file) formData.append("file", file);
    formData.append("post", JSON.stringify(postData));

    try {
      const response = await createPost(boardId, postData, file);
      if (response) {
        onPostCreated(response);
      }
    } catch (error) {
      console.error("업로드 실패", error);
    }
  };

  return (
    <div className="p-4 d-flex flex-column align-items-center">
      <h3 className="fw-bold mb-4 w-100 text-start">📄 게시글 추가</h3>

      <form onSubmit={handleAddPost} className="w-100 d-flex flex-column align-items-center gap-3">
        {/* 제목 */}
        <div className="w-100" style={{ maxWidth: "95%", marginBottom: "1rem" }}>
          <label
            className="form-label d-block"
            style={{ fontSize: "1.1rem", fontWeight: "600", marginBottom: "0.5rem" }}
          >
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

        {/* 파일 업로드 */}
<div className="w-100" style={{ maxWidth: "95%", marginBottom: "1rem" }}>
  <label
    className="form-label d-block fw-semibold"
    style={{ fontSize: "1.1rem", fontWeight: "600", marginBottom: "0.5rem" }}
  >
    파일 첨부
  </label>

  <div
    className="p-4 rounded text-center bg-light"
    style={{
      border: dragActive ? "2px dashed #4caf50" : "2px dashed #ccc",
      width: "100%",
      transition: "border 0.2s ease-in-out",
      marginTop: "8px"
    }}
    onDragOver={handleDragOver}
    onDragLeave={handleDragLeave}
    onDrop={handleDrop}
  >
    {/* 안내 문구 */}
    <div className="mb-2 text-muted">
      이곳에 파일을 드래그하거나{" "}
      <span
        onClick={() => document.getElementById("fileUpload").click()}
        style={{ color: "#0d6efd", textDecoration: "underline", cursor: "pointer" }}
      >
        파일을 선택하세요.
      </span>
    </div>

    {/* 숨겨진 파일 업로드 input */}
    <input
      type="file"
      id="fileUpload"
      style={{ display: "none" }}
      onChange={handleFileChange}
    />

    {/* 선택된 파일명 표시 */}
    {file && (
      <div className="mt-2 text-success small">
        선택된 파일: <strong>{file.name}</strong>
      </div>
    )}
  </div>
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
            <button type="submit" className="normal-button">
              작성
            </button>
            <button type="button" className="delete-button" onClick={onCancle}>
              취소
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

export default AddPostPage;