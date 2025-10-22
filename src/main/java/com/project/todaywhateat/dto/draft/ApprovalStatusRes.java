package com.project.todaywhateat.dto.draft;

import com.project.todaywhateat.domain.draft.DraftStatus;

import java.time.LocalDateTime;

public record ApprovalStatusRes(
        DraftStatus status,          // PENDING/REJECTED/APPROVED/DRAFT
        String rejectionReason,      // 반려 사유 (REJECTED일 때)
        Long draftId,                // 연결된 초안 ID (있으면)
        LocalDateTime updatedAt      // 마지막 갱신 시각
) {}
