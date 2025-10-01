package com.project.todaywhateat.dto.Community;

import com.project.todaywhateat.domain.Community.Comment;

import java.time.LocalDateTime;

public record CommentDto(Long id, String author, String content, LocalDateTime createdAt){
    public static CommentDto from(Comment c){
        return new CommentDto(c.getId(), c.getAuthorName(), c.getContent(), c.getCreatedAt());
    }
}