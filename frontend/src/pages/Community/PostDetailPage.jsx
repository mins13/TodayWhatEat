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

    // 게시글
    const [post, setPost] = useState(null);
    const pageTitle = useMemo(
        () => BOARD_LABEL_MAP[board] ?? "커뮤니티",
        [board]
    );

    // 좋아요
    const [liked, setLiked] = useState(false);
    const [likes, setLikes] = useState(0);

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
                        isEditing: false,
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
                    isEditing: false,
                })),
            ]);
            setCommentPage(nextPage);
        } catch (e) {
            console.error(e);
            alert("댓글 더보기에 실패했습니다.");
        }
    };

    const handleLike = async () => {
        try {
            const { liked: nextLiked } = await togglePostLike(board, postId);
            setLiked(nextLiked);
            setLikes((prev) => (nextLiked ? prev + 1 : Math.max(0, prev - 1)));
        } catch (e) {
            const status = e?.response?.status;
            if (status === 401 || status === 403) {
                alert("좋아요 처리에 실패했습니다. 로그인 상태를 확인해주세요.");
            } else {
                alert("좋아요 처리 중 오류가 발생했습니다.");
            }
            console.error(e);
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
                { id, author: nickname, content, isEditing: false },
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
                            <span className="post-title">{post.title}</span>
                            {/* ✅ 서버 필드명에 맞춰 표시 */}
                            <span className="post-author">
                작성자: {post.authorName ?? post.author ?? "익명"}
              </span>
                        </div>

                        <div className="post-content">{post.content}</div>

                        <div className="post-reactions">
                            <button
                                className={`heart-btn ${liked ? "liked" : ""}`}
                                onClick={handleLike}
                                aria-pressed={liked}
                                title={liked ? "좋아요 취소" : "좋아요"}
                            >
                                {liked ? <HeartFilled size={24} /> : <HeartOutline size={24} />}
                            </button>
                            <span>{likes}</span>
                            {Number.isFinite(views) && (
                                <span style={{ color: "#666" }}>조회 {views}</span>
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
                                    <span className="comment-content">{comment.content}</span>
                                </div>
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
