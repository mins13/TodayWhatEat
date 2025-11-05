// src/api/homeApi.js
import { openHttp } from "./http";

/* ---------- 공통 유틸 ---------- */
function toList(data) {
    if (!data) return [];
    if (Array.isArray(data.items))   return data.items;
    if (Array.isArray(data.content)) return data.content;
    if (Array.isArray(data))         return data;
    return [];
}

const BOARD_MAP = { free: "free", recipe: "recipe", info: "info", notice: "notice" };
const normalizeBoard = (board) => BOARD_MAP[board] || String(board || "").toLowerCase();

/* ---------- 매핑 ---------- */
const mapRecipe = (r) => ({
    id: r?.id,
    name: r?.title || r?.name || "",
    thumbnailUrl: r?.image || r?.thumbnailUrl || r?.imageUrl || "/noimg.png",
    likes: r?.likesCount ?? r?.likeCount ?? r?.likes ?? 0,
    views: r?.viewCount ?? r?.views ?? 0,
});

const mapPost = (p, board) => ({
    id: p?.id,
    title: p?.title || "",
    likes: p?.likes ?? p?.likeCount ?? p?.likesCount ?? 0,
    views: p?.views ?? p?.viewCount ?? p?.viewsCount ?? 0,
    createdAt: p?.createdAt || p?.created_date || p?.createdDate,
    board,
});

/* ---------- 인기 레시피 ---------- */
export async function fetchRecipesSorted(sort = "popular", page = 1, size = 8) {
    try {
        const { data } = await openHttp.get("/api/recipes", {
            params: { sort, page, size },
        });
        return toList(data).map(mapRecipe).slice(0, size);
    } catch (e) {
        console.warn("fetchRecipesSorted failed:", e);
        return [];
    }
}

/* ---------- 게시판 미니 리스트 ---------- */
export async function fetchBoardList(
    board,
    { size = 6, sort = "latest", page = 1 } = {}
) {
    try {
        const code = normalizeBoard(board);
        const pg = Math.max(0, page - 1); // 0-based
        const { data } = await openHttp.get(`/api/community/${code}`, {
            params: { size, sort, page: pg },
        });
        const list = toList(data).map((p) => mapPost(p, board));
        return list.slice(0, size);
    } catch (e) {
        console.warn("fetchBoardList failed:", board, e);
        return [];
    }
}

/* ---------- HOT 게시물(폴백) ---------- */
export async function fetchHotPosts(size = 6) {
    try {
        const boards = ["free", "recipe", "info"];
        const results = await Promise.allSettled(
            boards.map((b) =>
                openHttp.get(`/api/community/${normalizeBoard(b)}`, {
                    params: { size: 20, sort: "latest", page: 0 },
                })
            )
        );

        const merged = [];
        results.forEach((res, idx) => {
            if (res.status === "fulfilled") {
                const arr = toList(res.value.data).map((p) => mapPost(p, boards[idx]));
                merged.push(...arr);
            }
        });

        if (!merged.length) return [];

        const now = Date.now();
        const scored = merged.map((p) => {
            const t = p.createdAt ? new Date(p.createdAt).getTime() : now;
            const days = Math.max(1, (now - t) / (1000 * 60 * 60 * 24));
            const recencyBonus = 5 / Math.sqrt(days);
            const score = (p.likes || 0) * 1 + (p.views || 0) * 0.2 + recencyBonus;
            return { ...p, score };
        });

        scored.sort((a, b) => b.score - a.score);
        return scored.slice(0, size);
    } catch (e) {
        console.warn("fetchHotPosts failed:", e);
        return [];
    }
}
