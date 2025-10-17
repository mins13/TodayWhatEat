package com.project.todaywhateat.controller;

import com.project.todaywhateat.domain.Recipe;
import com.project.todaywhateat.domain.RecipeIngredient;
import com.project.todaywhateat.domain.RecipeStep;
import com.project.todaywhateat.domain.RecipeTag;
import com.project.todaywhateat.dto.Community.PageResponse;
import com.project.todaywhateat.dto.admin.*;
import com.project.todaywhateat.repository.RecipeIngredientRepository;
import com.project.todaywhateat.repository.RecipeRepository;
import com.project.todaywhateat.repository.RecipeStepRepository;
import com.project.todaywhateat.repository.RecipeTagRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin/recipes")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminRecipeMgmtController {

    private final RecipeRepository recipeRepo;
    private final RecipeStepRepository stepRepo;
    private final RecipeIngredientRepository ingRepo;
    private final RecipeTagRepository tagRepo;

    /** 목록 */
    @GetMapping
    public PageResponse<RecipeLiteAdminDto> list(@RequestParam(defaultValue = "0") int page,
                                                 @RequestParam(defaultValue = "10") int size,
                                                 @RequestParam(defaultValue = "") String query) {
        Pageable p = PageRequest.of(Math.max(0, page), size, Sort.by("id").descending());
        Page<Recipe> pg = query == null || query.isBlank()
                ? recipeRepo.findAll(p)
                : recipeRepo.findAll(Example.of(
                Recipe.builder().title(query).build(),
                ExampleMatcher.matching()
                        .withIgnorePaths("likesCount", "viewCount")
                        .withMatcher("title", ExampleMatcher.GenericPropertyMatchers.contains().ignoreCase())
        ), p);

        return new PageResponse<>(
                pg.map(RecipeLiteAdminDto::from).getContent(),
                pg.getTotalElements()
        );
    }

    /** 단건 상세 (단계 포함) */
    @GetMapping("/{id}")
    public RecipeDetailAdminDto detail(@PathVariable Long id) {
        Recipe r = recipeRepo.findById(id).orElseThrow();
        List<RecipeStep> steps = stepRepo.findByRecipeIdOrderByStep(r.getId());
        return RecipeDetailAdminDto.from(r, steps);
    }

    /** 생성: 제목/이미지 + 단계 + 재료까지 함께 저장 */
    @PostMapping
    @Transactional
    public RecipeIdDto create(@RequestBody RecipeUpsertAdminDto dto) {
        Recipe r = new Recipe();
        r.setTitle(dto.title());
        r.setImage(dto.image());
        r.setLikesCount(0);
        r.setViewCount(0);
        r = recipeRepo.save(r);

        // steps
        List<RecipeStep> ss = new ArrayList<>();
        List<String> steps = dto.steps() == null ? List.of() : dto.steps();
        for (int i = 0; i < steps.size(); i++) {
            RecipeStep s = new RecipeStep();
            s.setRecipe(r);
            s.setStepOrder(i + 1);
            s.setDescription(steps.get(i));
            ss.add(s);
        }
        stepRepo.saveAll(ss);

        // ingredients
        List<RecipeIngredient> ings = new ArrayList<>();
        if (dto.ingredients() != null) {
            for (var g : dto.ingredients()) {
                if (g.name() == null || g.name().isBlank()) continue;
                RecipeIngredient ig = new RecipeIngredient();
                ig.setRecipe(r);
                ig.setName(g.name());
                ig.setAmount(g.amount());
                ings.add(ig);
            }
            ingRepo.saveAll(ings);
        }
        return new RecipeIdDto(r.getId());
    }

    /** 수정: 제목/이미지 + 단계 전체 갈아끼우기 (재료는 별도 API로 편집) */
    @PutMapping("/{id}")
    @Transactional
    public void update(@PathVariable Long id, @RequestBody RecipeUpsertAdminDto dto) {
        Recipe r = recipeRepo.findById(id).orElseThrow();
        r.setTitle(dto.title());
        r.setImage(dto.image());
        recipeRepo.save(r);

        if (dto.steps() != null) {
            // 단계 리셋 후 재삽입
            List<RecipeStep> olds = stepRepo.findByRecipeIdOrderByStep(id);
            stepRepo.deleteAll(olds);

            List<RecipeStep> news = new ArrayList<>();
            for (int i = 0; i < dto.steps().size(); i++) {
                String text = dto.steps().get(i);
                if (text == null || text.isBlank()) continue;
                RecipeStep s = new RecipeStep();
                s.setRecipe(r);
                s.setStepOrder(i + 1);
                s.setDescription(text);
                news.add(s);
            }
            stepRepo.saveAll(news);
        }
    }

    /** 삭제 */
    @DeleteMapping("/{id}")
    @Transactional
    public void delete(@PathVariable Long id) {
        // 자식은 orphanRemoval 로 자동삭제되지만, 명시적으로 지워도 OK
        stepRepo.deleteAll(stepRepo.findByRecipeIdOrderByStep(id));
        ingRepo.deleteAll(ingRepo.findByRecipe_IdOrderByIdAsc(id));
        recipeRepo.deleteById(id);
    }

    // 재료 조회
    @GetMapping("/{id}/ingredients")
    public List<IngredientAdminDto> ingredients(@PathVariable Long id) {
        return ingRepo.findByRecipe_IdOrderByIdAsc(id).stream()
                .map(IngredientAdminDto::from)
                .toList();
    }

    // 재료 저장(upsert + 삭제 동기화)
    @PutMapping("/{id}/ingredients")
    @Transactional
    public void saveIngredients(@PathVariable Long id, @RequestBody List<IngredientAdminDto> body) {
        var recipe = recipeRepo.findById(id).orElseThrow();

        Map<Long, RecipeIngredient> exists = ingRepo.findByRecipe_IdOrderByIdAsc(id).stream()
                .collect(Collectors.toMap(RecipeIngredient::getId, x -> x));

        Set<Long> seen = new HashSet<>();
        List<RecipeIngredient> toSave = new ArrayList<>();

        for (var d : body) {
            String name = d.name() == null ? "" : d.name().trim();
            String amt  = d.amount() == null ? "" : d.amount().trim();
            if (d.id() != null && exists.containsKey(d.id())) {
                var x = exists.get(d.id());
                x.setName(name);
                x.setAmount(amt);
                seen.add(x.getId());
                toSave.add(x);
            } else if (!name.isBlank()) {
                toSave.add(RecipeIngredient.builder()
                        .recipe(recipe)
                        .name(name)
                        .amount(amt)
                        .build());
            }
        }
        if (!toSave.isEmpty()) ingRepo.saveAll(toSave);

        // 요청에 더 이상 없는 기존 재료 삭제
        List<Long> toDelete = exists.keySet().stream()
                .filter(k -> !seen.contains(k) && body.stream().noneMatch(b -> k.equals(b.id())))
                .toList();
        if (!toDelete.isEmpty()) ingRepo.deleteAllById(toDelete);
    }

    // 태그 조회
    @GetMapping("/{id}/tags")
    public List<String> tags(@PathVariable Long id) {
        return tagRepo.findByRecipeId(id).stream()
                .map(RecipeTag::getName)
                .toList();
    }

    // 태그 저장(전체 갈아끼움)
    @PutMapping("/{id}/tags")
    @Transactional
    public void saveTags(@PathVariable Long id, @RequestBody List<String> names) {
        var recipe = recipeRepo.findById(id).orElseThrow();
        tagRepo.deleteAll(tagRepo.findByRecipeId(id));
        if (names != null && !names.isEmpty()) {
            var toSave = names.stream()
                    .filter(s -> s != null && !s.isBlank())
                    .map(s -> RecipeTag.builder().recipe(recipe).name(s.trim()).build())
                    .toList();
            if (!toSave.isEmpty()) tagRepo.saveAll(toSave);
        }
    }
}