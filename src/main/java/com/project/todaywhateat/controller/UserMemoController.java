// controller/UserMemoController.java
package com.project.todaywhateat.controller;

import com.project.todaywhateat.dto.memo.UserMemoDto;
import com.project.todaywhateat.repository.UserRepository;
import com.project.todaywhateat.service.UserMemoService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

@RestController
@RequestMapping("/api/memo")
@RequiredArgsConstructor
public class UserMemoController {

    private final UserMemoService svc;
    private final UserRepository userRepo; // 👈 추가

    /** 인증에서 username/email 을 꺼내 DB에서 userId를 조회 */
    private Long currentUserId(Authentication auth){
        if (auth == null || !auth.isAuthenticated()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "로그인이 필요합니다.");
        }
        String name = auth.getName(); // JWT subject 또는 로그인 아이디/이메일
        return userRepo.findByUsername(name)
                .or(() -> userRepo.findByEmail(name))      // 프로젝트에 맞게 둘 중 하나만 써도 됨
                .map(u -> u.getId())
                .orElseThrow(() ->
                        new ResponseStatusException(HttpStatus.UNAUTHORIZED, "사용자를 찾을 수 없습니다."));
    }

    @GetMapping
    public UserMemoDto get(Authentication auth){
        Long uid = currentUserId(auth);
        return svc.get(uid);
    }

    @PutMapping
    public UserMemoDto put(@RequestBody Map<String, String> body, Authentication auth){
        Long uid = currentUserId(auth);
        String content = body.getOrDefault("content", "");
        return svc.put(uid, content);
    }
}
