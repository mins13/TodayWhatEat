// src/main/java/com/project/todaywhateat/dto/response/RecipeCardDto.java
package com.project.todaywhateat.dto.response;

public record RecipeCardDto(
        Long id,
        String title,
        String image,
        Long likesCount,
        Long viewCount
) {
    /** JPA가 Integer/Long/BigInteger 등으로 넘겨도 안전하게 받도록 브리지 생성자 제공 */
    public RecipeCardDto(Long id, String title, String image, Number likesCount, Number viewCount) {
        this(
                id,
                title,
                image,
                likesCount == null ? 0L : likesCount.longValue(),
                viewCount == null ? 0L : viewCount.longValue()
        );
    }
}
