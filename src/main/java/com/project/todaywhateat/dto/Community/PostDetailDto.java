package com.project.todaywhateat.dto.Community;

import com.project.todaywhateat.domain.Community.Post;

import java.time.LocalDateTime;

public record PostDetailDto(
        Long id, String board, String title, String author, String content,
        int likes, int views, LocalDateTime createdAt, LocalDateTime updatedAt
){
    public static PostDetailDto from(Post p){
        return new PostDetailDto(
                p.getId(), p.getBoard().getCode(), p.getTitle(), p.getAuthorName(), p.getContent(),
                p.getLikesCount(), p.getViewsCount(), p.getCreatedAt(), p.getUpdatedAt()
        );
    }
}
