package com.project.todaywhateat.controller;

import com.project.todaywhateat.service.FridgeConsumeService;
import com.project.todaywhateat.service.FridgeConsumeService.ConsumeOneResult;
import com.project.todaywhateat.jwt.JwtUtil;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
@RestController
@RequestMapping("/api/fridge") // ★ 프론트와 동일 프리픽스
@RequiredArgsConstructor
public class FridgeUseController {

    private final JwtUtil jwtUtil;
    private final FridgeConsumeService consumeService;

    @PatchMapping("/consume-one")
    public ResponseEntity<ConsumeOneResult> consumeOne(@RequestBody Map<String, Object> body,
                                                       HttpServletRequest request) {
        String token = jwtUtil.resolveToken(request);
        String userId = jwtUtil.getUsername(token);

        Long id = Long.valueOf(String.valueOf(body.get("id")));
        double amount = Double.parseDouble(String.valueOf(body.get("amount")));

        return ResponseEntity.ok(consumeService.consumeOne(userId, id, amount));
    }

    @PatchMapping("/mark-used/{id}")
    public ResponseEntity<ConsumeOneResult> markUsed(@PathVariable Long id, HttpServletRequest request) {
        String userId = jwtUtil.getUsername(jwtUtil.resolveToken(request));
        return ResponseEntity.ok(consumeService.markUsed(userId, id));
    }

    @PatchMapping("/unuse/{id}")
    public ResponseEntity<ConsumeOneResult> unuse(@PathVariable Long id, HttpServletRequest request) {
        String userId = jwtUtil.getUsername(jwtUtil.resolveToken(request));
        return ResponseEntity.ok(consumeService.unuse(userId, id));
    }
}