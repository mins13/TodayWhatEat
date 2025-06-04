package com.project.todaywhateat.repository;

import com.project.todaywhateat.domain.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    // username으로 회원 조회 (로그인 시 사용)
    Optional<User> findByUsername(String username);

    // 이메일 중복 확인 등 필요한 메서드도 추가 가능
    boolean existsByUsername(String username);
    boolean existsByEmail(String email);
    boolean existsByNickname(String nickname);
}
