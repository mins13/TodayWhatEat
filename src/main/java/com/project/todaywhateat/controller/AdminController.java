package com.project.todaywhateat.controller;

import com.project.todaywhateat.domain.Community.Post;
import com.project.todaywhateat.domain.User;
import com.project.todaywhateat.domain.my.MyRecipe;
import com.project.todaywhateat.dto.Community.CommentDto;
import com.project.todaywhateat.dto.Community.PageResponse;
import com.project.todaywhateat.dto.admin.AdminPostDetailDto;
import com.project.todaywhateat.dto.admin.AdminPostDto;
import com.project.todaywhateat.dto.admin.AdminUserDto;
import com.project.todaywhateat.repository.Community.CommentRepo;
import com.project.todaywhateat.repository.Community.PostFileRepo;
import com.project.todaywhateat.repository.Community.PostRepo;
import com.project.todaywhateat.repository.UserRepository;
import com.project.todaywhateat.repository.my.MyRecipeRepository;
import com.project.todaywhateat.service.CommunityService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final UserRepository userRepo;
    private final PostRepo postRepo;
    private final CommentRepo commentRepo;
    private final CommunityService communityService;
    private final PostFileRepo postFileRepo;
    private final MyRecipeRepository myRecipeRepository;

    @GetMapping("/summary")
    public Map<String,Object> summary() {
        long users = userRepo.count();
        long posts = postRepo.count();
        return Map.of("users", users, "posts", posts);
    }

    @GetMapping("/users")
    public PageResponse<AdminUserDto> users(@RequestParam(defaultValue="1") int page,
                                            @RequestParam(defaultValue="10") int size,
                                            @RequestParam(defaultValue="") String q) {
        Pageable p = PageRequest.of(Math.max(0, page-1), size, Sort.by("id").descending());
        Page<User> pg = (q == null || q.isBlank())
                ? userRepo.findAll(p)
                : userRepo.findByUsernameContainingIgnoreCaseOrEmailContainingIgnoreCase(q, q, p);
        return new PageResponse<>(pg.map(AdminUserDto::from).getContent(), pg.getTotalElements());
    }

    @PatchMapping("/users/{id}/role")
    public void changeRole(@PathVariable Long id, @RequestBody Map<String,String> body) {
        var u = userRepo.findById(id).orElseThrow();
        u.setRole(body.getOrDefault("role","USER").toUpperCase());
        userRepo.save(u);
    }

    @PatchMapping("/users/{id}/ban")
    public void ban(@PathVariable Long id, @RequestBody Map<String,Boolean> body) {
        var u = userRepo.findById(id).orElseThrow();
        u.setBanned(Boolean.TRUE.equals(body.get("banned")));
        userRepo.save(u);
    }

    @GetMapping("/posts")
    public PageResponse<AdminPostDto> posts(@RequestParam(defaultValue="1") int page,
                                            @RequestParam(defaultValue="10") int size,
                                            @RequestParam(defaultValue="") String q) {
        Pageable p = PageRequest.of(Math.max(0, page-1), size, Sort.by("createdAt").descending());
        Page<Post> pg = (q == null || q.isBlank())
                ? postRepo.findAll(p)
                : postRepo.findByTitleContainingIgnoreCaseOrContentContainingIgnoreCase(q, q, p);
        return new PageResponse<>(pg.map(AdminPostDto::from).getContent(), pg.getTotalElements());
    }

    @DeleteMapping("/posts/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public void deletePost(@PathVariable Long id) {
        Post p = postRepo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        // 관리자니까 작성자 체크 없이 바로 삭제
        communityService.adminDeletePost(p.getBoard().getCode(), id);
    }
    /** 게시글 단건 (관리자 프리뷰용) */
    @GetMapping("/posts/{id}")
    public AdminPostDetailDto postDetail(@PathVariable Long id) {
        Post p = postRepo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));

        // 🔹 첨부 파일들
        var files = postFileRepo.findByPost_IdOrderByIdAsc(p.getId());

        // 🔹 나만의 레시피 (있을 때만)
        MyRecipe recipe = null;
        if (p.getRecipeId() != null) {
            recipe = myRecipeRepository.findById(p.getRecipeId()).orElse(null);
        }

        // 🔹 첨부 + 레시피까지 포함해서 DTO로 변환
        return AdminPostDetailDto.of(p, files, recipe);
    }
    /** 게시글 댓글 목록 (관리자 프리뷰용) */
    @GetMapping("/posts/{id}/comments")
    public PageResponse<CommentDto> postComments(@PathVariable Long id,
                                                 @RequestParam(defaultValue = "1") int page,
                                                 @RequestParam(defaultValue = "50") int size) {
        var pg = commentRepo.findByPostIdOrderByCreatedAtDesc(
                id, PageRequest.of(Math.max(0, page-1), size)
        );
        return new PageResponse<>(
                pg.getContent().stream()
                        .map(c -> CommentDto.from(c, false)) // 관리자 화면이니 mine 필요 없음
                        .toList(),
                pg.getTotalElements()
        );
    }

    /** 댓글 삭제 (관리자) */
    @DeleteMapping("/posts/{postId}/comments/{commentId}")
    public void deleteComment(@PathVariable Long postId, @PathVariable Long commentId) {
        // postId 검증(옵션): comment가 해당 post 의 것인지 확인하고 삭제해도 됨
        commentRepo.deleteById(commentId);
    }


}

