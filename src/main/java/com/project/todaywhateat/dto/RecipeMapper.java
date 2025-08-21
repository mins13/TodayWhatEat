// RecipeMapper.java
package com.project.todaywhateat.dto;

import com.project.todaywhateat.domain.Recipe;
import com.project.todaywhateat.domain.RecipeIngredient;
import com.project.todaywhateat.domain.RecipeStep;
import com.project.todaywhateat.domain.RecipeTag;

import java.util.*;

public class RecipeMapper {
    public static RecipeDto toDto(Recipe r, List<RecipeStep> steps, List<RecipeTag> tags) {
        RecipeDto dto = new RecipeDto();
        dto.setId(r.getId());
        dto.setTitle(r.getTitle());
        dto.setImage(r.getImage());

        // ✅ name+amount 기준으로 중복 제거 (LinkedHashMap으로 순서 보존)
        Map<String, RecipeDto.IngredientDto> uniq = new LinkedHashMap<>();
        for (var ing : r.getIngredients()) {
            if (ing == null) continue;
            String key = (ing.getName()==null?"":ing.getName().trim()) + "|" + (ing.getAmount()==null?"":ing.getAmount().trim());
            uniq.putIfAbsent(key, toIngredientDto(ing));
        }
        dto.setIngredients(new ArrayList<>(uniq.values()));

        dto.setSteps(
                steps.stream()
                        .filter(Objects::nonNull)
                        .map(RecipeStep::getDescription)
                        .filter(Objects::nonNull)
                        .map(String::trim)
                        .filter(s -> !s.isEmpty())
                        .toList()
        );

        dto.setTags(
                tags==null ? List.of() :
                        tags.stream().filter(Objects::nonNull).map(RecipeTag::getName).distinct().toList()
        );

        return dto;
    }

    private static RecipeDto.IngredientDto toIngredientDto(RecipeIngredient ing) {
        var d = new RecipeDto.IngredientDto();
        d.setName(ing.getName());
        d.setAmount(ing.getAmount());
        return d;
    }
}

