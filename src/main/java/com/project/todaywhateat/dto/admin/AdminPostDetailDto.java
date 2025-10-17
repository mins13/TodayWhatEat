package com.project.todaywhateat.dto.admin;

import com.project.todaywhateat.domain.Community.Post;

public record AdminPostDetailDto(
        Long id,
        String boardCode,
        String title,
        String content,
        String authorName,
        long likesCount,
        long viewsCount
) {
    public static AdminPostDetailDto from(Post p) {
        return new AdminPostDetailDto(
                p.getId(),
                p.getBoard().getCode(),
                p.getTitle(),
                p.getContent(),
                p.getAuthorName(),
                p.getLikesCount(),
                p.getViewsCount()
        );
    }
}
