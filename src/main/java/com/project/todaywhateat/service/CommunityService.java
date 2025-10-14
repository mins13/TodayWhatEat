package com.project.todaywhateat.service;

import com.project.todaywhateat.Specification.PostSpecs;
import com.project.todaywhateat.domain.Community.Board;
import com.project.todaywhateat.domain.Community.Comment;
import com.project.todaywhateat.domain.Community.Post;
import com.project.todaywhateat.domain.Community.PostLike;
import com.project.todaywhateat.domain.User;
import com.project.todaywhateat.dto.Community.*;
import com.project.todaywhateat.repository.Community.BoardRepo;
import com.project.todaywhateat.repository.Community.CommentRepo;
import com.project.todaywhateat.repository.Community.PostLikeRepo;
import com.project.todaywhateat.repository.Community.PostRepo;
import com.project.todaywhateat.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true) // 기본은 읽기 전용
public class CommunityService {

    private final BoardRepo boardRepo;
    private final PostRepo postRepo;
    private final CommentRepo commentRepo;
    private final PostLikeRepo likeRepo;
    private final UserRepository userRepository;

    /* -------------------------- 공용 유틸 -------------------------- */

    private Long userIdByUsername(String username) {
        return userRepository.findByUsername(username)
                .map(User::getId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "사용자를 찾을 수 없습니다."));
    }

    private ResponseStatusException notFound(String what){
        return new ResponseStatusException(HttpStatus.NOT_FOUND, what + " not found");
    }
    private ResponseStatusException forbidden(){
        return new ResponseStatusException(HttpStatus.FORBIDDEN, "forbidden");
    }

    private Post findPost(String boardCode, Long id){
        Board b = boardRepo.findByCode(boardCode).orElseThrow(() -> notFound("board"));
        Post p = postRepo.findById(id).orElseThrow(() -> notFound("post"));
        if (!p.getBoard().getId().equals(b.getId())) throw notFound("post");
        return p;
    }

    private Sort sortOf(String sort) {
        String key = (sort == null ? "latest" : sort).toLowerCase();
        return switch (key) {
            case "views" -> Sort.by(Sort.Order.desc("viewsCount"))
                    .and(Sort.by(Sort.Order.desc("likesCount")));
            case "likes" -> Sort.by(Sort.Order.desc("likesCount"))
                    .and(Sort.by(Sort.Order.desc("viewsCount")));
            default -> Sort.by(Sort.Order.desc("createdAt"));
        };
    }

    /* -------------------------- 조회계열 -------------------------- */

    public PageResponse<PostListDto> list(String boardCode, String q, String sort, int page, int size){
        Board board = boardRepo.findByCode(boardCode).orElseThrow(() -> notFound("board"));
        Pageable pageable = PageRequest.of(Math.max(0, page - 1), size, sortOf(sort));
        Specification<Post> spec = Specification.where(PostSpecs.inBoard(board))
                .and(PostSpecs.keyword(q));
        Page<Post> p = postRepo.findAll(spec, pageable);
        return new PageResponse<>(
                p.getContent().stream().map(PostListDto::from).toList(),
                p.getTotalElements()
        );
    }

    @Transactional
    public PostDetailDto getAndIncreaseView(String boardCode, Long id, String usernameOrNull){
        Post post = findPost(boardCode, id);

        // 조회수 +1
        post.setViewsCount(post.getViewsCount() + 1);

        // 로그인 사용자 ID (없으면 null)
        Long me = null;
        if (usernameOrNull != null && !usernameOrNull.isBlank()) {
            me = userRepository.findByUsername(usernameOrNull)
                    .map(User::getId)
                    .orElse(null);
        }

        // 좋아요 여부
        Boolean liked = (me != null)
                ? likeRepo.existsByPost_IdAndUserId(post.getId(), me) // ✅ 여러분 프로젝트에 이미 쓰던 네이밍
                : null;

        // mine 계산: 작성자이거나 관리자
        boolean isOwner = (me != null) && post.getUserId() != null && post.getUserId().equals(me);
        boolean isAdmin = java.util.Optional.ofNullable(SecurityContextHolder.getContext().getAuthentication())
                .map(a -> a.getAuthorities().stream().anyMatch(gr -> "ROLE_ADMIN".equals(gr.getAuthority())))
                .orElse(false);

        Boolean mine = (me != null) ? (isOwner || isAdmin) : false;

        return PostDetailDto.from(post, liked, mine); // ✅ PostDetailDto 오버로드( liked, mine ) 버전 호출
    }

    @Transactional(readOnly = true)
    public PageResponse<CommentDto> listComments(Long postId, int page, int size, String usernameOrNull){
        Long me = null;
        if (usernameOrNull != null && !usernameOrNull.isBlank()) {
            me = userRepository.findByUsername(usernameOrNull).map(User::getId).orElse(null);
        }
        var p = commentRepo.findByPostIdOrderByCreatedAtDesc(
                postId, PageRequest.of(Math.max(0, page - 1), size)
        );
        Long meFinal = me;
        return new PageResponse<>(
                p.getContent().stream()
                        .map(c -> CommentDto.from(c, meFinal != null && c.getUserId() != null && c.getUserId().equals(meFinal)))
                        .toList(),
                p.getTotalElements()
        );
    }


    /** 좋아요 총 개수(컨트롤러에서 응답으로 내려줄 때 사용) */
    public long likeCount(Long postId) {
        return likeRepo.countByPost_Id(postId); // ✅ 연관필드 중첩경로
    }

    /* -------------------------- username 엔트리(트랜잭션 진입점) -------------------------- */
    // 컨트롤러는 아래 메서드들만 호출하세요.

    @Transactional
    public Long createByUsername(String boardCode, String username, CreatePostReq req) {
        return createInternal(boardCode, userIdByUsername(username), req);
    }

    @Transactional
    public void updateByUsername(String boardCode, Long id, String username, UpdatePostReq req) {
        updateInternal(boardCode, id, userIdByUsername(username), req);
    }

    @Transactional
    public void deleteByUsername(String boardCode, Long id, String username) {
        deleteInternal(boardCode, id, userIdByUsername(username));
    }

    @Transactional
    public boolean toggleLikeByUsername(String boardCode, Long id, String username) {
        return toggleLikeInternal(boardCode, id, userIdByUsername(username));
    }

    @Transactional
    public Long addCommentByUsername(Long postId, String username, CreateCommentReq req) {
        return addCommentInternal(postId, userIdByUsername(username), req);
    }

    @Transactional
    public void updateCommentByUsername(Long commentId, String username, String content) {
        updateCommentInternal(commentId, userIdByUsername(username), content);
    }

    @Transactional
    public void deleteCommentByUsername(Long commentId, String username) {
        deleteCommentInternal(commentId, userIdByUsername(username));
    }

    /* -------------------------- 내부 구현(프록시 내부 호출이라 @Transactional 붙이지 않음) -------------------------- */

    private Long createInternal(String boardCode, Long userId, CreatePostReq req){
        Board board = boardRepo.findByCode(boardCode).orElseThrow(() -> notFound("board"));
        Post p = new Post();
        p.setBoard(board);
        p.setUserId(userId);
        p.setAuthorName((req.authorName() == null || req.authorName().isBlank()) ? "익명" : req.authorName());
        p.setTitle(req.title());
        p.setContent(req.content());
        return postRepo.save(p).getId();
    }

    private void updateInternal(String boardCode, Long id, Long userId, UpdatePostReq req){
        Post p = findPost(boardCode, id);
        if (p.getUserId() != null && !p.getUserId().equals(userId)) throw forbidden();
        p.setTitle(req.title());
        p.setContent(req.content());
    }

    private void deleteInternal(String boardCode, Long id, Long userId){
        Post p = findPost(boardCode, id);
        if (p.getUserId() != null && !p.getUserId().equals(userId)) throw forbidden();
        postRepo.delete(p);
    }

    private boolean toggleLikeInternal(String boardCode, Long id, Long userId){
        Post p = findPost(boardCode, id);
        boolean liked = likeRepo.existsByPost_IdAndUserId(p.getId(), userId); // ✅ 중첩경로
        if (liked) {
            likeRepo.deleteByPost_IdAndUserId(p.getId(), userId);            // ✅ 중첩경로
            p.setLikesCount(Math.max(0, p.getLikesCount() - 1));
            return false;
        } else {
            PostLike pl = new PostLike();
            pl.setPost(p);
            pl.setUserId(userId);
            likeRepo.save(pl);
            p.setLikesCount(p.getLikesCount() + 1);
            return true;
        }
    }

    private Long addCommentInternal(Long postId, Long userId, CreateCommentReq req){
        Post post = postRepo.findById(postId).orElseThrow(() -> notFound("post"));
        Comment c = new Comment();
        c.setPost(post);
        c.setUserId(userId);
        c.setAuthorName((req.authorName() == null || req.authorName().isBlank()) ? "익명" : req.authorName());
        c.setContent(req.content());
        return commentRepo.save(c).getId();
    }

    private void updateCommentInternal(Long commentId, Long userId, String content){
        Comment c = commentRepo.findById(commentId).orElseThrow(() -> notFound("comment"));
        if (c.getUserId() != null && !c.getUserId().equals(userId)) throw forbidden();
        c.setContent(content);
    }

    private void deleteCommentInternal(Long commentId, Long userId){
        Comment c = commentRepo.findById(commentId).orElseThrow(() -> notFound("comment"));
        if (c.getUserId() != null && !c.getUserId().equals(userId)) throw forbidden();
        commentRepo.delete(c);
    }
}
