// AdminPostDetailDto.java
package com.project.todaywhateat.dto.admin;

import com.project.todaywhateat.domain.Community.Post;
import com.project.todaywhateat.domain.Community.PostFile;
import com.project.todaywhateat.domain.my.MyRecipe;

import java.util.List;

public record AdminPostDetailDto(
        Long id,
        String boardCode,
        String title,
        String content,
        String authorName,
        long likesCount,
        long viewsCount,
        List<AttachmentDto> attachments,
        AttachedRecipeDto recipe
) {

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
            String imageUrl
    ) {}

    public static AdminPostDetailDto of(Post p,
                                        List<PostFile> files,
                                        MyRecipe recipe) {

        List<AttachmentDto> atts = files.stream()
                .map(f -> new AttachmentDto(
                        f.getId(),
                        f.getUrl(),
                        f.getFilename(),
                        f.getWidth(),
                        f.getHeight()
                ))
                .toList();

        AttachedRecipeDto recipeDto = null;
        if (recipe != null) {
            recipeDto = new AttachedRecipeDto(
                    recipe.getId(),
                    recipe.getTitle(),
                    recipe.getImageUrl()
            );
        }

        return new AdminPostDetailDto(
                p.getId(),
                p.getBoard().getCode(),
                p.getTitle(),
                p.getContent(),
                p.getAuthorName(),
                p.getLikesCount(),
                p.getViewsCount(),
                atts,
                recipeDto
        );
    }
}
