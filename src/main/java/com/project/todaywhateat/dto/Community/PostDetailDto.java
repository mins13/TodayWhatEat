// src/main/java/com/project/todaywhateat/dto/Community/PostDetailDto.java
package com.project.todaywhateat.dto.Community;

import java.util.List;

public record PostDetailDto(
        Long id,
        String title,
        String content,
        String authorName,
        long likesCount,
        long viewsCount,
        Boolean liked,              // 로그인 사용자가 좋아요 눌렀는지 (비로그인: null)
        Boolean mine,               // 로그인 사용자가 작성자/관리자인지
        List<AttachmentDto> attachments,     // ★ 첨부 이미지
        AttachedRecipeDto attachedRecipe     // ★ 첨부 레시피(옵션)
) {

    /* ---------------- 기본/기존 오버로드 (하위호환 유지) ---------------- */

    // 기본: liked, mine 모두 모르면 null로 (첨부는 빈 리스트, 레시피 null)
    public static PostDetailDto from(com.project.todaywhateat.domain.Community.Post p) {
        return from(p, null, null, List.of(), null);
    }

    // liked만 아는 경우
    public static PostDetailDto from(com.project.todaywhateat.domain.Community.Post p, Boolean liked) {
        return from(p, liked, null, List.of(), null);
    }

    // liked, mine만 아는 경우
    public static PostDetailDto from(com.project.todaywhateat.domain.Community.Post p, Boolean liked, Boolean mine) {
        return from(p, liked, mine, List.of(), null);
    }

    /* ---------------- 신규 오버로드: 첨부/레시피까지 포함 ---------------- */

    public static PostDetailDto from(
            com.project.todaywhateat.domain.Community.Post p,
            Boolean liked,
            Boolean mine,
            List<AttachmentDto> attachments,
            AttachedRecipeDto attachedRecipe
    ) {
        return new PostDetailDto(
                p.getId(),
                p.getTitle(),
                p.getContent(),
                p.getAuthorName(),
                p.getLikesCount(),
                p.getViewsCount(),
                liked,
                mine,
                (attachments == null ? List.of() : attachments),
                attachedRecipe
        );
    }

    /* ---------------- 하위 DTO ---------------- */

    public record AttachmentDto(
            Long id,
            String url,
            String filename,
            Integer width,
            Integer height
    ) {}

    public record AttachedRecipeDto(
            Long id,
            String title,
            String mainImageUrl,
            List<String> tags,
            List<IngredientDto> ingredients,
            List<String> steps
    ) {}

    public record IngredientDto(String name, String amount) {}
}
