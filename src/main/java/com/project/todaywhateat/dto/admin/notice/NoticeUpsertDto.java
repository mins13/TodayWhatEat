package com.project.todaywhateat.dto.admin.notice;

public record NoticeUpsertDto(
        String title,
        String content,
        Boolean pinned
) {}
