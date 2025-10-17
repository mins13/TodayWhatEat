package com.project.todaywhateat.dto.admin.notice;

import com.project.todaywhateat.domain.Community.Post;

public record NoticeDetailDto(
        Long id,
        String title,
        String content,
        Boolean pinned,
        String createdAt
) {
    public static NoticeDetailDto from(Post p) {
        return new NoticeDetailDto(
                p.getId(),
                p.getTitle(),
                p.getContent(),
                p.isPinned(),
                p.getCreatedAt() == null ? null : p.getCreatedAt().toString()
        );
    }
}