package com.project.todaywhateat.dto.admin;

import com.project.todaywhateat.domain.Community.Post;

import java.time.LocalDateTime;

public record AdminPostDto(
        Long id, String boardCode, String title, String authorName,
        long likesCount, long viewsCount, LocalDateTime createdAt) {
    public static AdminPostDto from(Post p) {
        return new AdminPostDto(p.getId(), p.getBoard().getCode(), p.getTitle(),
                p.getAuthorName(), p.getLikesCount(), p.getViewsCount(), p.getCreatedAt());
    }
}