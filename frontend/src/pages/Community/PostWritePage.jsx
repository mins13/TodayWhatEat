import React, { useState } from "react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import Sidebar from "../../components/Community/CommunityLayout";
import "./PostWritePage.css";

export default function PostWritePage() {
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [board, setBoard] = useState("자유 게시판");

    const handleSubmit = () => {
        alert(`제목: ${title}\n내용: ${content}\n게시판: ${board}`);
        // TODO: 실제 저장 API 연결
    };

    return (
        <div className="main-container">
            <div className="community-wrapper">
                <div className="left-panel">
                    <Sidebar />
                </div>

                <div className="right-panel">
                    <h2 className="write-title">글쓰기</h2>

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
                        >
                            <option>자유 게시판</option>
                            <option>레시피 게시판</option>
                            <option>정보 게시판</option>
                        </select>

                        <button className="write-submit" onClick={handleSubmit}>
                            저장
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
