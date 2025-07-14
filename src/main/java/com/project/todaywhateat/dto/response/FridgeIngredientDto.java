package com.project.todaywhateat.dto.response;

import com.project.todaywhateat.domain.FridgeIngredient;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;

@Getter
@Builder
public class FridgeIngredientDto {
    private Long id;
    private String ingredientName; // name → ingredientName (엔티티 필드명 기준)
    private String category;
    private String unit;
    private String quantity;
    private LocalDate expirationDate;

    public static FridgeIngredientDto fromEntity(FridgeIngredient ingredient) {
        return FridgeIngredientDto.builder()
                .id(ingredient.getId())
                .ingredientName(ingredient.getIngredientName())
                .category(ingredient.getCategory())
                .unit(ingredient.getUnit())
                .quantity(ingredient.getQuantity())
                .expirationDate(ingredient.getExpirationDate())
                .build();
    }
}