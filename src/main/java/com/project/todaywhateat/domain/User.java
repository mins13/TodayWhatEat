package com.project.todaywhateat.domain;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id; // PK

    @Column(nullable = false, unique = true)
    private String username; // 사용자 ID (로그인용)

    @Column(nullable = false)
    private String password; // 비밀번호

    @Column(nullable = false)
    private String nickname; // 사용자 닉네임

    @Column(nullable = false)
    private String email; // 이메일

    // ✅ 관리자 페이지/권한 체크용 필드
    @Column(nullable = false, length = 20)
    private String role = "USER";          // USER / ADMIN

    @Column(nullable = false)
    private Boolean banned = false;        // 정지 여부

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;       // 가입일

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) createdAt = LocalDateTime.now();
        if (role == null) role = "USER";
        if (banned == null) banned = false;
    }
}
