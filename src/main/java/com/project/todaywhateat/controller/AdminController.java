package com.project.todaywhateat.controller;

import com.project.todaywhateat.domain.Community.Post;
import com.project.todaywhateat.domain.User;
import com.project.todaywhateat.dto.Community.PageResponse;
import com.project.todaywhateat.dto.admin.AdminPostDto;
import com.project.todaywhateat.dto.admin.AdminUserDto;
import com.project.todaywhateat.repository.Community.PostRepo;
import com.project.todaywhateat.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final UserRepository userRepo;
    private final PostRepo postRepo;

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
    public void deletePost(@PathVariable Long id) {
        postRepo.deleteById(id);
    }
}