// com.project.todaywhateat.dto.Community.CreatePostReq
package com.project.todaywhateat.dto.Community;

public record CreatePostReq(
        String title,
        String content,
        String authorName,
        Long recipeId   // ✅ 추가
) {}
