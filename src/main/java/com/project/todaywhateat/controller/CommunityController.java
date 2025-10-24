// com.project.todaywhateat.controller.CommunityController
package com.project.todaywhateat.controller;

import com.project.todaywhateat.dto.Community.*;
import com.project.todaywhateat.repository.Community.PostLikeRepo;
import com.project.todaywhateat.service.CommunityService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;
import java.util.Set;

@RestController
@RequestMapping("/api/community")
@RequiredArgsConstructor
public class CommunityController {
    private final CommunityService svc;
    private final PostLikeRepo likeRepo;

    private static final Set<String> ALLOWED_BOARDS = Set.of("free", "recipe", "info", "notice");

    /* ---------- 공용 유틸 ---------- */
    private void validateBoard(String board) {
        if (!ALLOWED_BOARDS.contains(board)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "유효하지 않은 게시판입니다.");
        }
    }

    /** Authentication에서 username(=Jwt subject) 추출. */
    private String requireUsername(Authentication auth) {
        if (auth == null || auth.getName() == null || auth.getName().isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "로그인이 필요합니다.");
        }
        return auth.getName();
    }

    /* ---------- 목록 ---------- */
    @GetMapping("/{board}")
    public PageResponse<PostListDto> list(
            @PathVariable String board,
            @RequestParam(defaultValue = "") String query,
            @RequestParam(defaultValue = "latest") String sort,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        validateBoard(board);
        return svc.list(board, query, sort, page, size);
    }

    @GetMapping("/{board}/{id}/comments")
    public PageResponse<CommentDto> comments(@PathVariable String board,
                                             @PathVariable Long id,
                                             @RequestParam(defaultValue = "1") int page,
                                             @RequestParam(defaultValue = "20") int size,
                                             Authentication auth) {
        validateBoard(board);
        String username = (auth != null ? auth.getName() : null);
        return svc.listComments(id, page, size, username);   // mine 포함
    }

    /* ---------- 상세(조회수 +1) ---------- */
    @GetMapping("/{board}/{id}")
    public PostDetailDto detail(@PathVariable String board,
                                @PathVariable Long id,
                                Authentication auth) {
        validateBoard(board);
        String username = (auth != null ? auth.getName() : null);
        return svc.getAndIncreaseView(board, id, username); // liked 포함
    }

    /* ---------- 작성(JSON) : 멀티파트와 경로 동일, consumes 로 분리 ---------- */
    @PostMapping(path = "/{board}", consumes = MediaType.APPLICATION_JSON_VALUE)
    @PreAuthorize("isAuthenticated()")
    public Map<String, Object> createJson(
            @PathVariable String board,
            @RequestBody CreatePostReq req,
            Authentication auth
    ) {
        validateBoard(board);
        String username = requireUsername(auth);
        if (req == null || req.title() == null || req.title().isBlank()
                || req.content() == null || req.content().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "title, content는 필수입니다.");
        }
        Long id = svc.create(board, req.title(), req.content(), req.authorName(), req.recipeId(), null, auth);
        return Map.of("id", id);
    }

    /* ---------- 수정 ---------- */
    @PutMapping(path = "/{board}/{id}", consumes = MediaType.APPLICATION_JSON_VALUE)
    @PreAuthorize("isAuthenticated()")
    public void updatePut(@PathVariable String board,
                          @PathVariable Long id,
                          @RequestBody UpdatePostReq req,
                          Authentication auth) {
        validateBoard(board);
        String username = requireUsername(auth);
        svc.updateByUsername(board, id, username, req);
    }

    @PatchMapping(path = "/{board}/{id}", consumes = MediaType.APPLICATION_JSON_VALUE)
    @PreAuthorize("isAuthenticated()")
    public void updatePatch(@PathVariable String board,
                            @PathVariable Long id,
                            @RequestBody UpdatePostReq req,
                            Authentication auth) {
        validateBoard(board);
        String username = requireUsername(auth);
        svc.updateByUsername(board, id, username, req);
    }

    /* ---------- 삭제 ---------- */
    @DeleteMapping("/{board}/{id}")
    @PreAuthorize("isAuthenticated()")
    public void delete(@PathVariable String board, @PathVariable Long id, Authentication auth) {
        validateBoard(board);
        String username = requireUsername(auth);
        svc.deleteByUsername(board, id, username);
    }

    /* ---------- 좋아요 ---------- */
    @PostMapping("/{board}/{id}/like")
    @PreAuthorize("isAuthenticated()")
    public Map<String, Object> toggleLike(@PathVariable String board, @PathVariable Long id, Authentication auth) {
        validateBoard(board);
        String username = requireUsername(auth);
        boolean liked = svc.toggleLikeByUsername(board, id, username);
        long count = likeRepo.countByPost_Id(id);
        return Map.of("liked", liked, "count", count);
    }

    /* ---------- 댓글 ---------- */
    @PostMapping("/{board}/{id}/comments")
    @PreAuthorize("isAuthenticated()")
    public Map<String, Long> addComment(@PathVariable String board, @PathVariable Long id,
                                        @RequestBody CreateCommentReq req,
                                        Authentication auth) {
        validateBoard(board);
        if (req == null || req.content() == null || req.content().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "content는 필수입니다.");
        }
        String username = requireUsername(auth);
        Long cid = svc.addCommentByUsername(id, username, req);
        return Map.of("id", cid);
    }

    @PatchMapping("/{board}/{id}/comments/{commentId}")
    @PreAuthorize("isAuthenticated()")
    public void updateComment(@PathVariable String board, @PathVariable Long id,
                              @PathVariable Long commentId, @RequestBody Map<String, String> body,
                              Authentication auth) {
        validateBoard(board);
        String username = requireUsername(auth);
        String content = body.getOrDefault("content", "");
        svc.updateCommentByUsername(commentId, username, content);
    }

    @DeleteMapping("/{board}/{id}/comments/{commentId}")
    @PreAuthorize("isAuthenticated()")
    public void deleteComment(@PathVariable String board, @PathVariable Long id,
                              @PathVariable Long commentId, Authentication auth) {
        validateBoard(board);
        String username = requireUsername(auth);
        svc.deleteCommentByUsername(commentId, username);
    }
}
