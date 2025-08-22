package com.project.todaywhateat.service;

import com.project.todaywhateat.domain.FridgeIngredient;
import com.project.todaywhateat.dto.request.ConsumeItem;
import com.project.todaywhateat.dto.response.FridgeIngredientDto;
import com.project.todaywhateat.repository.FridgeIngredientRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FridgeIngredientService {

    private final FridgeIngredientRepository fridgeIngredientRepository;

    public FridgeIngredient save(
            String userId,
            String name,
            String category,
            String quantity,
            String unit,
            LocalDate purchaseDate,
            LocalDate expirationDate,
            String color,
            String memo
    ) {
        FridgeIngredient ingredient = FridgeIngredient.builder()
                .userId(userId)
                .ingredientName(name)
                .category(category)
                .quantity(quantity)
                .unit(unit)
                .purchaseDate(purchaseDate)
                .expirationDate(expirationDate)
                .color(color)
                .memo(memo)
                .createdAt(LocalDateTime.now())
                .build();

        return fridgeIngredientRepository.save(ingredient);
    }



    public List<FridgeIngredient> findByUser(String userId) {
        return fridgeIngredientRepository.findByUserId(userId);
    }

    @Transactional
    public void deleteIngredient(String userId, String ingredientName, LocalDate expirationDate) {
        fridgeIngredientRepository.deleteByUserIdAndIngredientNameAndExpirationDate(
                userId, ingredientName, expirationDate
        );
    }

    public FridgeIngredient saveOrUpdate(
            Long id,
            String userId,
            String name,
            String category,
            String quantity,
            String unit,
            LocalDate purchaseDate,
            LocalDate expirationDate,
            String color,
            String memo
    ) {
        // ✅ 백엔드 유효성 검사
        if (name == null || name.trim().isEmpty()) {
            throw new IllegalArgumentException("재료 이름은 필수입니다.");
        }
        if (purchaseDate == null) {
            throw new IllegalArgumentException("구매 날짜는 필수입니다.");
        }
        if (expirationDate == null) {
            throw new IllegalArgumentException("유통기한은 필수입니다.");
        }

        FridgeIngredient ingredient;

        if (id != null) {
            // 수정: 기존 항목 가져와서 덮어쓰기
            ingredient = fridgeIngredientRepository.findById(id)
                    .orElseThrow(() -> new IllegalArgumentException("해당 재료가 존재하지 않습니다: id=" + id));
        } else {
            // 새로 생성
            ingredient = new FridgeIngredient();
            ingredient.setCreatedAt(LocalDateTime.now());
        }

        // 공통 필드 세팅
        ingredient.setUserId(userId);
        ingredient.setIngredientName(name);
        ingredient.setCategory(category);
        ingredient.setQuantity(quantity);
        ingredient.setUnit(unit);
        ingredient.setPurchaseDate(purchaseDate);
        ingredient.setExpirationDate(expirationDate);
        ingredient.setColor(color);
        ingredient.setMemo(memo);

        return fridgeIngredientRepository.save(ingredient);
    }

    public List<FridgeIngredientDto> getIngredientsByUserId(String userId) {
        List<FridgeIngredient> ingredients = fridgeIngredientRepository.findByUserId(userId);
        return ingredients.stream()
                .map(FridgeIngredientDto::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional
    public void consume(String userId, List<ConsumeItem> items) {
        for (ConsumeItem item : items) {
            double need = item.getAmount();
            if (need <= 0) continue;

            // 유통기한 빠른 순으로 미사용 재고 찾기
            List<FridgeIngredient> stocks =
                    fridgeIngredientRepository
                            .findByUserIdAndIngredientNameAndUsedFalseOrderByExpirationDateAsc(userId, item.getName());

            for (FridgeIngredient stock : stocks) {
                if (need <= 0) break;

                double have = toNumber(stock.getQuantity()); // "30" -> 30.0
                // 단위가 다르면(예: g vs 개) 여기서 매핑/변환 로직이 필요합니다. (현재는 동일 단위 가정)
                if (have <= 0) {
                    stock.setUsed(true);
                    stock.setUsedAt(LocalDateTime.now());
                    continue;
                }

                double consume = Math.min(have, need);
                double remain = have - consume;

                stock.setQuantity(numberToString(remain)); // 다시 문자열로 저장

                if (remain <= 0.0000001) { // 거의 0
                    stock.setUsed(true);
                    stock.setUsedAt(LocalDateTime.now());
                }

                need -= consume;
            }

            // 남았는데 재고가 더 없으면: 그대로 넘어감(알림만)
            if (need > 0) {
                // 로그/알림: 재고 부족
                // log.warn("재고 부족: {} {} 부족량={}", item.getName(), item.getUnit(), need);
            }
        }
    }

    private double toNumber(String s) {
        try {
            return Double.parseDouble(s == null ? "0" : s.trim());
        } catch (Exception e) {
            return 0;
        }
    }

    private String numberToString(double v) {
        // 정수면 5, 소수면 5.5 형태로 저장
        if (Math.abs(v - Math.round(v)) < 1e-9) return String.valueOf((long) Math.round(v));
        return String.valueOf(v);
    }
}
