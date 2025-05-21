import { useParams, useNavigate } from "react-router-dom";
import React, { useState } from "react";
import './PostDetailPage.css';
import Sidebar from "../../components/Community/CommunityLayout.jsx";
import HeartFilled from "../../assets/icons/HeartFilled";
import HeartOutline from "../../assets/icons/HeartOutline";

export default function PostDetailPage() {
    const { postId } = useParams();
    const navigate = useNavigate();

    const [liked, setLiked] = useState(false);
    const [likes, setLikes] = useState(7);
    const [showAllComments, setShowAllComments] = useState(false);
    const [comments, setComments] = useState([
        { id: 1, author: "맛집탐험가", content: "밖에 나가서 맛집 돌아다녀봐 은근 재밌음", isEditing: false },
        { id: 2, author: "음식사랑", content: "룰 하실?", isEditing: false },
        { id: 3, author: "이민영", content: "원하면 요리 추천 해줄까?", isEditing: false },
        { id: 4, author: "사용자1", content: "저도 요리 좋아해요!", isEditing: false },
        { id: 5, author: "사용자2", content: "오늘은 볶음밥 어떠세요?", isEditing: false },
        { id: 6, author: "사용자3", content: "에어프라이어로 감자 구워보세요!", isEditing: false },
        { id: 7, author: "사용자4", content: "달걀찜 추천!", isEditing: false },
        { id: 8, author: "사용자5", content: "김치전 최고입니다.", isEditing: false },
    ]);
    const [newComment, setNewComment] = useState("");

    const handleLike = () => {
        setLikes(prev => liked ? prev - 1 : prev + 1);
        setLiked(!liked);
    };

    const handleCommentSubmit = () => {
        if (newComment.trim()) {
            const newId = comments.length ? Math.max(...comments.map(c => c.id)) + 1 : 1;
            setComments(prev => [
                { id: newId, author: "익명", content: newComment, isEditing: false },
                ...prev
            ]);
            setNewComment("");
        }
    };

    const handleDelete = (id) => {
        setComments(prev => prev.filter(comment => comment.id !== id));
    };

    const handleEditToggle = (id) => {
        setComments(prev => prev.map(comment =>
            comment.id === id ? { ...comment, isEditing: !comment.isEditing } : comment
        ));
    };

    const handleEditChange = (id, newContent) => {
        setComments(prev => prev.map(comment =>
            comment.id === id ? { ...comment, content: newContent } : comment
        ));
    };

    const post = {
        id: postId,
        title: "오늘 뭐할까",
        author: "익명",
        content: "오늘 좀 심심한데 뭐 하면서 놀지 요리나 해볼까?"
    };

    const visibleComments = showAllComments ? comments : comments.slice(0, 7);

    return (
        <div className="main-container">
            <div className="community-wrapper">
                <div className="left-panel">
                    <Sidebar />
                </div>

                <div className="right-panel">
                    <h2 className="page-title">자유 게시판</h2>
                    <hr className="title-divider" />

                    <div className="post-box">
                        <div className="post-title-bar">
                            <span className="post-title">{post.title}</span>
                            <span className="post-author">작성자: {post.author}</span>
                        </div>
                        <div className="post-content">{post.content}</div>
                        <div className="post-reactions">
                            <button className="heart-btn" onClick={handleLike}>
                                {liked ? <HeartFilled size={24} /> : <HeartOutline size={24} />}
                            </button>
                            <span>{likes}</span>
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
                            />
                            <button onClick={handleCommentSubmit}>보내기</button>
                        </div>

                        {visibleComments.map((comment) => (
                            <div key={comment.id} className="comment-box">
                                <div className="comment-left">
                                    <span className="comment-author">{comment.author}</span>
                                    {comment.isEditing ? (
                                        <input
                                            className="comment-edit-input"
                                            value={comment.content}
                                            onChange={(e) => handleEditChange(comment.id, e.target.value)}
                                        />
                                    ) : (
                                        <span className="comment-content">{comment.content}</span>
                                    )}
                                </div>
                                <span className="edit-delete">
                                    <button onClick={() => handleEditToggle(comment.id)}>
                                        {comment.isEditing ? "저장" : "수정"}
                                    </button>{" "}
                                    |{" "}
                                    <button onClick={() => handleDelete(comment.id)}>삭제</button>
                                </span>
                            </div>
                        ))}

                        {comments.length > 7 && (
                            <button
                                className="toggle-comments-btn"
                                onClick={() => setShowAllComments(!showAllComments)}
                            >
                                {showAllComments ? "접기" : "댓글 더보기"}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
