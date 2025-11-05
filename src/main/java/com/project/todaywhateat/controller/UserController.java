package com.project.todaywhateat.controller;

import com.project.todaywhateat.domain.User;
import com.project.todaywhateat.jwt.JwtUtil;
import com.project.todaywhateat.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletResponse;
import java.util.HashMap;
import java.util.Map;
@CrossOrigin(
        origins = "http://localhost:5173",   // 프론트 주소
        allowCredentials = "true"            // 🔥 쿠키/withCredentials 허용
)
@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;
    private final JwtUtil jwtUtil;

    @Autowired
    public UserController(UserService userService, JwtUtil jwtUtil) {
        this.userService = userService;
        this.jwtUtil = jwtUtil;
    }

    // 회원가입
    @PostMapping("/register")
    public User registerUser(@RequestBody User user) {
        return userService.register(user);
    }

    // 로그인: access 토큰 + refresh 토큰(쿠키)
    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> loginUser(
            @RequestBody User loginData,
            HttpServletResponse response
    ) {
        // 1) 유저 검증 (userService.login 안에서 username / password 체크한다고 가정)
        User user = userService.login(loginData.getUsername(), loginData.getPassword());

        // 2) access / refresh 발급
        String accessToken = jwtUtil.createAccessToken(
                user.getUsername(),
                user.getNickname(),
                user.getId()
        );
        String refreshToken = jwtUtil.createRefreshToken(user.getUsername());

        // 3) refresh 토큰을 HttpOnly 쿠키로 내려주기
        // 로그인 메서드 내부
        ResponseCookie refreshCookie = ResponseCookie.from("refreshToken", refreshToken)
                .httpOnly(true)
                .secure(true)           // 배포는 HTTPS니까 true 유지
                .sameSite("None")       // ★ cross-site 요청에서도 쿠키 전송
                .path("/api")
                .maxAge(60L * 60 * 24 * 7)
                .build();
        ;

        response.addHeader(HttpHeaders.SET_COOKIE, refreshCookie.toString());

        // 4) access 토큰 + 기타 정보는 JSON 응답
        Map<String, Object> body = new HashMap<>();
        body.put("accessToken", accessToken);
        body.put("nickname", user.getNickname());
        body.put("username", user.getUsername());
        body.put("role", user.getRole());
        body.put("userId", user.getId());

        return ResponseEntity.ok(body);
    }

    // access 토큰 재발급 (프론트에서 401 날 때 호출)
    @PostMapping("/refresh")
    public ResponseEntity<Map<String, String>> refreshAccessToken(
            @CookieValue(name = "refreshToken", required = false) String refreshToken
    ) {
        if (refreshToken == null || !jwtUtil.validateRefreshToken(refreshToken)) {
            // 프론트에서 여기 401 받으면 sessionStorage 비우고 로그인 페이지로 보내면 됨
            return ResponseEntity.status(401).build();
        }

        String username = jwtUtil.getUsername(refreshToken);

        // username으로 유저 다시 조회 (UserService에 이런 메서드 없으면 하나 만들어도 됨)
        User user = userService.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("회원이 존재하지 않습니다."));

        String newAccess = jwtUtil.createAccessToken(
                user.getUsername(),
                user.getNickname(),
                user.getId()
        );

        Map<String, String> body = new HashMap<>();
        body.put("accessToken", newAccess);

        return ResponseEntity.ok(body);
    }

    // 로그아웃: refresh 쿠키 삭제
    @PostMapping("/logout")
    public ResponseEntity<Void> logout(HttpServletResponse response) {
        ResponseCookie deleteCookie = ResponseCookie.from("refreshToken", "")
                .httpOnly(true)
                .secure(true)
                .sameSite("None")
                .path("/api")
                .maxAge(0)
                .build();

        response.addHeader(HttpHeaders.SET_COOKIE, deleteCookie.toString());
        return ResponseEntity.ok().build();
    }
}
