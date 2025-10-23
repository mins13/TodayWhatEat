// repository/memo/UserMemoRepository.java
package com.project.todaywhateat.repository.memo;

import com.project.todaywhateat.domain.memo.UserMemo;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserMemoRepository extends JpaRepository<UserMemo, Long> {
    Optional<UserMemo> findByUserId(Long userId);
}
