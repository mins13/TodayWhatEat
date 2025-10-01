package com.project.todaywhateat.dto.Community;

public record PostDetailDto(
        Long id,
        String title,
        String content,
        String authorName,
        long likesCount,
        long viewsCount,
        Boolean liked    // ← 로그인 사용자의 좋아요 여부 (로그아웃이면 null)
) {
    public static PostDetailDto from(com.project.todaywhateat.domain.Community.Post p) {
        return from(p, null);
    }
    public static PostDetailDto from(com.project.todaywhateat.domain.Community.Post p, Boolean liked) {
        return new PostDetailDto(
                p.getId(),
                p.getTitle(),
                p.getContent(),
                p.getAuthorName(),
                p.getLikesCount(),
                p.getViewsCount(),
                liked
        );
    }
}