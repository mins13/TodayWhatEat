package com.project.todaywhateat.controller;

import com.project.todaywhateat.dto.draft.DraftRecipeRes;
import com.project.todaywhateat.dto.draft.DraftRecipeUpsertReq;
import com.project.todaywhateat.service.DraftRecipeService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/drafts")
@RequiredArgsConstructor
public class DraftRecipeController {
    private final DraftRecipeService svc;

    // 생성
    @PostMapping
    @PreAuthorize("isAuthenticated()")
    public DraftRecipeRes create(@AuthenticationPrincipal(expression="name") String uid,
                                 @RequestBody DraftRecipeUpsertReq req){
        return svc.createOrUpdate(uid, null, req);
    }

    // 수정
    @PutMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public DraftRecipeRes update(@AuthenticationPrincipal(expression="name") String uid,
                                 @PathVariable Long id,
                                 @RequestBody DraftRecipeUpsertReq req){
        return svc.createOrUpdate(uid, id, req);
    }

    // 제출(승인요청)
    @PostMapping("/{id}/submit")
    @PreAuthorize("isAuthenticated()")
    public DraftRecipeRes submit(@AuthenticationPrincipal(expression="name") String uid,
                                 @PathVariable Long id){
        return svc.submit(id, uid);
    }

    // 내 초안 목록
    @GetMapping("/my")
    @PreAuthorize("isAuthenticated()")
    public Page<DraftRecipeRes> my(@AuthenticationPrincipal(expression="name") String uid,
                                   @RequestParam(defaultValue="0") int page,
                                   @RequestParam(defaultValue="10") int size){
        return svc.myDrafts(uid, PageRequest.of(page, size));
    }
}
