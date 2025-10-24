package com.project.todaywhateat.service.view;

import com.project.todaywhateat.domain.FridgeIngredient;
import com.project.todaywhateat.domain.Recipe;
import com.project.todaywhateat.domain.RecipeStep;
import com.project.todaywhateat.domain.RecipeTag;
import com.project.todaywhateat.dto.RecipeDto;
import com.project.todaywhateat.dto.response.RecipeListResponseDto;
import com.project.todaywhateat.repository.FridgeIngredientRepository;
import com.project.todaywhateat.repository.RecipeRepository;
import com.project.todaywhateat.repository.RecipeStepRepository;
import com.project.todaywhateat.repository.RecipeTagRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.concurrent.ThreadLocalRandom;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RecipeViewService {

    private final RecipeRepository recipeRepository;
    private final FridgeIngredientRepository fridgeIngredientRepository;
    private final RecipeStepRepository recipeStepRepository; // 현재 미사용
    private final RecipeTagRepository recipeTagRepository;   // 현재 미사용

    /** 관리자/디버그용: 모든 레시피를 태그/재료까지 포함해서 조회 */
    public List<RecipeListResponseDto> getAllRecipes() {
        return recipeRepository.findAllWithTagsAndIngredients().stream()
                .map(RecipeListResponseDto::fromEntity)
                .collect(Collectors.toList());
    }

    /** 내 냉장고 재료로 필터링 */
    public List<RecipeListResponseDto> getFilteredRecipesByFridge(String userId, int minCount) {
        List<FridgeIngredient> fridge = fridgeIngredientRepository.findByUserId(userId);
        Set<String> myIngredients = fridge.stream()
                .map(i -> i.getIngredientName().trim())
                .collect(Collectors.toSet());

        return recipeRepository.findAllWithTagsAndIngredients().stream()
                .filter(recipe -> {
                    long matchCount = recipe.getIngredients().stream()
                            .map(i -> i.getName().trim())
                            .filter(myIngredients::contains)
                            .count();
                    return matchCount >= minCount;
                })
                .map(RecipeListResponseDto::fromEntity)
                .collect(Collectors.toList());
    }

    /** 리스트용 간단 조회 */
    public RecipeListResponseDto getRecipeById(Long id) {
        Recipe recipe = recipeRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("레시피가 존재하지 않습니다."));
        return RecipeListResponseDto.fromEntity(recipe);
    }

    /** 상세 화면 DTO */
    public RecipeDto getRecipeDetail(Long id) {
        Recipe r = recipeRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("레시피가 없습니다: " + id));

        RecipeDto dto = new RecipeDto();
        dto.setId(r.getId());
        dto.setTitle(r.getTitle());
        dto.setImage(r.getImage());
        dto.setViewCount(r.getViewCount());
        dto.setLikesCount(r.getLikesCount());

        dto.setIngredients(
                r.getIngredients().stream()
                        .map(ing -> {
                            RecipeDto.IngredientDto di = new RecipeDto.IngredientDto();
                            di.setName(ing.getName());
                            di.setAmount(ing.getAmount());
                            return di;
                        })
                        .toList()
        );

        dto.setSteps(
                r.getSteps().stream()
                        .sorted(Comparator.comparingInt(RecipeStep::getStepOrder))
                        .map(RecipeStep::getDescription)
                        .toList()
        );

        dto.setTags(
                r.getTags().stream()
                        .map(RecipeTag::getName)
                        .toList()
        );

        return dto;
    }

    /** 태그 유사도 기반 추천 (레포지토리 페이징 쿼리 + 인기순 폴백) */
    public List<RecipeListResponseDto> getRecommendationsByTags(Long id, int limit) {
        var base = recipeRepository.findByIdWithTags(id)
                .orElseThrow(() -> new IllegalArgumentException("레시피가 존재하지 않습니다."));

        // 태그 셋 (null-safe)
        Set<String> names = Optional.ofNullable(base.getTags())
                .orElseGet(java.util.Collections::emptySet)
                .stream()
                .filter(Objects::nonNull)
                .map(RecipeTag::getName)
                .filter(s -> s != null && !s.isBlank())
                .collect(Collectors.toSet());

        List<Recipe> candidates = List.of();

        if (!names.isEmpty()) {
            int fetchSize = Math.max(limit * 4, 20);   // 적당히 넉넉히 가져온 뒤
            var pageable = PageRequest.of(0, fetchSize);
            candidates = recipeRepository.findSimilarByTags(id, names, pageable).getContent();
        }

        // 폴백: 유사 태그 결과가 없거나 태그가 없는 레시피면 인기순 기반으로 채움
        if (candidates == null || candidates.isEmpty()) {
            List<Recipe> popular = recipeRepository.findAllOrderByPopularity();
            candidates = popular.stream()
                    .filter(r -> !Objects.equals(r.getId(), id))
                    .limit(Math.max(limit * 3, 15))
                    .collect(Collectors.toList());
            Collections.shuffle(candidates, ThreadLocalRandom.current());
        }

        return candidates.stream()
                .filter(r -> !Objects.equals(r.getId(), id))
                .limit(limit)
                .map(RecipeListResponseDto::fromEntity)
                .toList();
    }
}
