import { useState } from "react";
import { useNavigate } from "react-router-dom";
import './PostWritePage.css';

export default function PostWritePage() {
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const navigate = useNavigate();

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log("제목:", title);
        console.log("내용:", content);
        navigate("/community/notice");
    };

    return (
        <div className="write-form">
            <h2 className="form-title">글쓰기</h2>
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label>제목</label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                    />
                </div>

                <div className="form-group">
                    <label>내용</label>
                    <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        required
                    ></textarea>
                </div>

                <div className="form-bottom">
                    <button type="button" onClick={() => navigate(-1)}>취소</button>
                    <button type="submit">작성 완료</button>
                </div>
            </form>
        </div>
    );
}
