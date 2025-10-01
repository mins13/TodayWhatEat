package com.project.todaywhateat.dto.Community;

import com.project.todaywhateat.domain.Community.Post;

import java.time.LocalDateTime;

public record PostListDto(
        Long id, String title, String author, int likes, int views, LocalDateTime createdAt
) {
    public static PostListDto from(Post p){
        return new PostListDto(p.getId(), p.getTitle(), p.getAuthorName(), p.getLikesCount(), p.getViewsCount(), p.getCreatedAt());
    }
}