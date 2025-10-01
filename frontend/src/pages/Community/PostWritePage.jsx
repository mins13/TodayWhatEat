import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/Community/CommunityLayout";
import "./PostWritePage.css";
import { createPost } from "../../api/communityApi";

const BOARD_CODE_MAP = {
    "자유 게시판": "free",
    "레시피 게시판": "recipe",
    "정보 게시판": "info",
    // "공지사항": "notice", // 필요하면 옵션 추가해서 사용
};

export default function PostWritePage() {
    const navigate = useNavigate();

    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [authorName, setAuthorName] = useState(""); // 선택 입력 (미입력 시 서버에서 "익명")
    const [board, setBoard] = useState("자유 게시판");
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (!title.trim()) {
            alert("제목을 입력하세요.");
            return;
        }
        if (!content.trim()) {
            alert("내용을 입력하세요.");
            return;
        }

        const boardCode = BOARD_CODE_MAP[board];
        if (!boardCode) {
            alert("게시판 선택이 올바르지 않습니다.");
            return;
        }

        try {
            setSubmitting(true);
            const { id } = await createPost(boardCode, { title, content, authorName });
            // 등록 성공 → 해당 게시판 상세로 이동
            navigate(`/community/${boardCode}/${id}`);
        } catch (e) {
            console.error(e);
            alert("글 등록에 실패했습니다. 잠시 후 다시 시도해주세요.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="main-container">
            <div className="community-wrapper">
                <div className="left-panel">
                    <Sidebar />
                </div>

                <div className="right-panel">
                    <h2 className="write-title">글쓰기</h2>

                    {/* 작성자(선택) */}
                    <input
                        className="write-input"
                        placeholder="작성자 (선택, 미입력 시 '익명')"
                        value={authorName}
                        onChange={(e) => setAuthorName(e.target.value)}
                    />

                    <input
                        className="write-input"
                        placeholder="제목을 작성하세요."
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                    />

                    <textarea
                        className="write-textarea"
                        placeholder="내용을 작성하세요."
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                    />

                    <div className="write-bottom">
                        <label>게시판 선택</label>
                        <select
                            className="write-select"
                            value={board}
                            onChange={(e) => setBoard(e.target.value)}
                            disabled={submitting}
                        >
                            <option>자유 게시판</option>
                            <option>레시피 게시판</option>
                            <option>정보 게시판</option>
                            {/* <option>공지사항</option> */}
                        </select>

                        <button
                            className="write-submit"
                            onClick={handleSubmit}
                            disabled={submitting}
                            title={submitting ? "저장 중..." : "저장"}
                        >
                            {submitting ? "저장 중..." : "저장"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
