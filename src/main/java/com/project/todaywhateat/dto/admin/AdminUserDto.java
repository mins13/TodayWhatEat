package com.project.todaywhateat.dto.admin;

import com.project.todaywhateat.domain.User;
import java.time.LocalDateTime;

public record AdminUserDto(
        Long id, String username, String email, String nickname,
        String role, boolean banned, LocalDateTime createdAt
) {
    public static AdminUserDto from(User u) {
        return new AdminUserDto(
                u.getId(),
                u.getUsername(),
                u.getEmail(),
                u.getNickname(),
                (u.getRole() == null ? "USER" : u.getRole()),
                Boolean.TRUE.equals(u.getBanned()),
                u.getCreatedAt()
        );
    }
}