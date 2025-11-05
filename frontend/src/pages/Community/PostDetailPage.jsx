// src/pages/Community/PostDetailPage.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./PostDetailPage.css";
import Sidebar from "../../components/Community/CommunityLayout.jsx";
import HeartFilled from "../../assets/icons/HeartFilled";
import HeartOutline from "../../assets/icons/HeartOutline";
import { getMyRecipe } from "../../api/myRecipeApi";

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

const IMG_PLACEHOLDER =
    "data:image/svg+xml;utf8," +
    encodeURIComponent(
        `<svg xmlns='http://www.w3.org/2000/svg' width='600' height='400'>
      <rect width='100%' height='100%' fill='#f2f2f2'/>
      <text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle'
        font-family='Arial' font-size='16' fill='#999'>이미지를 불러올 수 없습니다</text>
    </svg>`
    );

export default function PostDetailPage() {
    const { board = "free", postId } = useParams();
    const navigate = useNavigate();

    // 로그인 닉네임(없으면 '익명')
    const nickname =
        localStorage.getItem("nickname") ||
        localStorage.getItem("username") ||
        localStorage.getItem("name") ||
        "익명";

    // 게시글
    const [post, setPost] = useState(null);
    const pageTitle = useMemo(
        () => BOARD_LABEL_MAP[board] ?? "커뮤니티",
        [board]
    );
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

    // ===== 나만의 레시피 모달 관련 =====
    const [attachedRecipe, setAttachedRecipe] = useState(null);
    const [recipeModalOpen, setRecipeModalOpen] = useState(false);
    const [recipeShowAll, setRecipeShowAll] = useState(false);

    const recipeImage =
        attachedRecipe?.mainImageUrl || attachedRecipe?.imageUrl || IMG_PLACEHOLDER;

    const recipeIngredients = useMemo(() => {
        if (!attachedRecipe || !Array.isArray(attachedRecipe.ingredients)) return [];
        return attachedRecipe.ingredients
            .map((g) => {
                const name = g?.name || g?.ingredientName || "";
                const amount =
                    g?.amount || [g?.quantity, g?.unit].filter(Boolean).join(" ");
                return { name, amount };
            })
            .filter((g) => g.name);
    }, [attachedRecipe]);

    const recipeSteps = useMemo(() => {
        if (!attachedRecipe) return [];
        const list = attachedRecipe.steps;
        if (!Array.isArray(list)) return [];
        return list
            .map((s) => (typeof s === "string" ? s : s?.content || ""))
            .filter(Boolean);
    }, [attachedRecipe]);

    const openRecipeModal = () => {
        if (!attachedRecipe) return;
        setRecipeShowAll(false);
        setRecipeModalOpen(true);
        document.body.style.overflow = "hidden";
    };

    const closeRecipeModal = () => {
        setRecipeModalOpen(false);
        setRecipeShowAll(false);
        document.body.style.overflow = "";
    };

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

    // 게시글에 첨부된 나만의 레시피 로딩
    useEffect(() => {
        setAttachedRecipe(null);
        if (!post) return;

        console.log("[PostDetail] post 응답:", post);

        // 1) 서버가 통째로 내려주는 경우
        if (post.attachedRecipe && typeof post.attachedRecipe === "object") {
            console.log("[PostDetail] attachedRecipe 객체로 이미 포함됨");
            setAttachedRecipe(post.attachedRecipe);
            return;
        }

        // 2) ID만 내려주는 경우들 추정
        const attachedId =
            post.myRecipeId ||
            post.recipeId ||
            post.attachedRecipeId ||
            post.myRecipeId ||
            post.attachedMyRecipeId ||
            post.myRecipeDraftId ||
            post.draftId;

        console.log("[PostDetail] attachedId 추론값:", attachedId);

        if (!attachedId) return;

        (async () => {
            try {
                const rec = await getMyRecipe(attachedId);
                console.log("[PostDetail] getMyRecipe 응답:", rec);

                const ingredients =
                    (rec.ingredients || []).map((g) => ({
                        name: g?.name || "",
                        amount: [g?.quantity, g?.unit].filter(Boolean).join(" "),
                    })) || [];

                const steps =
                    (rec.steps || [])
                        .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
                        .map((s) => s?.content || "") || [];

                setAttachedRecipe({
                    id: rec.id,
                    title: rec.title,
                    mainImageUrl: rec.imageUrl,
                    tags: rec.tags || [],
                    ingredients,
                    steps,
                });
            } catch (e) {
                console.error(
                    "첨부 레시피 로드 실패",
                    e?.response?.status,
                    e?.response?.data || e
                );
            }
        })();
    }, [post]);

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
                console.log("[PostDetail] fetchPostDetail 응답:", data);
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
            prev.map((c) =>
                c.id === id ? { ...c, isEditing: true, editValue: c.content } : c
            )
        );
    };
    const cancelEdit = (id) => {
        setComments((prev) =>
            prev.map((c) =>
                c.id === id ? { ...c, isEditing: false, editValue: c.content } : c
            )
        );
    };
    const saveEdit = async (id) => {
        const target = comments.find((c) => c.id === id);
        const content = (target?.editValue || "").trim();
        if (!content) return alert("내용을 입력하세요.");
        try {
            await updateComment(board, postId, id, { content });
            setComments((prev) =>
                prev.map((c) =>
                    c.id === id ? { ...c, content, isEditing: false } : c
                )
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
            else
                setLikes((prev) => (nextLiked ? prev + 1 : Math.max(0, prev - 1)));
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
                    /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(
                        a?.url || a?.filename || ""
                    )
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
    const prevLight = () =>
        setLightboxIdx((i) => (i - 1 + imageAttachments.length) % imageAttachments.length);
    const nextLight = () =>
        setLightboxIdx((i) => (i + 1) % imageAttachments.length);

    // 키보드(ESC/←/→) - 라이트박스
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

    // 키보드(ESC) - 레시피 모달
    useEffect(() => {
        if (!recipeModalOpen) return;
        const onKey = (e) => {
            if (e.key === "Escape") closeRecipeModal();
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [recipeModalOpen]);

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
            if (status === 401 || status === 403)
                alert("로그인이 필요합니다.");
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
                        <button
                            className="back-button"
                            onClick={() => navigate(`/community/${board}`)}
                        >
                            목록으로
                        </button>
                    </div>
                    <hr className="title-divider" />

                    <div className="post-box">
                        <div className="post-title-bar">
                            {!isEditing ? (
                                <span className="post-title">{post.title}</span>
                            ) : (
                                <input
                                    className="post-edit-title"
                                    value={editTitle}
                                    onChange={(e) => setEditTitle(e.target.value)}
                                />
                            )}
                            <span className="post-author">
                작성자: {post.authorName ?? post.author ?? "익명"}
              </span>
                        </div>

                        {!isEditing ? (
                            <>
                                {/* 본문 */}
                                <div className="post-content">{post.content}</div>

                                {/* ===== 첨부 블록 + 캐러셀 ===== */}
                                {Array.isArray(post.attachments) &&
                                    post.attachments.length > 0 && (
                                        <div className="attachments-block">
                                            <div className="attachments-head">
                                                <strong>첨부 사진</strong>
                                                <span className="attachments-count">
                          ({imageAttachments.length})
                        </span>
                                            </div>
                                            <div className="attachments-divider" />

                                            <div
                                                className="attachments-carousel"
                                                onMouseEnter={syncArrows}
                                            >
                                                <button
                                                    type="button"
                                                    className="carousel-nav prev"
                                                    onClick={() => scrollByPage(-1)}
                                                    disabled={!canPrev}
                                                    aria-label="이전 이미지"
                                                >
                                                    ‹
                                                </button>

                                                <div
                                                    className="carousel-viewport"
                                                    ref={viewportRef}
                                                    onScroll={syncArrows}
                                                >
                                                    {post.attachments.map((img) => {
                                                        const label = img.filename || "attachment";
                                                        const srcOrName = img.url || img.filename || "";
                                                        const isImage =
                                                            /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(
                                                                srcOrName
                                                            );
                                                        if (!isImage) {
                                                            return (
                                                                <div
                                                                    className="carousel-slide"
                                                                    key={img.id ?? img.url ?? label}
                                                                >
                                                                    <a
                                                                        href={img.url}
                                                                        target="_blank"
                                                                        rel="noreferrer"
                                                                    >
                                                                        {label || "파일 다운로드"}
                                                                    </a>
                                                                </div>
                                                            );
                                                        }
                                                        const imageIndex = Math.max(
                                                            0,
                                                            imageAttachments.findIndex(
                                                                (a) =>
                                                                    (a?.id ?? a?.url) ===
                                                                    (img?.id ?? img?.url)
                                                            )
                                                        );
                                                        return (
                                                            <div
                                                                className="carousel-slide"
                                                                key={img.id ?? img.url ?? label}
                                                            >
                                                                <img
                                                                    src={img.url}
                                                                    alt={label}
                                                                    onLoad={syncArrows}
                                                                    onClick={() => openLightbox(imageIndex)}
                                                                    style={{ cursor: "zoom-in" }}
                                                                    onError={(e) => {
                                                                        e.currentTarget.style.display = "none";
                                                                        const link =
                                                                            document.createElement("a");
                                                                        link.href = img.url;
                                                                        link.textContent =
                                                                            label || "파일 다운로드";
                                                                        link.target = "_blank";
                                                                        e.currentTarget.parentElement?.appendChild(
                                                                            link
                                                                        );
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

                                {/* ===== 레시피 미리보기 (카드 → 모달 열기) ===== */}
                                {attachedRecipe && (
                                    <div className="post-recipe">
                                        <button
                                            type="button"
                                            className="post-recipe-card"
                                            onClick={openRecipeModal}
                                        >
                                            <div className="post-recipe-head">
                                                <img
                                                    src={recipeImage}
                                                    alt={attachedRecipe.title || "첨부 레시피"}
                                                    className="post-recipe-thumb"
                                                    onError={(e) => {
                                                        e.currentTarget.src = IMG_PLACEHOLDER;
                                                    }}
                                                />
                                                <div className="post-recipe-meta">
                                                    <b className="ellipsis-2">
                                                        {attachedRecipe.title || "제목 없는 레시피"}
                                                    </b>

                                                    {!!attachedRecipe.tags?.length && (
                                                        <div className="tags">
                                                            {attachedRecipe.tags
                                                                .slice(0, 5)
                                                                .map((t, i) => (
                                                                    <span key={i}>#{t}</span>
                                                                ))}
                                                            {attachedRecipe.tags.length > 5 && (
                                                                <span>
                                  +{attachedRecipe.tags.length - 5}
                                </span>
                                                            )}
                                                        </div>
                                                    )}

                                                    <span className="post-recipe-pill">
                            첨부됨 · 클릭해서 레시피 보기
                          </span>
                                                </div>
                                            </div>
                                        </button>
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
                                    {liked ? (
                                        <HeartFilled size={24} />
                                    ) : (
                                        <HeartOutline size={24} />
                                    )}
                                </button>
                                <span>{likes}</span>
                                {Number.isFinite(views) && (
                                    <span style={{ color: "#666" }}>조회 {views}</span>
                                )}
                            </div>

                            {isMine && (
                                <div className="post-actions">
                                    {!isEditing ? (
                                        <>
                                            <button
                                                type="button"
                                                className="post-action-link"
                                                onClick={beginEdit}
                                            >
                                                수정
                                            </button>
                                            <button
                                                type="button"
                                                className="post-action-link danger"
                                                onClick={() => {
                                                    if (
                                                        !window.confirm(
                                                            "게시글을 삭제하시겠습니까?"
                                                        )
                                                    )
                                                        return;
                                                    deletePost(board, postId)
                                                        .then(() => {
                                                            alert("삭제되었습니다.");
                                                            navigate(`/community/${board}`);
                                                        })
                                                        .catch((e) => {
                                                            const status =
                                                                e?.response?.status;
                                                            if (status === 401 || status === 403)
                                                                alert("로그인이 필요합니다.");
                                                            else
                                                                alert(
                                                                    e?.response?.data?.message ||
                                                                    "삭제에 실패했습니다."
                                                                );
                                                        });
                                                }}
                                            >
                                                삭제
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <button
                                                type="button"
                                                className="post-action-link"
                                                onClick={saveEditPost}
                                            >
                                                저장
                                            </button>
                                            <button
                                                type="button"
                                                className="post-action-link"
                                                onClick={cancelEditPost}
                                            >
                                                취소
                                            </button>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 댓글 영역 */}
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
                                        addComment(board, postId, {
                                            content,
                                            authorName: nickname,
                                        })
                                            .then(({ id }) => {
                                                setComments((prev) => [
                                                    {
                                                        id,
                                                        author: nickname,
                                                        mine: true,
                                                        content,
                                                        isEditing: false,
                                                        editValue: content,
                                                    },
                                                    ...prev,
                                                ]);
                                                setCommentTotal((t) => t + 1);
                                                setNewComment("");
                                            })
                                            .catch((err) => {
                                                const status = err?.response?.status;
                                                if (status === 401 || status === 403)
                                                    alert("로그인이 필요합니다.");
                                                else alert("댓글 작성에 실패했습니다.");
                                            });
                                    }
                                }}
                            />
                            <button
                                onClick={() => {
                                    const content = newComment.trim();
                                    if (!content) return;
                                    addComment(board, postId, {
                                        content,
                                        authorName: nickname,
                                    })
                                        .then(({ id }) => {
                                            setComments((prev) => [
                                                {
                                                    id,
                                                    author: nickname,
                                                    mine: true,
                                                    content,
                                                    isEditing: false,
                                                    editValue: content,
                                                },
                                                ...prev,
                                            ]);
                                            setCommentTotal((t) => t + 1);
                                            setNewComment("");
                                        })
                                        .catch((err) => {
                                            const status = err?.response?.status;
                                            if (status === 401 || status === 403)
                                                alert("로그인이 필요합니다.");
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
                                        <span className="comment-content">
                      {comment.content}
                    </span>
                                    ) : (
                                        <input
                                            className="comment-edit-input"
                                            type="text"
                                            value={comment.editValue}
                                            onChange={(e) =>
                                                setComments((prev) =>
                                                    prev.map((c) =>
                                                        c.id === comment.id
                                                            ? { ...c, editValue: e.target.value }
                                                            : c
                                                    )
                                                )
                                            }
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter") {
                                                    const content =
                                                        (comment.editValue || "").trim();
                                                    if (!content) return;
                                                    updateComment(board, postId, comment.id, {
                                                        content,
                                                    })
                                                        .then(() =>
                                                            setComments((prev) =>
                                                                prev.map((c) =>
                                                                    c.id === comment.id
                                                                        ? {
                                                                            ...c,
                                                                            content,
                                                                            isEditing: false,
                                                                        }
                                                                        : c
                                                                )
                                                            )
                                                        )
                                                        .catch(() =>
                                                            alert("댓글 수정에 실패했습니다.")
                                                        );
                                                }
                                            }}
                                        />
                                    )}
                                </div>

                                {comment.mine && (
                                    <div className="comment-actions">
                                        {!comment.isEditing ? (
                                            <>
                                                <button
                                                    type="button"
                                                    className="comment-btn"
                                                    onClick={() => startEdit(comment.id)}
                                                >
                                                    수정
                                                </button>
                                                <button
                                                    type="button"
                                                    className="comment-btn danger"
                                                    onClick={() => removeComment(comment.id)}
                                                >
                                                    삭제
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                <button
                                                    type="button"
                                                    className="comment-btn"
                                                    onClick={() => saveEdit(comment.id)}
                                                >
                                                    저장
                                                </button>
                                                <button
                                                    type="button"
                                                    className="comment-btn"
                                                    onClick={() => cancelEdit(comment.id)}
                                                >
                                                    취소
                                                </button>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}

                        {hasMoreComments && (
                            <button
                                className="toggle-comments-btn"
                                onClick={loadMoreComments}
                            >
                                댓글 더보기
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* ===== 레시피 상세 모달 ===== */}
            {recipeModalOpen && attachedRecipe && (
                <div
                    className="recipe-modal-backdrop"
                    onClick={(e) => {
                        if (e.target.classList.contains("recipe-modal-backdrop")) {
                            closeRecipeModal();
                        }
                    }}
                >
                    <div
                        className="recipe-modal-card"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="recipe-modal-header">
                            <div className="recipe-modal-title-box">
                                <span className="recipe-modal-label">첨부된 나만의 레시피</span>
                                <h3 className="recipe-modal-title">
                                    {attachedRecipe.title || "제목 없는 레시피"}
                                </h3>
                            </div>
                            <button
                                type="button"
                                className="recipe-modal-close"
                                onClick={closeRecipeModal}
                                aria-label="닫기"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="recipe-modal-top">
                            <img
                                src={recipeImage}
                                alt={attachedRecipe.title || "레시피 이미지"}
                                className="recipe-modal-image"
                                onError={(e) => {
                                    e.currentTarget.src = IMG_PLACEHOLDER;
                                }}
                                loading="lazy"
                            />

                            <div className="recipe-modal-ingredients-box">
                                <div className="recipe-modal-section-title">재료</div>

                                <div className="recipe-modal-ingredients-grid">
                                    {recipeIngredients.length === 0 ? (
                                        <div className="recipe-modal-empty">
                                            등록된 재료가 없어요
                                        </div>
                                    ) : (
                                        recipeIngredients.map((ing, i) => (
                                            <div
                                                className="recipe-modal-ingredient-card"
                                                key={i}
                                            >
                        <span className="ingredient-name">
                          {ing.name}
                        </span>
                                                {ing.amount && (
                                                    <span className="ingredient-amount">
                            {ing.amount}
                          </span>
                                                )}
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="recipe-modal-steps">
                            <div className="recipe-modal-section-title">레시피</div>
                            <ol>
                                {recipeSteps.length === 0 && (
                                    <li className="recipe-modal-empty">
                                        등록된 레시피 단계가 없어요
                                    </li>
                                )}
                                {recipeSteps.map((step, i) =>
                                    !recipeShowAll && i >= 3 ? null : (
                                        <li key={i}>{step}</li>
                                    )
                                )}
                            </ol>

                            {recipeSteps.length > 3 && (
                                <button
                                    type="button"
                                    className="recipe-modal-more-btn"
                                    onClick={() => setRecipeShowAll((v) => !v)}
                                >
                                    {recipeShowAll ? "접기 ▲" : "더보기 ▼"}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ===== 라이트박스 모달 ===== */}
            {lightboxOpen && imageAttachments.length > 0 && (
                <div
                    className="lightbox"
                    onClick={(e) =>
                        e.target.classList.contains("lightbox") && closeLightbox()
                    }
                >
                    <button
                        className="lightbox-close"
                        onClick={closeLightbox}
                        aria-label="닫기"
                    >
                        ✕
                    </button>
                    <button
                        className="lightbox-arrow prev"
                        onClick={(e) => {
                            e.stopPropagation();
                            prevLight();
                        }}
                        aria-label="이전"
                    >
                        ‹
                    </button>
                    <figure
                        className="lightbox-stage"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <img
                            src={imageAttachments[lightboxIdx].url}
                            alt={
                                imageAttachments[lightboxIdx].filename || "image"
                            }
                        />
                        <figcaption className="lightbox-caption">
                            {imageAttachments[lightboxIdx].filename ||
                                imageAttachments[lightboxIdx].url}
                            <span className="lightbox-count">
                {lightboxIdx + 1} / {imageAttachments.length}
              </span>
                        </figcaption>
                    </figure>
                    <button
                        className="lightbox-arrow next"
                        onClick={(e) => {
                            e.stopPropagation();
                            nextLight();
                        }}
                        aria-label="다음"
                    >
                        ›
                    </button>
                </div>
            )}
        </div>
    );
}
