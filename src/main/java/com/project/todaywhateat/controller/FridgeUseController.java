// FridgeUseController.java
package com.project.todaywhateat.controller;

import com.project.todaywhateat.jwt.JwtUtil;
import com.project.todaywhateat.service.FridgeConsumeService;
import com.project.todaywhateat.service.FridgeConsumeService.ConsumeOneResult;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
@RestController
@RequestMapping({"/fridge", "/api/fridge"})
@RequiredArgsConstructor
public class FridgeUseController {

    private final JwtUtil jwtUtil;
    private final FridgeConsumeService consumeService;

    @PatchMapping("/consume-one")
    public ResponseEntity<ConsumeOneResult> consumeOne(@RequestBody Map<String, Object> body,
                                                       HttpServletRequest req) {
        String userId = jwtUtil.getUsername(jwtUtil.resolveToken(req)); // 사용자 식별자(문자열)
        Long id = Long.valueOf(String.valueOf(body.get("id")));
        double amount = Double.parseDouble(String.valueOf(body.get("amount")));
        return ResponseEntity.ok(consumeService.consumeOne(userId, id, amount));
    }

    @PatchMapping("/mark-used/{id}")
    public ResponseEntity<ConsumeOneResult> markUsed(@PathVariable Long id, HttpServletRequest req) {
        String userId = jwtUtil.getUsername(jwtUtil.resolveToken(req));
        return ResponseEntity.ok(consumeService.markUsed(userId, id));
    }

    // 추가된 부분만
    @PatchMapping("/restore-one")
    public ResponseEntity<ConsumeOneResult> restoreOne(@RequestBody Map<String, Object> body,
                                                       HttpServletRequest req) {
        String userId = jwtUtil.getUsername(jwtUtil.resolveToken(req));
        Long id = Long.valueOf(String.valueOf(body.get("id")));
        double amount = Double.parseDouble(String.valueOf(body.get("amount")));
        return ResponseEntity.ok(consumeService.restoreOne(userId, id, amount));
    }


}
