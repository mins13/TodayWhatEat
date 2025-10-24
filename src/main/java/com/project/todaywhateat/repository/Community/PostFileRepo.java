package com.project.todaywhateat.repository.Community;

import com.project.todaywhateat.domain.Community.PostFile;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PostFileRepo extends JpaRepository<PostFile, Long> {
    List<PostFile> findByPost_IdOrderByIdAsc(Long postId);
}
