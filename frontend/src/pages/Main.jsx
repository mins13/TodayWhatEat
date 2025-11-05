import React, { useEffect, useState,useRef } from "react";
import "./Main.css";
import Carousel from "../components/Carousel";
import { useNavigate } from "react-router-dom";
import { fetchRecipesSorted, fetchBoardList, fetchHotPosts } from "../api/homeApi";

export default function Main() {
    const nav = useNavigate();

    const [popular, setPopular] = useState([]);   // 인기 레시피(좋아요 순)
    const [hotPosts, setHotPosts] = useState([]);          // HOT 레시피(조회수/최근 인기)
    const [notices, setNotices] = useState([]);  // 공지사항
    const [free, setFree] = useState([]);        // 자유게시판
    const [recipeBoard, setRecipeBoard] = useState([]); // 레시피게시판
    const [info, setInfo] = useState([]);        // 정보게시판

    const did = useRef(false);
    useEffect(() => {
        if (did.current) return;
        did.current = true;

        // 여기에서만 호출
        fetchRecipesSorted("popular", 1, 8)
            .then(list => setPopular(list.slice(0, 8)))
            .catch(console.error);
        fetchHotPosts(6).then(setHotPosts).catch(console.error);
        fetchBoardList("notice", { size: 6 }).then(setNotices).catch(console.error);
        fetchBoardList("free",   { size: 6 }).then(setFree).catch(console.error);
        fetchBoardList("recipe", { size: 6 }).then(setRecipeBoard).catch(console.error);
        fetchBoardList("info",   { size: 6 }).then(setInfo).catch(console.error);
    }, []);
    return (
        <div className="main-container">
            <div className="content-wrapper">
                {/* 1) 상단 캐러셀 */}
                <section className="main-carousel">
                    <Carousel />
                </section>

                {/* 2) 메인 그리드 */}
                <section className="home-grid">
                    {/* 2-1. 인기 레시피 */}
                    <div className="card">
                        <div className="card-head">
                            <h3>인기 레시피</h3>
                            <button className="link" onClick={() => nav("/recipe")}>더 보기</button>
                        </div>
                        <RecipeThumbGrid items={popular} onClick={(id)=>nav(`/recipe/${id}`)} />
                    </div>

                    {/* 2-2. HOT 게시물 */}
                    <div className="card">
                        <div className="card-head">
                            <h3>HOT 게시물 🔥</h3>
                            <button className="link" onClick={() => nav("/community/free")}>더 보기</button>
                        </div>
                        <MiniBoardList
                            items={hotPosts}
                            onClick={(item)=> nav(`/community/${item.board || 'free'}/${item.id}`)}
                            />
                    </div>

                    {/* 2-3. 공지사항 */}
                    <div className="card">
                        <div className="card-head">
                            <h3>공지사항</h3>
                            <button className="link" onClick={() => nav("/community/notice")}>더 보기</button>
                        </div>
                        <MiniBoardList items={notices} onClick={(item)=>nav(`/community/notice/${item.id}`)} />
                    </div>

                    {/* 2-4. 각 게시판 미니 리스트(자유/레시피/정보) */}
                    <div className="boards-grid card">
                        <BoardMini
                            title="자유게시판"
                            items={free}
                            onMore={() => nav("/community/free")}
                            onClickItem={(item)=>nav(`/community/free/${item.id}`)}
                        />
                        <BoardMini
                            title="레시피 게시판"
                            items={recipeBoard}
                            onMore={() => nav("/community/recipe")}
                            onClickItem={(item)=>nav(`/community/recipe/${item.id}`)}
                        />
                        <BoardMini
                            title="정보게시판"
                            items={info}
                            onMore={() => nav("/community/info")}
                            onClickItem={(item)=>nav(`/community/info/${item.id}`)}
                        />
                    </div>
                </section>
            </div>
        </div>
    );
}

/* --- 작은 구성요소들 --- */

function RecipeThumbGrid({ items, onClick }) {
    if (!items?.length) return <div className="empty">데이터가 없어요.</div>;
    return (
        <div className="recipe-grid">
            {items.map(r => (
                <button key={r.id} className="recipe-card" onClick={()=>onClick(r.id)}>
                    <div className="thumb-wrap">
                        <img src={r.thumbnailUrl || r.image || "/noimg.png"} alt={r.name} loading="lazy" decoding="async" referrerPolicy="no-referrer"
                             onError={(e) => {
                                 e.currentTarget.onerror = null;
                                 e.currentTarget.src = "/noimg.png";
                             }}
                                 />
                    </div>
                    <div className="meta">
                        <div className="title" title={r.name}>{r.name}</div>
                        <div className="sub">
                            <span>❤ {r.likes ?? r.likeCount ?? 0}</span>
                            <span>· 👀 {r.views ?? r.viewCount ?? 0}</span>
                        </div>
                    </div>
                </button>
            ))}
        </div>
    );
}

function MiniBoardList({ items, onClick }) {
    if (!items?.length) return <div className="empty">게시글이 없어요.</div>;
    return (
        <ul className="mini-list">
            {items.map(p => (
                <li key={p.id}>
                    <button className="row" onClick={()=>onClick(p)}>
                        <span className="title" title={p.title}>{p.title}</span>
                        <span className="when">{p.createdAt?.slice(5,10) || ""}</span>
                    </button>
                </li>
            ))}
        </ul>
    );
}

function BoardMini({ title, items, onMore, onClickItem }) {
    return (
        <div className="board-mini">
            <div className="board-head">
                <h4>{title}</h4>
                <button className="link" onClick={onMore}>더 보기</button>
            </div>
            <MiniBoardList items={items} onClick={onClickItem} />
        </div>
    );
}
