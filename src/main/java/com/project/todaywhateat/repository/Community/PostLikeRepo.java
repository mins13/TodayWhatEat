package com.project.todaywhateat.repository.Community;

import com.project.todaywhateat.domain.Community.PostLike;
import com.project.todaywhateat.domain.Community.PostLikeId;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PostLikeRepo extends JpaRepository<PostLike, PostLikeId> {
    boolean existsByPostIdAndUserId(Long postId, Long userId);
    long countByPostId(Long postId);
    void deleteByPostIdAndUserId(Long postId, Long userId);
}