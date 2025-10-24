import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./PostDetailPage.css";
import Sidebar from "../../components/Community/CommunityLayout.jsx";
import HeartFilled from "../../assets/icons/HeartFilled";
import HeartOutline from "../../assets/icons/HeartOutline";
import {
    fetchPostDetail,
    togglePostLike,
    fetchComments,
    addComment,
    updateComment,
    deleteComment,
    updatePost,
    deletePost,
} from "../../api/communityApi";

const BOARD_LABEL_MAP = {
    free: "자유 게시판",
    recipe: "레시피 게시판",
    info: "정보게시판",
    notice: "공지사항",
};

export default function PostDetailPage() {
    const { board = "free", postId } = useParams();
    const navigate = useNavigate();

    const [showRecipe, setShowRecipe] = useState(false);

    // 로그인 닉네임(없으면 '익명')
    const nickname =
        localStorage.getItem("nickname") ||
        localStorage.getItem("username") ||
        localStorage.getItem("name") ||
        "익명";

    // 게시글
    const [post, setPost] = useState(null);
    const pageTitle = useMemo(() => BOARD_LABEL_MAP[board] ?? "커뮤니티", [board]);
    const [isEditing, setIsEditing] = useState(false);
    const [editTitle, setEditTitle] = useState("");
    const [editContent, setEditContent] = useState("");

    // 좋아요
    const [liked, setLiked] = useState(false);
    const [likes, setLikes] = useState(0);
    const [liking, setLiking] = useState(false);

    // 조회수
    const [views, setViews] = useState(0);

    // 댓글
    const [comments, setComments] = useState([]);
    const [commentPage, setCommentPage] = useState(1);
    const [commentTotal, setCommentTotal] = useState(0);
    const [newComment, setNewComment] = useState("");
    const COMMENTS_PAGE_SIZE = 10;

    // ----- 첨부 이미지 캐러셀 -----
    const viewportRef = useRef(null);
    const [canPrev, setCanPrev] = useState(false);
    const [canNext, setCanNext] = useState(false);

    const syncArrows = () => {
        const el = viewportRef.current;
        if (!el) return;
        setCanPrev(el.scrollLeft > 2);
        setCanNext(el.scrollLeft < el.scrollWidth - el.clientWidth - 2);
    };
    const scrollByPage = (dir = 1) => {
        const el = viewportRef.current;
        if (!el) return;
        const delta = el.clientWidth * dir;
        el.scrollBy({ left: delta, behavior: "smooth" });
    };

    useEffect(() => {
        const onResize = () => syncArrows();
        window.addEventListener("resize", onResize);
        return () => window.removeEventListener("resize", onResize);
    }, []);

    // 상세 조회(서버에서 조회수 +1)
    useEffect(() => {
        if (!postId) return;
        (async () => {
            try {
                const data = await fetchPostDetail(board, postId);
                setPost(data);
                setEditTitle(data?.title ?? "");
                setEditContent(data?.content ?? "");
                setLikes(Number(data?.likesCount ?? 0));
                setViews(Number(data?.viewsCount ?? data?.viewCount ?? 0));
                if (typeof data?.liked === "boolean") setLiked(data.liked);

                // 캐러셀 화살표 갱신
                setTimeout(syncArrows, 0);
            } catch (e) {
                console.error(e);
                alert("게시글을 불러오지 못했습니다.");
                navigate(`/community/${board}`);
            }
        })();
    }, [board, postId, navigate]);

    // 댓글 1페이지
    useEffect(() => {
        if (!postId) return;
        (async () => {
            try {
                const { items, total } = await fetchComments(board, postId, {
                    page: 1,
                    size: COMMENTS_PAGE_SIZE,
                });
                setComments(
                    (items || []).map((c) => ({
                        id: c.id,
                        author: c.authorName ?? "익명",
                        content: c.content ?? "",
                        mine: !!c.mine,
                        isEditing: false,
                        editValue: c.content ?? "",
                    }))
                );
                setCommentTotal(total ?? 0);
                setCommentPage(1);
            } catch (e) {
                console.error(e);
                alert("댓글을 불러오지 못했습니다.");
            }
        })();
    }, [board, postId]);

    const hasMoreComments = comments.length < commentTotal;

    const loadMoreComments = async () => {
        const nextPage = commentPage + 1;
        try {
            const { items } = await fetchComments(board, postId, {
                page: nextPage,
                size: COMMENTS_PAGE_SIZE,
            });
            setComments((prev) => [
                ...prev,
                ...(items || []).map((c) => ({
                    id: c.id,
                    author: c.authorName ?? "익명",
                    content: c.content ?? "",
                    mine: !!c.mine,
                    isEditing: false,
                    editValue: c.content ?? "",
                })),
            ]);
            setCommentPage(nextPage);
        } catch (e) {
            console.error(e);
            alert("댓글 더보기에 실패했습니다.");
        }
    };

    const startEdit = (id) => {
        setComments((prev) =>
            prev.map((c) => (c.id === id ? { ...c, isEditing: true, editValue: c.content } : c))
        );
    };
    const cancelEdit = (id) => {
        setComments((prev) =>
            prev.map((c) => (c.id === id ? { ...c, isEditing: false, editValue: c.content } : c))
        );
    };
    const saveEdit = async (id) => {
        const target = comments.find((c) => c.id === id);
        const content = (target?.editValue || "").trim();
        if (!content) return alert("내용을 입력하세요.");
        try {
            await updateComment(board, postId, id, { content });
            setComments((prev) =>
                prev.map((c) => (c.id === id ? { ...c, content, isEditing: false } : c))
            );
        } catch (e) {
            alert("댓글 수정에 실패했습니다.");
            console.error(e);
        }
    };
    const removeComment = async (id) => {
        if (!window.confirm("댓글을 삭제할까요?")) return;
        try {
            await deleteComment(board, postId, id);
            setComments((prev) => prev.filter((c) => c.id !== id));
            setCommentTotal((t) => Math.max(0, t - 1));
        } catch (e) {
            alert("댓글 삭제에 실패했습니다.");
            console.error(e);
        }
    };

    const handleLike = async () => {
        if (liking) return;
        setLiking(true);
        try {
            const { liked: nextLiked, count } = await togglePostLike(board, postId);
            setLiked(nextLiked);
            if (Number.isFinite(count)) setLikes(count);
            else setLikes((prev) => (nextLiked ? prev + 1 : Math.max(0, prev - 1)));
        } catch (e) {
            const status = e?.response?.status;
            if (status === 401 || status === 403) {
                alert("좋아요 처리에 실패했습니다. 로그인 상태를 확인해주세요.");
            } else {
                alert("좋아요 처리 중 오류가 발생했습니다.");
            }
            console.error(e);
        } finally {
            setLiking(false);
        }
    };
    /* ========= 라이트박스(이미지 확대 보기) ========= */
    const attachments = post?.attachments ?? [];
    const imageAttachments = useMemo(
        () =>
            Array.isArray(attachments)
                ? attachments.filter((a) =>
                    /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(a?.url || a?.filename || "")
                )
                : [],
        [attachments]
    );
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [lightboxIdx, setLightboxIdx] = useState(0);

    const openLightbox = (idx) => {
        setLightboxIdx(idx);
        setLightboxOpen(true);
        document.body.style.overflow = "hidden"; // 배경 스크롤 잠금
    };
    const closeLightbox = () => {
        setLightboxOpen(false);
        document.body.style.overflow = "";
    };
    const prevLight = () => setLightboxIdx((i) => (i - 1 + imageAttachments.length) % imageAttachments.length);
    const nextLight = () => setLightboxIdx((i) => (i + 1) % imageAttachments.length);

    // 키보드(ESC/←/→)
    useEffect(() => {
        if (!lightboxOpen) return;
        const onKey = (e) => {
            if (e.key === "Escape") closeLightbox();
            else if (e.key === "ArrowLeft") prevLight();
            else if (e.key === "ArrowRight") nextLight();
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [lightboxOpen, imageAttachments.length]);

    if (!post) {
        return (
            <div className="main-container">
                <div className="community-wrapper">
                    <div className="left-panel">
                        <Sidebar />
                    </div>
                    <div className="right-panel">로딩 중...</div>
                </div>
            </div>
        );
    }

    const isMine = !!post?.mine;

    const beginEdit = () => {
        setEditTitle(post?.title ?? "");
        setEditContent(post?.content ?? "");
        setIsEditing(true);
    };
    const cancelEditPost = () => {
        setIsEditing(false);
        setEditTitle(post?.title ?? "");
        setEditContent(post?.content ?? "");
    };
    const saveEditPost = async () => {
        const title = (editTitle || "").trim();
        const content = (editContent || "").trim();
        if (!title) return alert("제목을 입력하세요.");
        if (!content) return alert("내용을 입력하세요.");
        try {
            const updated = await updatePost(board, postId, { title, content });
            setPost((prev) => ({ ...prev, ...updated, title, content }));
            setIsEditing(false);
            setTimeout(() => alert("수정되었습니다."), 0);
        } catch (e) {
            const status = e?.response?.status;
            if (status === 401 || status === 403) alert("로그인이 필요합니다.");
            else alert(e?.response?.data?.message || "수정에 실패했습니다.");
            console.error(e);
        }
    };



    return (
        <div className="main-container">
            <div className="community-wrapper">
                <div className="left-panel">
                    <Sidebar />
                </div>

                <div className="right-panel">
                    <div className="post-header">
                        <h2 className="page-title">{pageTitle}</h2>
                        <button className="back-button" onClick={() => navigate(`/community/${board}`)}>
                            목록으로
                        </button>
                    </div>
                    <hr className="title-divider" />

                    <div className="post-box">
                        <div className="post-title-bar">
                            {!isEditing ? (
                                <span className="post-title">{post.title}</span>
                            ) : (
                                <input className="post-edit-title" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
                            )}
                            <span className="post-author">작성자: {post.authorName ?? post.author ?? "익명"}</span>
                        </div>

                        {!isEditing ? (
                            <>
                                {/* 본문 */}
                                <div className="post-content">{post.content}</div>

                                {/* ===== 첨부 블록 + 캐러셀 ===== */}
                                {Array.isArray(post.attachments) && post.attachments.length > 0 && (
                                    <div className="attachments-block">
                                        <div className="attachments-head">
                                            <strong>첨부 사진</strong>
                                            <span className="attachments-count">({imageAttachments.length})</span>
                                        </div>
                                        <div className="attachments-divider" />

                                        <div className="attachments-carousel" onMouseEnter={syncArrows}>
                                            <button
                                                type="button"
                                                className="carousel-nav prev"
                                                onClick={() => scrollByPage(-1)}
                                                disabled={!canPrev}
                                                aria-label="이전 이미지"
                                            >
                                                ‹
                                            </button>

                                            <div className="carousel-viewport" ref={viewportRef} onScroll={syncArrows}>
                                                {post.attachments.map((img, idx) => {
                                                    const label = img.filename || "attachment";
                                                    const srcOrName = img.url || img.filename || "";
                                                    const isImage = /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(srcOrName);
                                                    if (!isImage) {
                                                        return (
                                                            <div className="carousel-slide" key={img.id ?? img.url ?? label}>
                                                                <a href={img.url} target="_blank" rel="noreferrer">
                                                                    {label || "파일 다운로드"}
                                                                </a>
                                                            </div>
                                                        );
                                                    }
                                                    // 이미지인 경우: 클릭 시 라이트박스 오픈 (이미지들만의 index 필요)
                                                    const imageIndex = Math.max(
                                                        0,
                                                        imageAttachments.findIndex((a) => (a?.id ?? a?.url) === (img?.id ?? img?.url))
                                                    );
                                                    return (
                                                        <div className="carousel-slide" key={img.id ?? img.url ?? label}>
                                                            <img
                                                                src={img.url}
                                                                alt={label}
                                                                onLoad={syncArrows}
                                                                onClick={() => openLightbox(imageIndex)}
                                                                style={{ cursor: "zoom-in" }}
                                                                onError={(e) => {
                                                                    e.currentTarget.style.display = "none";
                                                                    const link = document.createElement("a");
                                                                    link.href = img.url;
                                                                    link.textContent = label || "파일 다운로드";
                                                                    link.target = "_blank";
                                                                    e.currentTarget.parentElement?.appendChild(link);
                                                                }}
                                                            />
                                                        </div>
                                                    );
                                                })}
                                            </div>

                                            <button
                                                type="button"
                                                className="carousel-nav next"
                                                onClick={() => scrollByPage(1)}
                                                disabled={!canNext}
                                                aria-label="다음 이미지"
                                            >
                                                ›
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* ===== 레시피 미리보기 ===== */}
                                {post.attachedRecipe && (
                                    <div className="post-recipe">
                                        <div className="post-recipe-head">
                                            <img src={post.attachedRecipe.mainImageUrl} alt="recipe" />
                                            <div className="post-recipe-meta">
                                                <b className="ellipsis-2">{post.attachedRecipe.title}</b>
                                                {!!post.attachedRecipe.tags?.length && (
                                                    <div className="tags">
                                                        {post.attachedRecipe.tags.slice(0, 5).map((t, i) => (
                                                            <span key={i}>#{t}</span>
                                                        ))}
                                                        {post.attachedRecipe.tags.length > 5 && (
                                                            <span>+{post.attachedRecipe.tags.length - 5}</span>
                                                        )}
                                                    </div>
                                                )}
                                                <button type="button" className="toggle-recipe-btn" onClick={() => setShowRecipe((s) => !s)}>
                                                    {showRecipe ? "접기" : "레시피 더보기"}
                                                </button>
                                            </div>
                                        </div>

                                        {showRecipe && (
                                            <div className="post-recipe-body">
                                                {post.attachedRecipe.ingredients?.length > 0 && (
                                                    <>
                                                        <h5>재료</h5>
                                                        <ul className="ing-list">
                                                            {post.attachedRecipe.ingredients.map((it, idx) => (
                                                                <li key={idx}>
                                                                    <span className="ing-name">{it.name}</span>
                                                                    {it.amount && <span className="ing-amount">{it.amount}</span>}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </>
                                                )}

                                                {post.attachedRecipe.steps?.length > 0 && (
                                                    <>
                                                        <h5>만드는 법</h5>
                                                        <ol className="step-list">
                                                            {post.attachedRecipe.steps.map((s, i) => (
                                                                <li key={i}>{s}</li>
                                                            ))}
                                                        </ol>
                                                    </>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </>
                        ) : (
                            <textarea
                                className="post-edit-content"
                                rows={10}
                                value={editContent}
                                onChange={(e) => setEditContent(e.target.value)}
                            />
                        )}

                        <div className="post-footer">
                            <div className="post-reactions">
                                <button
                                    className={`heart-btn ${liked ? "liked" : ""}`}
                                    onClick={handleLike}
                                    aria-pressed={liked}
                                    aria-busy={liking}
                                    disabled={liking}
                                    title={liked ? "좋아요 취소" : "좋아요"}
                                >
                                    {liked ? <HeartFilled size={24} /> : <HeartOutline size={24} />}
                                </button>
                                <span>{likes}</span>
                                {Number.isFinite(views) && <span style={{ color: "#666" }}>조회 {views}</span>}
                            </div>

                            {isMine && (
                                <div className="post-actions">
                                    {!isEditing ? (
                                        <>
                                            <button type="button" className="post-action-link" onClick={beginEdit}>
                                                수정
                                            </button>
                                            <button
                                                type="button"
                                                className="post-action-link danger"
                                                onClick={() => {
                                                    if (!window.confirm("게시글을 삭제하시겠습니까?")) return;
                                                    deletePost(board, postId)
                                                        .then(() => {
                                                            alert("삭제되었습니다.");
                                                            navigate(`/community/${board}`);
                                                        })
                                                        .catch((e) => {
                                                            const status = e?.response?.status;
                                                            if (status === 401 || status === 403) alert("로그인이 필요합니다.");
                                                            else alert(e?.response?.data?.message || "삭제에 실패했습니다.");
                                                        });
                                                }}
                                            >
                                                삭제
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <button type="button" className="post-action-link" onClick={saveEditPost}>
                                                저장
                                            </button>
                                            <button type="button" className="post-action-link" onClick={cancelEditPost}>
                                                취소
                                            </button>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="comment-section">
                        <h4>댓글</h4>

                        <div className="comment-input-box">
                            <input
                                type="text"
                                placeholder="댓글을 입력하세요."
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        const content = newComment.trim();
                                        if (!content) return;
                                        addComment(board, postId, { content, authorName: nickname })
                                            .then(({ id }) => {
                                                setComments((prev) => [
                                                    { id, author: nickname, mine: true, content, isEditing: false, editValue: content },
                                                    ...prev,
                                                ]);
                                                setCommentTotal((t) => t + 1);
                                                setNewComment("");
                                            })
                                            .catch((err) => {
                                                const status = err?.response?.status;
                                                if (status === 401 || status === 403) alert("로그인이 필요합니다.");
                                                else alert("댓글 작성에 실패했습니다.");
                                            });
                                    }
                                }}
                            />
                            <button
                                onClick={() => {
                                    const content = newComment.trim();
                                    if (!content) return;
                                    addComment(board, postId, { content, authorName: nickname })
                                        .then(({ id }) => {
                                            setComments((prev) => [
                                                { id, author: nickname, mine: true, content, isEditing: false, editValue: content },
                                                ...prev,
                                            ]);
                                            setCommentTotal((t) => t + 1);
                                            setNewComment("");
                                        })
                                        .catch((err) => {
                                            const status = err?.response?.status;
                                            if (status === 401 || status === 403) alert("로그인이 필요합니다.");
                                            else alert("댓글 작성에 실패했습니다.");
                                        });
                                }}
                            >
                                보내기
                            </button>
                        </div>

                        {comments.map((comment) => (
                            <div key={comment.id} className="comment-box">
                                <div className="comment-left">
                                    <span className="comment-author">{comment.author}</span>

                                    {!comment.isEditing ? (
                                        <span className="comment-content">{comment.content}</span>
                                    ) : (
                                        <input
                                            className="comment-edit-input"
                                            type="text"
                                            value={comment.editValue}
                                            onChange={(e) =>
                                                setComments((prev) =>
                                                    prev.map((c) => (c.id === comment.id ? { ...c, editValue: e.target.value } : c))
                                                )
                                            }
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter") {
                                                    const content = (comment.editValue || "").trim();
                                                    if (!content) return;
                                                    updateComment(board, postId, comment.id, { content })
                                                        .then(() =>
                                                            setComments((prev) =>
                                                                prev.map((c) => (c.id === comment.id ? { ...c, content, isEditing: false } : c))
                                                            )
                                                        )
                                                        .catch(() => alert("댓글 수정에 실패했습니다."));
                                                }
                                            }}
                                        />
                                    )}
                                </div>

                                {comment.mine && (
                                    <div className="comment-actions">
                                        {!comment.isEditing ? (
                                            <>
                                                <button type="button" className="comment-btn" onClick={() => startEdit(comment.id)}>
                                                    수정
                                                </button>
                                                <button type="button" className="comment-btn danger" onClick={() => removeComment(comment.id)}>
                                                    삭제
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                <button type="button" className="comment-btn" onClick={() => saveEdit(comment.id)}>
                                                    저장
                                                </button>
                                                <button type="button" className="comment-btn" onClick={() => cancelEdit(comment.id)}>
                                                    취소
                                                </button>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}

                        {hasMoreComments && (
                            <button className="toggle-comments-btn" onClick={loadMoreComments}>
                                댓글 더보기
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* ===== 라이트박스 모달 ===== */}
            {lightboxOpen && imageAttachments.length > 0 && (
                <div className="lightbox" onClick={(e) => e.target.classList.contains("lightbox") && closeLightbox()}>
                    <button className="lightbox-close" onClick={closeLightbox} aria-label="닫기">✕</button>
                    <button className="lightbox-arrow prev" onClick={(e)=>{e.stopPropagation(); prevLight();}} aria-label="이전">‹</button>
                    <figure className="lightbox-stage" onClick={(e)=>e.stopPropagation()}>
                        <img src={imageAttachments[lightboxIdx].url} alt={imageAttachments[lightboxIdx].filename || "image"} />
                        <figcaption className="lightbox-caption">
                            {imageAttachments[lightboxIdx].filename || imageAttachments[lightboxIdx].url}
                            <span className="lightbox-count">
                {lightboxIdx + 1} / {imageAttachments.length}
              </span>
                        </figcaption>
                    </figure>
                    <button className="lightbox-arrow next" onClick={(e)=>{e.stopPropagation(); nextLight();}} aria-label="다음">›</button>
                </div>
            )}
        </div>
    );
}
