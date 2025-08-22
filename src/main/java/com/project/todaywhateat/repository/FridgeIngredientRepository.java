package com.project.todaywhateat.repository;

import com.project.todaywhateat.domain.FridgeIngredient;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate; // ✅ 이거 꼭 추가!
import java.util.List;

public interface FridgeIngredientRepository extends JpaRepository<FridgeIngredient, Long> {

    // 특정 사용자 재료 전체 조회
    List<FridgeIngredient> findByUserId(String userId);

    // 특정 재료 조건 삭제 (이름 + 유통기한 기준)
    void deleteByUserIdAndIngredientNameAndExpirationDate(String userId, String ingredientName, LocalDate expirationDate);

    // ✅ 소비용(FIFO): 미사용 재고만 유통기한→구매일→id 순
    List<FridgeIngredient> findByUserIdAndIngredientNameAndStatusOrderByExpirationDateAscPurchaseDateAscIdAsc(
            String userId, String ingredientName, FridgeIngredient.Status status
    );

    // 소비 대상: 아직 사용하지 않은 것만, 유통기한 빠른 순
    List<FridgeIngredient> findByUserIdAndIngredientNameAndUsedFalseOrderByExpirationDateAsc(
            String userId, String ingredientName
    );
}
