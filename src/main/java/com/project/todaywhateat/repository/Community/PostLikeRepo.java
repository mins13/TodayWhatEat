// PostLikeRepo
package com.project.todaywhateat.repository.Community;

import com.project.todaywhateat.domain.Community.PostLike;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.transaction.annotation.Transactional;

public interface PostLikeRepo extends JpaRepository<PostLike, Long> {

    long countByPost_Id(Long postId);

    boolean existsByPost_IdAndUserId(Long postId, Long userId);

    void deleteByPost_IdAndUserId(Long postId, Long userId);

    @Modifying
    @Transactional
    void deleteByPost_Id(Long postId);
}
