package com.project.todaywhateat.dto.admin.notice;

import com.project.todaywhateat.domain.Community.Post;
import java.time.LocalDateTime;

public record NoticeAdminDto(
        Long id,
        String title,
        boolean pinned,
        LocalDateTime createdAt
) {
    public static NoticeAdminDto from(Post p) {
        return new NoticeAdminDto(
                p.getId(),
                p.getTitle(),
                p.isPinned(),
                p.getCreatedAt()
        );
    }
}
