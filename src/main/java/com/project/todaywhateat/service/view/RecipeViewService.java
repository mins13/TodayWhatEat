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
    private final RecipeStepRepository recipeStepRepository;
    private final RecipeTagRepository recipeTagRepository;

    public List<RecipeListResponseDto> getAllRecipes() {
        return recipeRepository.findAllWithTagsAndIngredients().stream()
                .map(RecipeListResponseDto::fromEntity)
                .collect(Collectors.toList());
    }

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

    public RecipeListResponseDto getRecipeById(Long id) {
        Recipe recipe = recipeRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("레시피가 존재하지 않습니다."));
        return RecipeListResponseDto.fromEntity(recipe);
    }

    public RecipeDto getRecipeDetail(Long id) {
        // 필요하면 findByIdWithIngredients(id)로 바꿔도 됨. (open-in-view가 켜져 있으니 단순 findById도 동작)
        Recipe r = recipeRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("레시피가 없습니다: " + id));

        RecipeDto dto = new RecipeDto();
        dto.setId(r.getId());
        dto.setTitle(r.getTitle());
        dto.setImage(r.getImage());

        // ✅ 여기 중요: 카운트 채우기
        dto.setViewCount(r.getViewCount());
        dto.setLikesCount(r.getLikesCount());

        // 재료
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

        // 단계(정렬 보장)
        dto.setSteps(
                r.getSteps().stream()
                        .sorted(Comparator.comparingInt(RecipeStep::getStepOrder))
                        .map(RecipeStep::getDescription)
                        .toList()
        );

        // 태그
        dto.setTags(
                r.getTags().stream()
                        .map(t -> t.getName())
                        .toList()
        );

        return dto;
    }

    public List<RecipeListResponseDto> getRecommendedByTags(Long id, int limit) {
        Recipe target = recipeRepository.findByIdWithTags(id)
                .orElseThrow(() -> new IllegalArgumentException("레시피가 존재하지 않습니다."));

        Set<String> targetTags = target.getTags() == null ? Set.of() :
                target.getTags().stream()
                        .filter(Objects::nonNull)
                        .map(RecipeTag::getName)
                        .filter(Objects::nonNull)
                        .map(String::trim)
                        .filter(s -> !s.isEmpty())
                        .collect(Collectors.toSet());

        // 후보 전부 로딩(태그/재료 미리 포함)
        List<Recipe> candidates = recipeRepository.findAllWithTagsAndIngredients();

        // 자기 자신 제외 + 점수 계산
        List<Recipe> scored = candidates.stream()
                .filter(r -> !r.getId().equals(id))
                .peek(r -> { /* no-op */ })
                .sorted((a, b) -> {
                    long sa = overlap(a, targetTags);
                    long sb = overlap(b, targetTags);
                    if (sa != sb) return Long.compare(sb, sa); // 태그 교집합 큰 순
                    // 보조 정렬(선택): 제목 가나다
                    return a.getTitle().compareToIgnoreCase(b.getTitle());
                })
                .collect(Collectors.toList());

        // 태그가 하나도 안 겹치면 랜덤 3개(폴백)
        List<Recipe> top = scored.stream()
                .filter(r -> overlap(r, targetTags) > 0)
                .limit(limit)
                .collect(Collectors.toList());

        if (top.isEmpty()) {
            Collections.shuffle(scored);
            top = scored.stream().limit(limit).collect(Collectors.toList());
        }

        return top.stream()
                .map(RecipeListResponseDto::fromEntity)
                .collect(Collectors.toList());
    }

    private long overlap(Recipe r, Set<String> targetTags) {
        if (targetTags.isEmpty() || r.getTags() == null) return 0;
        return r.getTags().stream()
                .filter(Objects::nonNull)
                .map(RecipeTag::getName)
                .filter(Objects::nonNull)
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .filter(targetTags::contains)
                .count();
    }

    public List<RecipeListResponseDto> getRecommendationsByTags(Long id, int limit) {
        Recipe base = recipeRepository.findByIdWithTags(id)
                .orElseThrow(() -> new IllegalArgumentException("레시피가 존재하지 않습니다."));

        Set<String> names = base.getTags().stream()
                .filter(Objects::nonNull)
                .map(RecipeTag::getName)
                .filter(s -> s != null && !s.isBlank())
                .collect(Collectors.toSet());

        if (names.isEmpty()) return List.of();

        // 후보를 넉넉하게 가져와서
        int fetchSize = Math.max(limit * 4, 20);                // 예: limit=3 -> 20개
        var page = PageRequest.of(0, fetchSize);
        List<Recipe> candidates = recipeRepository.findSimilarByTags(id, names, page);

        // 랜덤 셔플 후 상위 limit 추출
        Collections.shuffle(candidates, ThreadLocalRandom.current());
        return candidates.stream()
                .limit(limit)
                .map(RecipeListResponseDto::fromEntity)
                .collect(Collectors.toList());
    }






}
