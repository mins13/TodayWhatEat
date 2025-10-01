import { useEffect, useState } from "react";
import { fetchAdminSummary } from "../../api/adminApi";

export default function AdminDashboard() {
    const [s, setS] = useState(null);
    useEffect(() => {
        fetchAdminSummary().then(setS).catch(console.error);
    }, []);

    if (!s) return <div className="loading">로딩...</div>;

    return (
        <>
            <h2 className="page-title">대시보드</h2>

            {/* 상단 KPI 카드 */}
            <div className="cards">
                <div className="card kpi">
                    <div className="kpi-title">사용자 수</div>
                    <div className="kpi-num">{s.users}</div>
                </div>
                <div className="card kpi">
                    <div className="kpi-title">게시글 수</div>
                    <div className="kpi-num">{s.posts}</div>
                </div>
            </div>

            {/* 온보딩/체크리스트 느낌의 패널 (참고 UI 스타일) */}
            <div className="columns">
                <div className="card column">
                    <div className="column-title">기본 설정</div>
                    <ul className="todo">
                        <li>사이트 정보 확인</li>
                        <li>회원 등급/권한 정책 정리</li>
                        <li>약관/개인정보 처리방침 점검</li>
                    </ul>
                </div>

                <div className="card column">
                    <div className="column-title">운영 체크</div>
                    <ul className="todo">
                        <li>공지사항 등록</li>
                        <li>게시판 카테고리 점검</li>
                        <li>부적절 게시글/댓글 관리</li>
                    </ul>
                </div>

                <div className="card column">
                    <div className="column-title">성장하기</div>
                    <ul className="todo">
                        <li>인기 레시피 선정</li>
                        <li>이벤트/캠페인 기획</li>
                        <li>알림/메일 발송</li>
                    </ul>
                </div>
            </div>
        </>
    );
}
