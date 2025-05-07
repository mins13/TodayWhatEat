import { useParams, useNavigate } from "react-router-dom";
import './PostDetailPage.css';

export default function PostDetailPage() {
    const { postId } = useParams();
    const navigate = useNavigate();

    const post = {
        id: postId,
        title: "📢 새 업데이트 안내",
        author: "관리자",
        date: "2025-05-07",
        content: "이번 업데이트에서는 새로운 기능이 추가되었습니다!",
    };

    return (
        <div className="post-detail">
            <div className="post-detail-header">
                <h2 className="post-detail-title">{post.title}</h2>
                <button onClick={() => navigate(-1)}>목록으로</button>
            </div>

            <div className="post-detail-meta">
                작성자: {post.author} | 작성일: {post.date}
            </div>

            <div className="post-detail-content">{post.content}</div>
        </div>
    );
}
