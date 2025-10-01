package com.project.todaywhateat.dto.Community;

import com.project.todaywhateat.domain.Community.Comment;

public record CommentDto(
        Long id,
        String authorName,
        String content,
        Boolean mine          // ← 로그인 사용자가 작성한 댓글인가?
) {
    public static CommentDto from(Comment c) {
        return new CommentDto(c.getId(), c.getAuthorName(), c.getContent(), null);
    }
    public static CommentDto from(Comment c, boolean mine) {
        return new CommentDto(c.getId(), c.getAuthorName(), c.getContent(), mine);
    }
}