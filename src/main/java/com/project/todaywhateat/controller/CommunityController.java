package com.project.todaywhateat.controller;

import com.project.todaywhateat.dto.Community.*;
import com.project.todaywhateat.repository.Community.PostLikeRepo;
import com.project.todaywhateat.service.CommunityService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
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


    private static final Set<String> ALLOWED_BOARDS = Set.of("free","recipe","info","notice");

    /* ---------- 공용 유틸 ---------- */
    private void validateBoard(String board) {
        if (!ALLOWED_BOARDS.contains(board)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "유효하지 않은 게시판입니다.");
        }
    }


    /**
     * Authentication에서 안전하게 userId 추출.
     * - 커스텀 UserDetails를 쓴다면 그 타입으로 캐스팅해서 getId()를 꺼내세요.
     * - 그렇지 않고 JWT subject가 숫자라면 parseLong 시도.
     * - 어떤 경우에도 못 얻으면 401 반환.
     */
    private String requireUsername(Authentication auth) {
        if (auth == null || auth.getName() == null || auth.getName().isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "로그인이 필요합니다.");
        }
        return auth.getName(); // JwtUtil.getUsername(token) 과 동일
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
        return svc.listComments(id, page, size, username);   // ← mine 포함
    }

    /* ---------- 상세(조회수 +1) ---------- */
    @GetMapping("/{board}/{id}")
    public PostDetailDto detail(@PathVariable String board,
                                @PathVariable Long id,
                                org.springframework.security.core.Authentication auth) {
        validateBoard(board);
        String username = (auth != null ? auth.getName() : null);
        return svc.getAndIncreaseView(board, id, username); // ✅ liked 포함해서 리턴
    }

    /* ---------- 작성 ---------- */
    @PostMapping("/{board}")
    @PreAuthorize("isAuthenticated()")
    public Map<String, Long> create(@PathVariable String board,
                                    @RequestBody CreatePostReq req,
                                    Authentication auth) {
        validateBoard(board);
        String username = requireUsername(auth);
        Long id = svc.createByUsername(board, username, req); // ← 신규 메서드
        return Map.of("id", id);
    }

    @PutMapping("/{board}/{id}")
    @PatchMapping("/{board}/{id}")
    @PreAuthorize("isAuthenticated()")
    public void update(@PathVariable String board, @PathVariable Long id,
                       @RequestBody UpdatePostReq req, Authentication auth) {
        validateBoard(board);
        String username = requireUsername(auth);
        svc.updateByUsername(board, id, username, req);
    }


    @DeleteMapping("/{board}/{id}")
    @PreAuthorize("isAuthenticated()")
    public void delete(@PathVariable String board, @PathVariable Long id, Authentication auth) {
        validateBoard(board);
        String username = requireUsername(auth);
        svc.deleteByUsername(board, id, username);            // ← 신규 메서드
    }

    @PostMapping("/{board}/{id}/like")
    @PreAuthorize("isAuthenticated()")
    public Map<String,Object> toggleLike(@PathVariable String board, @PathVariable Long id, Authentication auth) {
        String username = requireUsername(auth);
        boolean liked = svc.toggleLikeByUsername(board, id, username);
        long count = likeRepo.countByPost_Id(id); // repo에 메서드 있음
        return Map.of("liked", liked, "count", count);
    }

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
        Long cid = svc.addCommentByUsername(id, username, req); // ← 신규 메서드
        return Map.of("id", cid);
    }

    @PatchMapping("/{board}/{id}/comments/{commentId}")
    @PreAuthorize("isAuthenticated()")
    public void updateComment(@PathVariable String board, @PathVariable Long id,
                              @PathVariable Long commentId, @RequestBody Map<String,String> body,
                              Authentication auth) {
        validateBoard(board);
        String username = requireUsername(auth);
        String content = body.getOrDefault("content","");
        svc.updateCommentByUsername(commentId, username, content);     // ← 신규 메서드
    }

    @DeleteMapping("/{board}/{id}/comments/{commentId}")
    @PreAuthorize("isAuthenticated()")
    public void deleteComment(@PathVariable String board, @PathVariable Long id,
                              @PathVariable Long commentId, Authentication auth) {
        validateBoard(board);
        String username = requireUsername(auth);
        svc.deleteCommentByUsername(commentId, username);              // ← 신규 메서드
    }


}
