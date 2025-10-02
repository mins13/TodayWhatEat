package com.project.todaywhateat.controller;

import com.project.todaywhateat.dto.draft.DraftRecipeRes;
import com.project.todaywhateat.service.DraftRecipeService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/recipe-drafts")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminRecipeDraftController {
    private final DraftRecipeService svc;

    // 승인 대기 목록
    @GetMapping("/pending")
    public Page<DraftRecipeRes> pending(@RequestParam(defaultValue="0") int page,
                                        @RequestParam(defaultValue="20") int size){
        return svc.listPending(PageRequest.of(page, size));
    }

    // 승인
    @PostMapping("/{id}/approve")
    public DraftRecipeRes approve(@PathVariable Long id){
        return svc.approve(id);
    }

    // 반려
    public record RejectReq(String reason) {}
    @PostMapping("/{id}/reject")
    public DraftRecipeRes reject(@PathVariable Long id, @RequestBody RejectReq req){
        return svc.reject(id, req.reason());
    }
}
