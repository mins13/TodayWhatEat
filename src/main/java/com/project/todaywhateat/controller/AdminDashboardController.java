// src/main/java/com/project/todaywhateat/controller/AdminDashboardController.java
package com.project.todaywhateat.controller;

import com.project.todaywhateat.domain.draft.DraftStatus;
import com.project.todaywhateat.dto.admin.AdminMiniRes;
import com.project.todaywhateat.dto.admin.RecentNoticeRes;
import com.project.todaywhateat.repository.Community.PostRepo;
import com.project.todaywhateat.repository.DraftRecipeRepository;
import com.project.todaywhateat.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminDashboardController {

    private static final String NOTICE_BOARD = "notice";

    private final UserRepository userRepo;
    private final PostRepo postRepo;
    private final DraftRecipeRepository draftRepo;

    /** 미니 대시보드 지표 */
    @GetMapping("/mini")
    public AdminMiniRes mini() {
        LocalDateTime startOfToday = LocalDate.now().atStartOfDay();
        LocalDateTime now = LocalDateTime.now();

        long signupsToday = userRepo.countByCreatedAtBetween(startOfToday, now);
        long postsToday   = postRepo.countByCreatedAtBetween(startOfToday, now);
        long pending      = draftRepo.countByStatus(DraftStatus.PENDING);

        // 재방문율은 사용자 테이블에 lastLoginAt 등이 없어서 우선 0으로 반환
        double revisitRate = 0.0;

        return new AdminMiniRes(signupsToday, postsToday, revisitRate, pending);
    }

    /** 최근 공지 n개 (고정글 우선, 최신 순) */
    @GetMapping("/notices/recent")
    public List<RecentNoticeRes> recent(@RequestParam(defaultValue = "5") int limit) {
        var page = postRepo.findByBoard_CodeOrderByPinnedDescIdDesc(
                NOTICE_BOARD, PageRequest.of(0, Math.max(1, limit))
        );
        return page.map(p -> new RecentNoticeRes(p.getId(), p.getTitle(), p.getCreatedAt()))
                .getContent();
    }
}
