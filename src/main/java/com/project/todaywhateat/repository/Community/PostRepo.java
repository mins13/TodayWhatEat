package com.project.todaywhateat.repository.Community;

import com.project.todaywhateat.domain.Community.Post;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PostRepo extends JpaRepository<Post, Long>, JpaSpecificationExecutor<Post> {

    Page<Post> findByTitleContainingIgnoreCaseOrContentContainingIgnoreCase(
            String t, String c, Pageable pageable);

    // 기존
    Page<Post> findByBoard_Code(String boardCode, Pageable pageable);

    // ✅ 공지 전용: pinned desc, id desc
    Page<Post> findByBoard_CodeOrderByPinnedDescIdDesc(String boardCode, Pageable pageable);

    // ✅ 검색 + pinned 정렬 (CLOB 안전하게 content 쪽 lower() 제거)
    @Query("""
      select p from Post p
      where p.board.code = :boardCode
        and ( lower(p.title) like lower(concat('%', :q, '%'))
           or        p.content like concat('%', :q, '%') )
      order by p.pinned desc, p.id desc
    """)
    Page<Post> searchByBoardAndTitleOrContent(@Param("boardCode") String boardCode,
                                              @Param("q") String q,
                                              Pageable pageable);
}