// com.project.todaywhateat.controller.CommunityPostController
package com.project.todaywhateat.controller;

import com.project.todaywhateat.service.CommunityPostService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/community")
public class CommunityPostController {

    private final CommunityPostService service;

    /** 멀티파트 업로드 전용 (JSON 작성과 같은 경로, consumes 로 구분) */
    @PostMapping(value = "/{board}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("isAuthenticated()")
    public Map<String, Long> createPostMultipart(
            @PathVariable String board,
            @RequestParam String title,
            @RequestParam String content,
            @RequestParam(required = false) String authorName,
            @RequestParam(required = false) Long recipeId,
            @RequestPart(required = false, name = "files") List<MultipartFile> files,
            Authentication auth
    ) {
        long id = service.create(board, title, content, authorName, recipeId, files, auth);
        return Map.of("id", id);
    }
}
