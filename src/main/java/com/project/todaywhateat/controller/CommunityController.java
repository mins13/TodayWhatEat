package com.project.todaywhateat.controller;

import com.project.todaywhateat.dto.Community.*;
import com.project.todaywhateat.service.CommunityService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/community")
@RequiredArgsConstructor
public class CommunityController {
    private final CommunityService svc;

    // 목록
    @GetMapping("/{board}")
    public PageResponse<PostListDto> list(
            @PathVariable String board,
            @RequestParam(defaultValue="") String query,
            @RequestParam(defaultValue="latest") String sort,
            @RequestParam(defaultValue="1") int page,
            @RequestParam(defaultValue="10") int size
    ){
        return svc.list(board, query, sort, page, size);
    }

    // 상세(조회수 +1)
    @GetMapping("/{board}/{id}")
    public PostDetailDto detail(@PathVariable String board, @PathVariable Long id){
        return svc.getAndIncreaseView(board, id);
    }

    // 작성
    @PostMapping("/{board}")
    @PreAuthorize("isAuthenticated()") // Security 설정 필요
    public Map<String, Long> create(@PathVariable String board, @RequestBody CreatePostReq req, Authentication auth){
        Long userId = (auth!=null)? Long.valueOf(auth.getName()) : null; // 커스텀 UserDetails에 맞춰 변경
        Long id = svc.create(board, userId, req);
        return Map.of("id", id);
    }

    // 수정/삭제
    @PatchMapping("/{board}/{id}")
    @PreAuthorize("isAuthenticated()")
    public void update(@PathVariable String board, @PathVariable Long id, @RequestBody UpdatePostReq req, Authentication auth){
        svc.update(board, id, Long.valueOf(auth.getName()), req);
    }

    @DeleteMapping("/{board}/{id}")
    @PreAuthorize("isAuthenticated()")
    public void delete(@PathVariable String board, @PathVariable Long id, Authentication auth){
        svc.delete(board, id, Long.valueOf(auth.getName()));
    }

    // 좋아요 토글
    @PostMapping("/{board}/{id}/like")
    @PreAuthorize("isAuthenticated()")
    public Map<String,Object> toggleLike(@PathVariable String board, @PathVariable Long id, Authentication auth){
        boolean liked = svc.toggleLike(board, id, Long.valueOf(auth.getName()));
        return Map.of("liked", liked);
    }

    // 댓글
    @GetMapping("/{board}/{id}/comments")
    public PageResponse<CommentDto> comments(@PathVariable String board, @PathVariable Long id,
                                             @RequestParam(defaultValue="1") int page, @RequestParam(defaultValue="20") int size){
        // board 코드는 검증만 하고 postId는 id 사용
        return svc.listComments(id, page, size);
    }

    @PostMapping("/{board}/{id}/comments")
    @PreAuthorize("isAuthenticated()")
    public Map<String,Long> addComment(@PathVariable String board, @PathVariable Long id,
                                       @RequestBody CreateCommentReq req, Authentication auth){
        Long cid = svc.addComment(id, Long.valueOf(auth.getName()), req);
        return Map.of("id", cid);
    }

    @PatchMapping("/{board}/{id}/comments/{commentId}")
    @PreAuthorize("isAuthenticated()")
    public void updateComment(@PathVariable String board, @PathVariable Long id,
                              @PathVariable Long commentId, @RequestBody Map<String,String> body, Authentication auth){
        svc.updateComment(commentId, Long.valueOf(auth.getName()), body.getOrDefault("content",""));
    }

    @DeleteMapping("/{board}/{id}/comments/{commentId}")
    @PreAuthorize("isAuthenticated()")
    public void deleteComment(@PathVariable String board, @PathVariable Long id,
                              @PathVariable Long commentId, Authentication auth){
        svc.deleteComment(commentId, Long.valueOf(auth.getName()));
    }
}
