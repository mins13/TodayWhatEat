// src/main/java/com/project/todaywhateat/dto/admin/RecentNoticeRes.java
package com.project.todaywhateat.dto.admin;

import java.time.LocalDateTime;

public record RecentNoticeRes(
        Long id,
        String title,
        LocalDateTime createdAt
) {}
