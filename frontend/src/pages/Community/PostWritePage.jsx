import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/Community/CommunityLayout";
import "./PostWritePage.css";
import { createPostMultipart } from "../../api/communityApi";
import useRequireAuth from "../../hooks/useRequireAuth";
import RecipeSelectModal from "../../components/Community/RecipeSelectModal";

const BOARD_CODE_MAP = {
    "자유 게시판": "free",
    "레시피 게시판": "recipe",
    "정보 게시판": "info",
};

export default function PostWritePage() {
    const ready = useRequireAuth();
    if (!ready) return null;
    return <PostWritePageInner />;
}

function PostWritePageInner() {
    const navigate = useNavigate();

    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [authorName, setAuthorName] = useState("");
    const [board, setBoard] = useState("자유 게시판");
    const [submitting, setSubmitting] = useState(false);

    // --- 첨부파일(이미지)
    const [files, setFiles] = useState([]);            // File[]
    const [previews, setPreviews] = useState([]);      // blob url

    // --- 레시피 첨부(나만의 레시피)
    const [recipeModal, setRecipeModal] = useState(false);
    const [selectedRecipe, setSelectedRecipe] = useState(null); // {id,title,mainImageUrl}

    const accept = useMemo(() => ".jpg,.jpeg,.png,.webp,.gif", []);

    const onPickFiles = (e) => {
        const list = Array.from(e.target.files || []);
        // 용량/타입 간단 검증
        const filtered = list.filter(f => f.size <= 10 * 1024 * 1024 && accept.includes(f.type.split("/")[1]));
        setFiles(prev => [...prev, ...filtered]);

        const urls = filtered.map(f => URL.createObjectURL(f));
        setPreviews(prev => [...prev, ...urls]);
    };

    const removeFile = (idx) => {
        setFiles(prev => prev.filter((_, i) => i !== idx));
        setPreviews(prev => {
            URL.revokeObjectURL(prev[idx]);
            return prev.filter((_, i) => i !== idx);
        });
    };

    const clearRecipe = () => setSelectedRecipe(null);

    const handleSubmit = async () => {
        if (!title.trim()) return alert("제목을 입력하세요.");
        if (!content.trim()) return alert("내용을 입력하세요.");

        const boardCode = BOARD_CODE_MAP[board];
        if (!boardCode) return alert("게시판 선택이 올바르지 않습니다.");

        try {
            setSubmitting(true);
            const { id } = await createPostMultipart(boardCode, {
                title: title.trim(),
                content: content.trim(),
                authorName: authorName.trim(),
                files,
                recipeId: selectedRecipe?.id,
            });
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
                <div className="left-panel"><Sidebar /></div>

                <div className="right-panel">
                    <h2 className="write-title">글쓰기</h2>

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

                    {/* --- 첨부: 이미지 --- */}
                    <div className="attach-block">
                        <div className="attach-header">
                            <span>첨부 사진</span>
                            <label className="attach-btn">
                                파일 선택
                                <input
                                    type="file"
                                    accept={accept}
                                    multiple
                                    onChange={onPickFiles}
                                    style={{ display: "none" }}
                                />
                            </label>
                        </div>
                        {previews.length > 0 && (
                            <div className="thumb-grid">
                                {previews.map((src, i) => (
                                    <div key={i} className="thumb-item">
                                        <img src={src} alt={`첨부${i + 1}`} />
                                        <button type="button" className="thumb-del" onClick={() => removeFile(i)}>×</button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* --- 첨부: 나만의 레시피 --- */}
                    <div className="attach-block">
                        <div className="attach-header">
                            <span>레시피 첨부</span>
                            <button type="button" className="attach-btn" onClick={() => setRecipeModal(true)}>
                                나만의 레시피 선택
                            </button>
                            {selectedRecipe && (
                                <button type="button" className="attach-subtle" onClick={clearRecipe}>해제</button>
                            )}
                        </div>

                        {selectedRecipe && (
                            <div className="recipe-chip">
                                <img src={selectedRecipe.mainImageUrl} alt="thumb" />
                                <div className="recipe-chip-info">
                                    <b>{selectedRecipe.title}</b>
                                    <span>첨부됨</span>
                                </div>
                            </div>
                        )}
                    </div>

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

            {/* 레시피 선택 모달 */}
            {recipeModal && (
                <RecipeSelectModal
                    onClose={() => setRecipeModal(false)}
                    onSelect={(recipe) => { setSelectedRecipe(recipe); setRecipeModal(false); }}
                />
            )}
        </div>
    );
}
