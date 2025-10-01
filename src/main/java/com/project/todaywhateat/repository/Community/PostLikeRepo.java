// PostLikeRepo
package com.project.todaywhateat.repository.Community;

import com.project.todaywhateat.domain.Community.PostLike;
import com.project.todaywhateat.domain.Community.PostLikeId;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PostLikeRepo extends JpaRepository<PostLike, PostLikeId> {
    boolean existsByPost_IdAndUserId(Long postId, Long userId);   // ✅ post.id
    long countByPost_Id(Long postId);                              // (선택) 카운트용
    void deleteByPost_IdAndUserId(Long postId, Long userId);       // ✅ post.id
}
