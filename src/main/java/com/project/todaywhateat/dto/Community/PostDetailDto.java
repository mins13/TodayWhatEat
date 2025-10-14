package com.project.todaywhateat.dto.Community;

public record PostDetailDto(
        Long id,
        String title,
        String content,
        String authorName,
        long likesCount,
        long viewsCount,
        Boolean liked,   // 로그인 사용자가 좋아요 눌렀는지 (비로그인: null)
        Boolean mine     // 로그인 사용자가 작성자/관리자인지
) {
    // 기본: liked, mine 모두 모르면 null로
    public static PostDetailDto from(com.project.todaywhateat.domain.Community.Post p) {
        return from(p, null, null);
    }

    // liked만 아는 경우
    public static PostDetailDto from(com.project.todaywhateat.domain.Community.Post p, Boolean liked) {
        return from(p, liked, null);
    }

    // ✅ liked, mine 모두 전달
    public static PostDetailDto from(com.project.todaywhateat.domain.Community.Post p, Boolean liked, Boolean mine) {
        return new PostDetailDto(
                p.getId(),
                p.getTitle(),
                p.getContent(),
                p.getAuthorName(),
                p.getLikesCount(),
                p.getViewsCount(),
                liked,
                mine
        );
    }
}
