// src/pages/Community/PostDetailPage.jsx
import React, { useEffect, useMemo, useState } from "react";
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

    // ------- 공통: 현재 로그인 닉네임 (없으면 '익명')
    const nickname =
        localStorage.getItem("nickname") ||
        localStorage.getItem("username") ||
        localStorage.getItem("name") ||
        "익명";
    const userId = localStorage.getItem("userId");

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
                // 서버 필드명(authorName)에 맞춰 매핑
                setComments(
                    (items || []).map((c) => ({
                        id: c.id,
                        author: c.authorName ?? "익명",
                        content: c.content ?? "",
                        mine: !!c.mine,              // ✅ 서버에서 온 소유 여부
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
        setComments(prev => prev.map(c => c.id === id ? { ...c, isEditing: true, editValue: c.content } : c));
    };

    const cancelEdit = (id) => {
        setComments(prev => prev.map(c => c.id === id ? { ...c, isEditing: false, editValue: c.content } : c));
    };

    const saveEdit = async (id) => {
        const target = comments.find(c => c.id === id);
        const content = (target?.editValue || "").trim();
        if (!content) return alert("내용을 입력하세요.");
        try {
            await updateComment(board, postId, id, { content });
            setComments(prev => prev.map(c =>
                c.id === id ? { ...c, content, isEditing: false } : c
            ));
        } catch (e) {
            alert("댓글 수정에 실패했습니다."); console.error(e);
        }
    };

    const removeComment = async (id) => {
        if (!window.confirm("댓글을 삭제할까요?")) return;
        try {
            await deleteComment(board, postId, id);
            setComments(prev => prev.filter(c => c.id !== id));
            setCommentTotal(t => Math.max(0, t - 1));
        } catch (e) {
            alert("댓글 삭제에 실패했습니다."); console.error(e);
        }
    };


    const handleLike = async () => {
        if (liking) return;
        setLiking(true);
        try {
            const { liked: nextLiked, count } = await togglePostLike(board, postId);
            setLiked(nextLiked);
            if (Number.isFinite(count)) {
                setLikes(count); // 서버가 내려준 총 개수로 맞춤
            } else {
                // (백엔드에 count 없을 때를 대비한 안전장치)
                setLikes((prev) => (nextLiked ? prev + 1 : Math.max(0, prev - 1)));
            }
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


    const handleCommentSubmit = async () => {
        const content = newComment.trim();
        if (!content) return;

        try {
            // ✅ 닉네임을 authorName으로 함께 보냄 (원하면 서버에서 기본값 설정도 가능)
            const { id } = await addComment(board, postId, {
                content,
                authorName: nickname,
            });
            // 낙관적 업데이트
            setComments((prev) => [
                { id, author: nickname,mine: true,  content, isEditing: false,editValue: content, },
                ...prev,
            ]);
            setCommentTotal((t) => t + 1);
            setNewComment("");
        } catch (e) {
            const status = e?.response?.status;
            if (status === 401 || status === 403) {
                alert("로그인이 필요합니다.");
            } else {
                alert("댓글 작성에 실패했습니다.");
            }
            console.error(e);
        }
    };

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
                 // 서버 응답 기준으로 post 갱신
                     setPost(prev => ({ ...prev, ...updated, title, content }));
                 setIsEditing(false);
                 // 접근성 피드백
                     setTimeout(() => alert("수정되었습니다."), 0);
           } catch (e) {
               const status = e?.response?.status;
                if (status === 401 || status === 403) alert("로그인이 필요합니다.");
                else alert(e?.response?.data?.message || "수정에 실패했습니다.");
                 console.error(e);
              }
         };

         const removePost = async () => {
           if (!window.confirm("게시글을 삭제하시겠습니까?")) return;
           try {
                 await deletePost(board, postId);
                 alert("삭제되었습니다.");
                 navigate(`/community/${board}`);
               } catch (e) {
                 const status = e?.response?.status;
                 if (status === 401 || status === 403) alert("로그인이 필요합니다.");
                 else alert(e?.response?.data?.message || "삭제에 실패했습니다.");
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
                                />)}

                            <span className="post-author">
                작성자: {post.authorName ?? post.author ?? "익명"}
              </span>
                        </div>

                        {!isEditing ? (
                                <div className="post-content">{post.content}</div>
                        ) : (
                            <textarea
                                className="post-edit-content"
                                rows={10}
                                value={editContent}
                                onChange={(e) => setEditContent(e.target.value)}
                            />)}
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
                            {Number.isFinite(views) && (
                                <span style={{ color: "#666" }}>조회 {views}</span>
                            )}
                        </div>
                        {/* ✅ 우측 하단 액션: 내 글일 때만 표시 */}
                        {isMine && (
                             <div className="post-actions">
                                   {!isEditing ? (
                                     <>
                                         <button type="button" className="post-action-link" onClick={beginEdit}>수정</button>
                                         <button type="button" className="post-action-link danger" onClick={removePost}>삭제</button>
                                         </>
                                   ) : (
                                     <>
                                         <button type="button" className="post-action-link" onClick={saveEditPost}>저장</button>
                                         <button type="button" className="post-action-link" onClick={cancelEditPost}>취소</button>
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
                                    if (e.key === "Enter") handleCommentSubmit();
                                }}
                            />
                            <button onClick={handleCommentSubmit}>보내기</button>
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
                                                setComments(prev => prev.map(c =>
                                                    c.id === comment.id ? { ...c, editValue: e.target.value } : c
                                                ))
                                            }
                                            onKeyDown={(e) => { if (e.key === "Enter") saveEdit(comment.id); }}
                                        />
                                    )}
                                </div>

                                {/* 내 댓글에만 액션 버튼 */}
                                {comment.mine && (
                                    <div className="comment-actions">
                                        {!comment.isEditing ? (
                                            <>
                                                <button type="button" className="comment-btn" onClick={() => startEdit(comment.id)}>수정</button>
                                                <button type="button" className="comment-btn danger" onClick={() => removeComment(comment.id)}>삭제</button>
                                            </>
                                        ) : (
                                            <>
                                                <button type="button" className="comment-btn" onClick={() => saveEdit(comment.id)}>저장</button>
                                                <button type="button" className="comment-btn" onClick={() => cancelEdit(comment.id)}>취소</button>
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
        </div>
    );
}
