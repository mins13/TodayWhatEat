// src/main/java/com/project/todaywhateat/service/CommunityService.java
package com.project.todaywhateat.service;

import com.project.todaywhateat.Specification.PostSpecs;
import com.project.todaywhateat.domain.Community.Board;
import com.project.todaywhateat.domain.Community.Comment;
import com.project.todaywhateat.domain.Community.Post;
import com.project.todaywhateat.domain.Community.PostFile;
import com.project.todaywhateat.domain.Community.PostLike;
import com.project.todaywhateat.domain.User;
import com.project.todaywhateat.dto.Community.*;
import com.project.todaywhateat.repository.Community.*;
import com.project.todaywhateat.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true) // 기본은 읽기 전용
public class CommunityService {

    private final BoardRepo boardRepo;
    private final PostRepo postRepo;
    private final CommentRepo commentRepo;
    private final PostLikeRepo likeRepo;
    private final UserRepository userRepository;

    // ★ 첨부 저장/조회
    private final PostFileRepo postFileRepo;
    private final FileStorageService fileStorageService;

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
        // ✅ 공지 게시판은 pinned 우선 정렬(검색 시에도)
        if ("notice".equalsIgnoreCase(boardCode)) {
            int p = Math.max(0, page - 1);
            Pageable pageable = PageRequest.of(p, size); // 정렬은 쿼리/레포에서 처리

            Page<Post> pg = (q == null || q.isBlank())
                    ? postRepo.findByBoard_CodeOrderByPinnedDescIdDesc("notice", pageable)
                    : postRepo.searchByBoardAndTitleOrContent("notice", q, pageable);

            return new PageResponse<>(
                    pg.getContent().stream().map(PostListDto::from).toList(),
                    pg.getTotalElements()
            );
        }

        // ✅ 일반 게시판: 기존 스펙/정렬 유지
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
                ? likeRepo.existsByPost_IdAndUserId(post.getId(), me)
                : null;

        // mine 계산: 작성자이거나 관리자
        boolean isOwner = (me != null) && post.getUserId() != null && post.getUserId().equals(me);
        boolean isAdmin = java.util.Optional.ofNullable(SecurityContextHolder.getContext().getAuthentication())
                .map(a -> a.getAuthorities().stream().anyMatch(gr -> "ROLE_ADMIN".equals(gr.getAuthority())))
                .orElse(false);

        Boolean mine = (me != null) ? (isOwner || isAdmin) : false;

        // ★ 첨부 조회 → DTO 변환
        var files = postFileRepo.findByPost_IdOrderByIdAsc(post.getId()).stream()
                .map(f -> new PostDetailDto.AttachmentDto(
                        f.getId(), f.getUrl(), f.getFilename(), f.getWidth(), f.getHeight()
                ))
                .toList();

        // ★ 레시피 연결이 있다면 이곳에서 DTO 조립 (현재는 없으므로 null)
        PostDetailDto.AttachedRecipeDto recipeDto = null;

        // ★ 첨부/레시피까지 포함해서 반환
        return PostDetailDto.from(post, liked, mine, files, recipeDto);
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
        return likeRepo.countByPost_Id(postId);
    }

    /* -------------------------- username 엔트리(트랜잭션 진입점) -------------------------- */

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

    /* -------------------------- 내부 구현 -------------------------- */

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
        boolean liked = likeRepo.existsByPost_IdAndUserId(p.getId(), userId);
        if (liked) {
            likeRepo.deleteByPost_IdAndUserId(p.getId(), userId);
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

    /* -------------------------- 멀티파트 생성(첨부/레시피 확장 지점) -------------------------- */
    @Transactional
    public Long create(String board,
                       String title,
                       String content,
                       String authorName,
                       Long recipeId,
                       List<MultipartFile> files,
                       Authentication auth) {

        // 0) 인증 체크
        final String username = (auth != null ? auth.getName() : null);
        if (username == null || username.isBlank()) {
            throw new AccessDeniedException("로그인이 필요합니다.");
        }

        // 1) 기존 로직으로 '글 생성'
        Long postId = this.createByUsername(
                board,
                username,
                new CreatePostReq(title, content, authorName,recipeId)
        );

        // 2) 첨부 이미지 저장 + 레코드 생성
        if (files != null && !files.isEmpty()) {
            Post post = postRepo.findById(postId).orElseThrow(() -> notFound("post"));
            for (MultipartFile f : files) {
                if (f == null || f.isEmpty()) continue;
                try {
                    String url = fileStorageService.savePublic(f); // /files/yyyy/MM/uuid.ext
                    PostFile pf = new PostFile();
                    pf.setPost(post);
                    pf.setUrl(url);                    // ★ 반드시 /files/... 형태
                    pf.setFilename(f.getOriginalFilename());
                    pf.setSize(f.getSize());
                    // width/height 필요 시 이미지 라이브러리로 계산해서 세팅
                    postFileRepo.save(pf);
                } catch (Exception ex) {
                    // 저장 실패는 로그만 남기고 계속 (정책에 따라 롤백 선택)
                    // log.warn("file save failed", ex);
                }
            }
        }

        // 3) (선택) 레시피 연결 – 스키마에 맞게 구현
        // if (recipeId != null) { ... post.setAttachedRecipeId(recipeId); postRepo.save(post); }

        return postId;
    }
}
