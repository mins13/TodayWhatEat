// src/main/java/com/project/todaywhateat/controller/MyRecipeDraftController.java
package com.project.todaywhateat.controller;

import com.project.todaywhateat.dto.draft.ApprovalStatusRes;
import com.project.todaywhateat.dto.draft.DraftRecipeRes;
import com.project.todaywhateat.service.DraftRecipeService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/my-recipes")
@RequiredArgsConstructor
public class MyRecipeDraftController {

    private final DraftRecipeService svc;

    /** (옵션) 내 승인 신청 목록 라우트 – /api/drafts/my 와 동일 동작 */
    @GetMapping("/approvals")
    @PreAuthorize("isAuthenticated()")
    public Page<DraftRecipeRes> myApprovals(Authentication auth,
                                            @RequestParam(defaultValue = "0") int page,
                                            @RequestParam(defaultValue = "10") int size) {
        return svc.mySubmissions(auth.getName(), PageRequest.of(page, size));
    }

    /** 승인 신청(통합): myRecipeId 또는 draftId 둘 다 허용 */
    @PostMapping("/{id}/approval")
    @PreAuthorize("isAuthenticated()")
    public DraftRecipeRes submit(@PathVariable Long id, Authentication auth) {
        return svc.submitFromDraftOrMyRecipe(id, auth.getName());
    }

    /** 승인 상태 조회(특정 myRecipe 기준 최신) */
    @GetMapping("/{id}/approval-status")
    @PreAuthorize("isAuthenticated()")
    public ApprovalStatusRes status(@PathVariable Long id, Authentication auth) {
        return svc.getApprovalStatusForMyRecipe(auth.getName(), id);
    }
}
