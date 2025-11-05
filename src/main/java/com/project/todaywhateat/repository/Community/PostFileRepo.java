package com.project.todaywhateat.repository.Community;

import com.project.todaywhateat.domain.Community.PostFile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

public interface PostFileRepo extends JpaRepository<PostFile, Long> {

    List<PostFile> findByPost_IdOrderByIdAsc(Long postId);

    @Modifying
    @Transactional
    void deleteByPost_Id(Long postId);
}