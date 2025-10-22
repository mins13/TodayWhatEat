// src/main/java/com/project/todaywhateat/controller/DraftRecipeController.java
package com.project.todaywhateat.controller;

import com.project.todaywhateat.dto.draft.DraftRecipeRes;
import com.project.todaywhateat.dto.draft.DraftRecipeUpsertReq;
import com.project.todaywhateat.service.DraftRecipeService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class DraftRecipeController {

    private final DraftRecipeService svc;

    // 작성
    @PostMapping("/drafts")
    @PreAuthorize("isAuthenticated()")
    public DraftRecipeRes create(Authentication auth,
                                 @RequestBody DraftRecipeUpsertReq req) {
        return svc.createOrUpdate(auth.getName(), null, req);
    }

    // 수정
    @PutMapping("/drafts/{id}")
    @PreAuthorize("isAuthenticated()")
    public DraftRecipeRes update(Authentication auth,
                                 @PathVariable Long id,
                                 @RequestBody DraftRecipeUpsertReq req) {
        return svc.createOrUpdate(auth.getName(), id, req);
    }

    // 드래프트에서 제출
    @PostMapping("/drafts/{id}/submit")
    @PreAuthorize("isAuthenticated()")
    public DraftRecipeRes submitDraft(Authentication auth, @PathVariable Long id) {
        return svc.submit(id, auth.getName());
    }

    // ✅ 내가 제출한 목록만 (DRAFT 제외: PENDING/REJECTED/APPROVED)
    @GetMapping("/drafts/my")
    @PreAuthorize("isAuthenticated()")
    public Page<DraftRecipeRes> mySubmissions(Authentication auth,
                                              @RequestParam(defaultValue = "0") int page,
                                              @RequestParam(defaultValue = "10") int size) {
        return svc.mySubmissions(auth.getName(), PageRequest.of(page, size));
    }

    // ✅ 제출 취소 (PENDING → DRAFT, 목록에서 빠짐)
    @PostMapping("/drafts/{id}/cancel")
    @PreAuthorize("isAuthenticated()")
    public DraftRecipeRes cancel(Authentication auth, @PathVariable Long id) {
        return svc.cancelSubmission(id, auth.getName());
    }
}
