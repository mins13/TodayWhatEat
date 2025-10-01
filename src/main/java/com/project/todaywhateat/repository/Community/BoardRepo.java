package com.project.todaywhateat.repository.Community;

import com.project.todaywhateat.domain.Community.Board;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface BoardRepo extends JpaRepository<Board, Long> {
    Optional<Board> findByCode(String code);
}
