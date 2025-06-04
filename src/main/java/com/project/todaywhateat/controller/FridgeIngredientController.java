package com.project.todaywhateat.controller;

import com.project.todaywhateat.domain.FridgeIngredient;
import com.project.todaywhateat.jwt.JwtUtil;
import com.project.todaywhateat.service.FridgeIngredientService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/fridge")
@RequiredArgsConstructor
public class FridgeIngredientController {

    private final FridgeIngredientService fridgeIngredientService;
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

}
