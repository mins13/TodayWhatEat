// src/main/java/com/project/todaywhateat/service/DraftRecipeService.java
package com.project.todaywhateat.service;

import com.project.todaywhateat.domain.Recipe;
import com.project.todaywhateat.domain.RecipeIngredient;
import com.project.todaywhateat.domain.RecipeStep;
import com.project.todaywhateat.domain.RecipeTag;
import com.project.todaywhateat.domain.draft.DraftIngredient;
import com.project.todaywhateat.domain.draft.DraftRecipe;
import com.project.todaywhateat.domain.draft.DraftStatus;
import com.project.todaywhateat.domain.draft.DraftStep;
import com.project.todaywhateat.domain.my.MyRecipe;
import com.project.todaywhateat.domain.my.MyRecipeIngredient;
import com.project.todaywhateat.domain.my.MyRecipeStep;
import com.project.todaywhateat.dto.draft.ApprovalStatusRes;
import com.project.todaywhateat.dto.draft.DraftRecipeRes;
import com.project.todaywhateat.dto.draft.DraftRecipeUpsertReq;
import com.project.todaywhateat.repository.*;
import com.project.todaywhateat.repository.my.MyRecipeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.lang.reflect.Method;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class DraftRecipeService {

    private final DraftRecipeRepository repo;

    // 공개 레시피
    private final RecipeRepository recipeRepo;
    private final RecipeIngredientRepository recipeIngRepo;
    private final RecipeStepRepository recipeStepRepo;
    private final RecipeTagRepository recipeTagRepo;

    // 나만의 레시피
    private final MyRecipeRepository myRecipeRepo;

    /* =========================
       공통 유틸
       ========================= */
    private DraftRecipe getOr404(Long id) {
        return repo.findById(id).orElseThrow(
                () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "초안 없음: " + id)
        );
    }

    private List<String> parseTags(String tags) {
        if (tags == null || tags.isBlank()) return List.of();
        return Arrays.stream(tags.split(","))
                .map(String::trim)
                .filter(s -> !s.isBlank())
                .toList();
    }

    private DraftRecipeRes toRes(DraftRecipe d) {
        var ing = d.getIngredients().stream()
                .map(x -> new DraftRecipeRes.IngredientRes(
                        x.getId(), x.getName(), x.getQuantity(), x.getUnit(), x.getSortOrder()))
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

    // 사용자 식별 문자열 뽑기 (username/id/email 중 있는 것)
    private String userKey(Object user) {
        if (user == null) return null;
        for (String m : new String[]{"getUsername", "getUserId", "getEmail", "getId", "getName"}) {
            try {
                Method md = user.getClass().getMethod(m);
                Object v = md.invoke(user);
                if (v != null) return String.valueOf(v);
            } catch (Exception ignored) {}
        }
        return null;
    }

    // MyRecipe → Draft로 전체 복사 (원본 id 연결)
    private DraftRecipe copyFromMyRecipe(MyRecipe my, String uid) {
        DraftRecipe d = new DraftRecipe();
        d.setAuthorUserId(uid);
        d.setTitle(my.getTitle());
        d.setDescription(my.getDescription());
        d.setImageUrl(my.getImageUrl());
        d.setTags("");
        d.setSourceMyRecipeId(my.getId()); // 원본 MyRecipeId 보존

        for (MyRecipeIngredient s : my.getIngredients()) {
            DraftIngredient di = new DraftIngredient();
            di.setDraft(d);
            di.setName(s.getName());
            di.setQuantity(s.getQuantity());
            di.setUnit(s.getUnit());
            di.setSortOrder(s.getSortOrder());
            d.getIngredients().add(di);
        }

        for (MyRecipeStep s : my.getSteps()) {
            DraftStep ds = new DraftStep();
            ds.setDraft(d);
            ds.setStepOrder(s.getSortOrder());
            ds.setContent(s.getContent());
            d.getSteps().add(ds);
        }

        d.setChildrenOwner();
        return d;
    }

    /* =========================
       작성/수정
       ========================= */
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

        if (req.ingredients() != null) {
            for (var i : req.ingredients()) {
                DraftIngredient di = new DraftIngredient();
                di.setName(i.name());
                di.setQuantity(i.quantity());
                di.setUnit(i.unit());
                di.setSortOrder(i.sortOrder() == null ? 0 : i.sortOrder());
                di.setDraft(d);
                d.getIngredients().add(di);
            }
        }
        if (req.steps() != null) {
            for (var s : req.steps()) {
                DraftStep ds = new DraftStep();
                ds.setStepOrder(s.stepOrder() == null ? 0 : s.stepOrder());
                ds.setContent(s.content());
                ds.setDraft(d);
                d.getSteps().add(ds);
            }
        }
        d.setChildrenOwner();
        DraftRecipe saved = repo.save(d);
        return toRes(saved);
    }

    /* =========================
       드래프트에서 제출 (보존 규칙 포함)
       ========================= */
    @Transactional
    public DraftRecipeRes submit(Long draftId, String uid) {
        DraftRecipe d = getOr404(draftId);
        if (!uid.equals(d.getAuthorUserId())) throw new AccessDeniedException("내 초안만 제출 가능");

        // 이미 대기중이면 그대로 반환
        if (d.getStatus() == DraftStatus.PENDING) return toRes(d);

        // DRAFT -> PENDING : 같은 레코드 사용
        if (d.getStatus() == DraftStatus.DRAFT) {
            d.setStatus(DraftStatus.PENDING);
            d.setRejectionReason(null);
            return toRes(d);
        }

        // REJECTED/APPROVED -> 새 레코드로 복사 제출 (기록 보존)
        DraftRecipe copy = new DraftRecipe();
        copy.setAuthorUserId(uid);
        copy.setTitle(d.getTitle());
        copy.setDescription(d.getDescription());
        copy.setImageUrl(d.getImageUrl());
        copy.setTags(d.getTags());
        copy.setSourceMyRecipeId(d.getSourceMyRecipeId());

        for (DraftIngredient src : d.getIngredients()) {
            DraftIngredient di = new DraftIngredient();
            di.setDraft(copy);
            di.setName(src.getName());
            di.setQuantity(src.getQuantity());
            di.setUnit(src.getUnit());
            di.setSortOrder(src.getSortOrder());
            copy.getIngredients().add(di);
        }
        for (DraftStep src : d.getSteps()) {
            DraftStep ds = new DraftStep();
            ds.setDraft(copy);
            ds.setStepOrder(src.getStepOrder());
            ds.setContent(src.getContent());
            copy.getSteps().add(ds);
        }
        copy.setChildrenOwner();
        copy.setStatus(DraftStatus.PENDING);
        copy.setRejectionReason(null);

        DraftRecipe saved = repo.save(copy);
        return toRes(saved);
    }

    /* =========================
       승인 신청 (draftId 또는 myRecipeId 모두 허용)
       ⬇⬇⬇ MyRecipe 우선 → Draft 순서 (id 충돌로 인한 상태 리셋 방지)
       ========================= */
    @Transactional
    public DraftRecipeRes submitFromDraftOrMyRecipe(Long id, String uid) {
        // 1) my-recipe로 시도
        Optional<MyRecipe> myOpt = myRecipeRepo.findById(id);
        if (myOpt.isPresent()) {
            MyRecipe my = myOpt.get();
            String owner = userKey(my.getUser());
            if (owner != null && !owner.equals(uid)) {
                throw new AccessDeniedException("내 레시피만 승인 신청 가능");
            }
            DraftRecipe copied = copyFromMyRecipe(my, uid);
            copied.setStatus(DraftStatus.PENDING);
            copied.setRejectionReason(null);
            DraftRecipe saved = repo.save(copied);
            return toRes(saved);
        }

        // 2) draft로 처리 (드래프트 상세에서 재신청하는 경우)
        DraftRecipe d = getOr404(id);
        if (!uid.equals(d.getAuthorUserId())) throw new AccessDeniedException("내 초안만 제출 가능");
        if (d.getStatus() != DraftStatus.PENDING) {
            d.setStatus(DraftStatus.PENDING);
            d.setRejectionReason(null);
        }
        return toRes(d);
    }

    /* =========================
       조회(목록/단건/상태)
       ========================= */
    @Transactional(readOnly = true)
    public Page<DraftRecipeRes> myDrafts(String uid, Pageable pg) {
        return repo.findByAuthorUserIdOrderByUpdatedAtDesc(uid, pg).map(this::toRes);
    }

    // 내가 제출한(대기/반려/승인) 목록
    @Transactional(readOnly = true)
    public Page<DraftRecipeRes> mySubmissions(String uid, Pageable pg) {
        return repo.findByAuthorUserIdAndStatusNotOrderByUpdatedAtDesc(uid, DraftStatus.DRAFT, pg)
                .map(this::toRes);
    }

    // MyRecipe 하나의 최신 승인 상태
    @Transactional(readOnly = true)
    public ApprovalStatusRes getApprovalStatusForMyRecipe(String uid, Long myRecipeId) {
        return repo.findTopByAuthorUserIdAndSourceMyRecipeIdOrderByUpdatedAtDesc(uid, myRecipeId)
                .map(d -> new ApprovalStatusRes(d.getStatus(), d.getRejectionReason(), d.getId(), d.getUpdatedAt()))
                .orElseGet(() -> new ApprovalStatusRes(DraftStatus.DRAFT, null, null, null));
    }

    @Transactional(readOnly = true)
    public Page<DraftRecipeRes> listPending(Pageable pg) {
        return repo.findByStatusOrderByCreatedAtAsc(DraftStatus.PENDING, pg).map(this::toRes);
    }

    @Transactional(readOnly = true)
    public DraftRecipeRes getOne(Long id) {
        return toRes(getOr404(id));
    }

    /* =========================
       관리자: 승인 / 반려
       ========================= */
    @Transactional
    public DraftRecipeRes approve(Long draftId) {
        DraftRecipe d = getOr404(draftId);

        // 1) 공개 레시피 생성
        Recipe r = new Recipe();
        r.setTitle(d.getTitle());
        r.setImage(d.getImageUrl());
        Recipe saved = recipeRepo.save(r);

        // 2) 태그
        for (String t : parseTags(d.getTags())) {
            RecipeTag tag = new RecipeTag();
            tag.setRecipe(saved);
            tag.setName(t.trim());
            recipeTagRepo.save(tag);
        }

        // 3) 재료
        for (DraftIngredient di : d.getIngredients()) {
            RecipeIngredient ri = new RecipeIngredient();
            ri.setRecipe(saved);
            ri.setName(di.getName());
            try {
                String amount = (di.getQuantity() == null ? "" : di.getQuantity())
                        + (di.getUnit() == null || di.getUnit().isBlank() ? "" : " " + di.getUnit());
                RecipeIngredient.class.getMethod("setAmount", String.class).invoke(ri, amount.trim());
            } catch (NoSuchMethodException ignored) {
            } catch (Exception ignored) {}
            recipeIngRepo.save(ri);
        }

        // 4) 단계
        for (DraftStep ds : d.getSteps()) {
            RecipeStep rs = new RecipeStep();
            rs.setRecipe(saved);
            rs.setStepOrder(ds.getStepOrder());
            try {
                RecipeStep.class.getMethod("setDescription", String.class).invoke(rs, ds.getContent());
            } catch (NoSuchMethodException ignored) {
                try { RecipeStep.class.getMethod("setContent", String.class).invoke(rs, ds.getContent()); }
                catch (Exception ignored2) {}
            } catch (Exception ignored) {}
            recipeStepRepo.save(rs);
        }

        // 5) 상태 업데이트
        d.setStatus(DraftStatus.APPROVED);
        d.setPublishedRecipeId(saved.getId());
        d.setRejectionReason(null);
        return toRes(d);
    }

    @Transactional
    public DraftRecipeRes reject(Long draftId, String reason) {
        DraftRecipe d = getOr404(draftId);
        d.setStatus(DraftStatus.REJECTED);
        d.setRejectionReason(reason);
        d.setPublishedRecipeId(null);
        return toRes(d);
    }

    /* =========================
       제출 취소
       ========================= */
    @Transactional
    public DraftRecipeRes cancelSubmission(Long draftId, String uid) {
        DraftRecipe d = getOr404(draftId);
        if (!uid.equals(d.getAuthorUserId())) throw new AccessDeniedException("내 초안만 취소 가능");
        if (d.getStatus() != DraftStatus.PENDING)
            throw new IllegalStateException("대기중인 신청만 취소할 수 있습니다.");
        d.setStatus(DraftStatus.DRAFT);
        d.setRejectionReason(null);
        d.setPublishedRecipeId(null);
        return toRes(d);
    }
}
