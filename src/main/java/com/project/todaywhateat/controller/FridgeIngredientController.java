package com.project.todaywhateat.controller;

import com.project.todaywhateat.domain.FridgeIngredient;
import com.project.todaywhateat.dto.request.ConsumeRequest;
import com.project.todaywhateat.dto.response.FridgeIngredientDto;
import com.project.todaywhateat.jwt.JwtUtil;
import com.project.todaywhateat.service.FridgeConsumeService;
import com.project.todaywhateat.service.FridgeIngredientService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
@RestController
@RequestMapping("/fridge")
@RequiredArgsConstructor
public class FridgeIngredientController {

    private final FridgeIngredientService fridgeIngredientService;
    private final FridgeConsumeService fridgeConsumeService;
    private final JwtUtil jwtUtil;

    @PostMapping("/save")
    public FridgeIngredient saveIngredient(@RequestBody Map<String, String> requestData,
                                           HttpServletRequest request) {
        String token = jwtUtil.resolveToken(request);
        String userId = jwtUtil.getUsername(token);

        // 🔹 추가: id가 있으면 수정
        Long id = null;
        if (requestData.containsKey("id")) {
            String idStr = requestData.get("id");
            if (idStr != null && !idStr.isBlank()) {
                try {
                    id = Long.parseLong(idStr);
                } catch (NumberFormatException e) {
                    System.out.println("⚠️ ID 파싱 실패: " + idStr);
                    // id는 null로 둠 (신규 저장 처리)
                }
            }
        }

        String ingredientName = requestData.get("ingredientName");
        String category = requestData.get("category");
        String quantity = requestData.get("quantity");
        String unit = requestData.get("unit");
        String color = requestData.get("color");
        String memo = requestData.get("memo");

        LocalDate purchaseDate = LocalDate.parse(requestData.get("purchaseDate"));
        LocalDate expirationDate = LocalDate.parse(requestData.get("expirationDate"));

        return fridgeIngredientService.saveOrUpdate(
                id, userId, ingredientName, category, quantity, unit,
                purchaseDate, expirationDate, color, memo
        );
    }

    @GetMapping("/list")
    public List<FridgeIngredient> getMyIngredients(HttpServletRequest request) {
        String token = jwtUtil.resolveToken(request);
        String userId = jwtUtil.getUsername(token);
        return fridgeIngredientService.findByUser(userId);
    }

    @DeleteMapping("/delete")
    public void deleteIngredient(@RequestBody Map<String, String> requestData,
                                 HttpServletRequest request) {
        String token = jwtUtil.resolveToken(request);
        String userId = jwtUtil.getUsername(token);

        String ingredientName = requestData.get("ingredientName");
        String expirationDateStr = requestData.get("expirationDate");

        LocalDate expirationDate = LocalDate.parse(expirationDateStr);

        System.out.println("🗑️ 삭제 요청:");
        System.out.println(" - userId: " + userId);
        System.out.println(" - ingredientName: " + ingredientName);
        System.out.println(" - expirationDate: " + expirationDate);

        fridgeIngredientService.deleteIngredient(userId, ingredientName, expirationDate);
    }
    @GetMapping("/user/{userId}")
    public List<FridgeIngredientDto> getUserIngredients(@PathVariable String userId) {
        return fridgeIngredientService.getIngredientsByUserId(userId);
    }

    @PatchMapping("/consume")
    public ResponseEntity<?> consume(@RequestBody ConsumeRequest req, HttpServletRequest request) {
        String token = jwtUtil.resolveToken(request); // 쿠키 or Authorization 헤더
        if (token == null || token.isBlank()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "No token"));
        }
        String userId = jwtUtil.getUsername(token);

        // 실제 차감 로직 호출
        var result = fridgeConsumeService.consume(userId, req.items());

        return ResponseEntity.ok(Map.of(
                "ok", true,
                "updated", result // 원한다면 최신 재고 목록/요약 반환
        ));
    }



    @PatchMapping("/mark-used")
    public ResponseEntity<?> markUsed(@RequestBody Map<String, String> body,
                                      HttpServletRequest request) {
        String token = jwtUtil.resolveToken(request);
        if (token == null || token.isBlank()) return ResponseEntity.status(401).body(Map.of("message","No token"));
        String userId = jwtUtil.getUsername(token);

        Long id = Long.parseLong(body.get("id"));
        var dto = fridgeConsumeService.markUsed(userId, id);
        return ResponseEntity.ok(dto);
    }





}
