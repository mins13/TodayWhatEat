package com.project.todaywhateat.controller;

import com.project.todaywhateat.dto.my.MyRecipeRes;
import com.project.todaywhateat.dto.my.MyRecipeUpsertReq;
import com.project.todaywhateat.service.MyRecipeService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
@RestController
@RequestMapping("/api/my-recipes")
@RequiredArgsConstructor
public class MyRecipeController {
    private final MyRecipeService svc;

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public Page<MyRecipeRes> list(
            Authentication auth,
            @RequestParam(defaultValue="0") int page,
            @RequestParam(defaultValue="10") int size
    ){
        String principal = (auth != null ? auth.getName() : null);
        return svc.myList(principal, PageRequest.of(page, size));
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public MyRecipeRes get(
            Authentication auth,
            @PathVariable Long id
    ){
        String principal = (auth != null ? auth.getName() : null);
        return svc.get(id, principal);
    }

    @PostMapping
    @PreAuthorize("isAuthenticated()")
    public MyRecipeRes create(
            Authentication auth,
            @RequestBody MyRecipeUpsertReq req
    ){
        String principal = (auth != null ? auth.getName() : null);
        return svc.create(principal, req);
    }

    @PutMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public MyRecipeRes update(
            Authentication auth,
            @PathVariable Long id,
            @RequestBody MyRecipeUpsertReq req
    ){
        String principal = (auth != null ? auth.getName() : null);
        return svc.update(id, principal, req);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public void delete(
            Authentication auth,
            @PathVariable Long id
    ){
        String principal = (auth != null ? auth.getName() : null);
        svc.delete(id, principal);
    }
}
