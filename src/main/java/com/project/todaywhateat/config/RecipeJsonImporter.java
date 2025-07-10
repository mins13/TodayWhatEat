package com.project.todaywhateat.config;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.project.todaywhateat.dto.RecipeDto;
import com.project.todaywhateat.service.RecipeService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.io.InputStream;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class RecipeJsonImporter {

    private final RecipeService recipeService;
    private final ObjectMapper objectMapper;

    //@PostConstruct
    public void importRecipesFromJson() {
        List<RecipeDto> recipes = null;

        try {
            // ✅ 경로 수정: /recipes.json (resources 폴더 기준)
            InputStream inputStream = getClass().getResourceAsStream("/recipes.json");

            if (inputStream == null) {
                log.error("❌ JSON 파일을 찾을 수 없습니다. 경로를 확인하세요.");
                return;
            }

            recipes = objectMapper.readValue(
                    inputStream,
                    new TypeReference<List<RecipeDto>>() {}
            );

            for (RecipeDto recipeDto : recipes) {
                recipeService.saveRecipe(recipeDto);
            }

        } catch (Exception e) {
            log.error("❌ 레시피 JSON 불러오기 실패", e);
            return;
        }

        if (recipes != null) {
            log.info("✅ 총 {}개의 레시피 JSON -> DB 저장 완료!", recipes.size());
        }
    }
}
