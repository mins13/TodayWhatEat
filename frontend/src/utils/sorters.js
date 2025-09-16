// src/utils/sorters.js
const n = (v) => (typeof v === "number" && !Number.isNaN(v) ? v : Number(v) || 0);

// 안전한 문자열 비교(타이브레이커용)
const s = (v) => (v ?? "").toString();

export const sortByPopular = (a, b) => {
    // 좋아요 내림차순 → 조회수 내림차순 → 제목 오름차순
    if (n(b.likes) !== n(a.likes)) return n(b.likes) - n(a.likes);
    if (n(b.views) !== n(a.views)) return n(b.views) - n(a.views);
    return s(a.title).localeCompare(s(b.title), "ko");
};

export const sortByViews = (a, b) => {
    // 조회수 내림차순 → 좋아요 내림차순 → 제목 오름차순
    if (n(b.views) !== n(a.views)) return n(b.views) - n(a.views);
    if (n(b.likes) !== n(a.likes)) return n(b.likes) - n(a.likes);
    return s(a.title).localeCompare(s(b.title), "ko");
};

export const sortByLatest = (a, b) => {
    // createdAt이 있으면 최신순(내림차순), 없으면 인기순으로 폴백
    const ad = new Date(a.createdAt || 0).getTime();
    const bd = new Date(b.createdAt || 0).getTime();
    if (bd !== ad) return bd - ad;
    return sortByPopular(a, b);
};

export const getSorter = (option) => {
    switch (option) {
        case "popular": return sortByPopular;
        case "views":   return sortByViews;
        case "latest":  return sortByLatest;
        default:        return sortByPopular;
    }
};
