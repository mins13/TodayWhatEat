// src/main/java/com/project/todaywhateat/dto/admin/AdminMiniRes.java
package com.project.todaywhateat.dto.admin;

public record AdminMiniRes(
        long signups,        // 오늘 가입 수
        long posts,          // 오늘 게시글 수
        double revisitRate,  // 7일 재방문율(%) — 현재 0.0
        long pending         // 승인 대기 개수
) {}
