package com.project.todaywhateat.service;

import com.project.todaywhateat.domain.Recipe;
import com.project.todaywhateat.domain.RecipeIngredient;
import com.project.todaywhateat.domain.RecipeStep;
import com.project.todaywhateat.domain.RecipeTag;
import com.project.todaywhateat.domain.draft.DraftIngredient;
import com.project.todaywhateat.domain.draft.DraftRecipe;
import com.project.todaywhateat.domain.draft.DraftStatus;
import com.project.todaywhateat.domain.draft.DraftStep;
import com.project.todaywhateat.dto.draft.DraftRecipeRes;
import com.project.todaywhateat.dto.draft.DraftRecipeUpsertReq;
import com.project.todaywhateat.repository.*;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class DraftRecipeService {
    private final DraftRecipeRepository repo;
    private final RecipeRepository recipeRepo; // 기존
    private final RecipeIngredientRepository recipeIngRepo; // 기존
    private final RecipeStepRepository recipeStepRepo; // 기존
    private final RecipeTagRepository recipeTagRepo; // 기존

    @Transactional
    public DraftRecipeRes createOrUpdate(String authorUserId, Long id, DraftRecipeUpsertReq req) {
        DraftRecipe d = (id == null)
                ? new DraftRecipe()
                : repo.findById(id).orElseThrow(() -> new IllegalArgumentException("초안 없음: " + id));

        if (id != null && d.getStatus() == DraftStatus.PENDING) {
            throw new IllegalStateException("승인 대기 중에는 수정할 수 없습니다.");
        }
        if (d.getAuthorUserId() != null && !d.getAuthorUserId().equals(authorUserId)) {
            throw new AccessDeniedException("내 초안만 수정 가능");
        }

        d.setAuthorUserId(authorUserId);
        d.setTitle(req.title());
        d.setDescription(req.description());
        d.setImageUrl(req.imageUrl());
        d.setTags(String.join(",", Optional.ofNullable(req.tags()).orElse(List.of())));
        d.getIngredients().clear();
        d.getSteps().clear();

        if (req.ingredients()!=null) {
            for (var i : req.ingredients()) {
                DraftIngredient di = new DraftIngredient();
                di.setName(i.name());
                di.setQuantity(i.quantity());
                di.setUnit(i.unit());
                di.setSortOrder(i.sortOrder()==null?0:i.sortOrder());
                di.setDraft(d);
                d.getIngredients().add(di);
            }
        }
        if (req.steps()!=null) {
            for (var s : req.steps()) {
                DraftStep ds = new DraftStep();
                ds.setStepOrder(s.stepOrder()==null?0:s.stepOrder());
                ds.setContent(s.content());
                ds.setDraft(d);
                d.getSteps().add(ds);
            }
        }
        d.setChildrenOwner();
        DraftRecipe saved = repo.save(d);
        return toRes(saved);
    }

    @Transactional
    public DraftRecipeRes submit(Long id, String authorUserId) {
        DraftRecipe d = repo.findById(id).orElseThrow();
        if (!d.getAuthorUserId().equals(authorUserId)) throw new AccessDeniedException("내 초안만 제출 가능");
        if (d.getStatus() == DraftStatus.PENDING) return toRes(d);
        d.setStatus(DraftStatus.PENDING);
        d.setRejectionReason(null);
        return toRes(d);
    }

    @Transactional(readOnly = true)
    public Page<DraftRecipeRes> myDrafts(String uid, Pageable pg) {
        return repo.findByAuthorUserIdOrderByUpdatedAtDesc(uid, pg).map(this::toRes);
    }

    @Transactional(readOnly = true)
    public Page<DraftRecipeRes> listPending(Pageable pg) {
        return repo.findByStatusOrderByCreatedAtAsc(DraftStatus.PENDING, pg).map(this::toRes);
    }

    // 관리자: 승인
    @Transactional
    public DraftRecipeRes approve(Long draftId) {
        DraftRecipe d = repo.findById(draftId).orElseThrow();

        // 1) 실제 Recipe 생성
        Recipe r = new Recipe();
        r.setTitle(d.getTitle());
        // Draft에선 imageUrl, Recipe에선 image
        r.setImage(d.getImageUrl());   // ★ setImageUrl() 아님!
        Recipe saved = recipeRepo.save(r);

        // 2) 태그 (RecipeTag.name)
        List<String> tags = parseTags(d.getTags());
        for (String t : tags) {
            RecipeTag tag = new RecipeTag();
            tag.setRecipe(saved);
            tag.setName(t.trim());     // ★ setTag() 아님!
            recipeTagRepo.save(tag);
        }

        // 3) 재료 (최소 필드만: name)
        for (DraftIngredient di : d.getIngredients()) {
            RecipeIngredient ri = new RecipeIngredient();
            ri.setRecipe(saved);
            ri.setName(di.getName());
            // 아래는 네 엔티티에 실제로 있으면 나중에 추가
            // ri.setQuantity(di.getQuantity()); // (예: amount)
            // ri.setUnit(di.getUnit());
            // ri.setSortOrder(di.getSortOrder()); // 없으면 생략
            recipeIngRepo.save(ri);
        }

        // 4) 단계 (최소 필드만: stepOrder)
        for (DraftStep ds : d.getSteps()) {
            RecipeStep rs = new RecipeStep();
            rs.setRecipe(saved);
            rs.setStepOrder(ds.getStepOrder());
            // rs.setContent(ds.getContent()); // (예: description/text 등 실제 필드명 확인 후 추가)
            recipeStepRepo.save(rs);
        }

        // 5) 상태 업데이트
        d.setStatus(DraftStatus.APPROVED);
        d.setPublishedRecipeId(saved.getId());
        d.setRejectionReason(null);
        return toRes(d);
    }


    // 관리자: 반려
    @Transactional
    public DraftRecipeRes reject(Long draftId, String reason) {
        DraftRecipe d = repo.findById(draftId).orElseThrow();
        d.setStatus(DraftStatus.REJECTED);
        d.setRejectionReason(reason);
        d.setPublishedRecipeId(null);
        return toRes(d);
    }

    private List<String> parseTags(String tags) {
        if (tags==null || tags.isBlank()) return List.of();
        return Arrays.stream(tags.split(",")).map(String::trim).filter(s->!s.isBlank()).toList();
    }

    private DraftRecipeRes toRes(DraftRecipe d) {
        var ing = d.getIngredients().stream()
                .map(x -> new DraftRecipeRes.IngredientRes(x.getId(), x.getName(), x.getQuantity(), x.getUnit(), x.getSortOrder()))
                .toList();
        var st = d.getSteps().stream()
                .map(x -> new DraftRecipeRes.StepRes(x.getId(), x.getStepOrder(), x.getContent()))
                .toList();
        return new DraftRecipeRes(
                d.getId(), d.getTitle(), d.getDescription(), d.getImageUrl(),
                parseTags(d.getTags()), d.getStatus(), d.getRejectionReason(),
                d.getPublishedRecipeId(), ing, st, d.getCreatedAt(), d.getUpdatedAt()
        );
    }
}
