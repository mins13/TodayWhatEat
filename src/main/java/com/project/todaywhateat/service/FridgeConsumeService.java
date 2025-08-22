package com.project.todaywhateat.service;

import com.project.todaywhateat.domain.FridgeIngredient;
import com.project.todaywhateat.dto.request.ConsumeItem;
import com.project.todaywhateat.repository.FridgeIngredientRepository;
import jakarta.transaction.Transactional;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Objects;

@Service
@RequiredArgsConstructor
public class FridgeConsumeService {

    // ✅ 필드명 단일화
    private final FridgeIngredientRepository repo;

    /**
     * 레시피에서 여러 재료를 한 번에 차감(FIFO, 단위 일치)
     * - 남은 수량이 0이면 delete가 아니라 status=USED로 마킹
     * - 반환값: 최신 재고 스냅샷
     */
    @Transactional
    public List<FridgeIngredient> consume(String userId, List<ConsumeItem> items) {
        // 사용자 재고 전체 로딩
        List<FridgeIngredient> stock = repo.findByUserId(userId);

        for (ConsumeItem req : items) {
            String name = req.getName() == null ? "" : req.getName().trim();
            String unit = req.getUnit() == null ? "" : req.getUnit().trim();
            double need = req.getAmount();

            if (name.isEmpty() || need <= 0) continue;

            // 같은 이름(+단위)의 재고를 유통기한(FIFO) 오름차순
            List<FridgeIngredient> batches = stock.stream()
                    .filter(fi -> name.equals(fi.getIngredientName()))
                    .filter(fi -> unit.isEmpty() || unit.equals(fi.getUnit()))
                    .sorted(Comparator.comparing(
                            FridgeIngredient::getExpirationDate,
                            Comparator.nullsLast(Comparator.naturalOrder())))
                    .toList();

            for (FridgeIngredient fi : batches) {
                // 이미 사용완료면 스킵
                if (fi.getStatus() == FridgeIngredient.Status.USED) continue;

                double have = parseQty(fi.getQuantity());
                if (have <= 0) continue;

                double use = Math.min(have, need);
                double remain = round2(have - use);

                if (remain <= 1e-9) {
                    fi.setQuantity("0");
                    fi.setStatus(FridgeIngredient.Status.USED);
                    fi.setUsedAt(LocalDateTime.now());
                } else {
                    fi.setQuantity(doubleToStr(remain));
                }
                repo.save(fi);

                need = round2(need - use);
                if (need <= 1e-9) break;
            }
            // need > 0 이면 재고 부족 → 필요시 로그/알림
        }

        // 최신 상태 반환
        return repo.findByUserId(userId);
    }

    /* ---------- 단건(리스트에서 “사용 n개” / “사용완료” / “사용취소”) ---------- */

    @Getter @AllArgsConstructor
    public static class ConsumeOneResult {
        private Long id;
        private String name;
        private double usedNow;       // 이번 요청에서 실제 차감된 양
        private double newQuantity;   // 변경 후 보유량
        private String unit;
        private String status;        // "ACTIVE" | "USED"
    }

    @Transactional
    public ConsumeOneResult consumeOne(String userId, Long id, double amount) {
        var s = repo.findById(id).orElseThrow();
        if (!Objects.equals(s.getUserId(), userId)) throw new IllegalArgumentException("권한 없음");
        if (amount <= 0)
            return new ConsumeOneResult(s.getId(), s.getIngredientName(), 0, parseQty(s.getQuantity()), s.getUnit(), s.getStatus().name());

        if (s.getStatus() != FridgeIngredient.Status.ACTIVE) {
            // 이미 사용완료면 차감 불가
            return new ConsumeOneResult(s.getId(), s.getIngredientName(), 0, parseQty(s.getQuantity()), s.getUnit(), s.getStatus().name());
        }

        double have = parseQty(s.getQuantity());
        double used = Math.min(have, amount);
        double remain = round2(have - used);

        if (remain <= 1e-9) {
            s.setQuantity("0");
            s.setStatus(FridgeIngredient.Status.USED);
            s.setUsedAt(LocalDateTime.now());
            repo.save(s);
            return new ConsumeOneResult(s.getId(), s.getIngredientName(), used, 0, s.getUnit(), "USED");
        } else {
            s.setQuantity(doubleToStr(remain));
            repo.save(s);
            return new ConsumeOneResult(s.getId(), s.getIngredientName(), used, remain, s.getUnit(), "ACTIVE");
        }
    }

    @Transactional
    public ConsumeOneResult markUsed(String userId, Long id) {
        var s = repo.findById(id).orElseThrow();
        if (!Objects.equals(s.getUserId(), userId)) throw new IllegalArgumentException("권한 없음");
        if (s.getStatus() == FridgeIngredient.Status.USED)
            return new ConsumeOneResult(s.getId(), s.getIngredientName(), 0, parseQty(s.getQuantity()), s.getUnit(), "USED");

        s.setStatus(FridgeIngredient.Status.USED);
        s.setUsedAt(LocalDateTime.now());
        repo.save(s);
        return new ConsumeOneResult(s.getId(), s.getIngredientName(), 0, parseQty(s.getQuantity()), s.getUnit(), "USED");
    }

    @Transactional
    public ConsumeOneResult unuse(String userId, Long id) {
        var s = repo.findById(id).orElseThrow();
        if (!Objects.equals(s.getUserId(), userId)) throw new IllegalArgumentException("권한 없음");

        s.setStatus(FridgeIngredient.Status.ACTIVE);
        s.setUsedAt(null);
        repo.save(s);
        return new ConsumeOneResult(s.getId(), s.getIngredientName(), 0, parseQty(s.getQuantity()), s.getUnit(), "ACTIVE");
    }

    /* ------------------ 유틸 ------------------ */
    private static double parseQty(String q) {
        try { return q==null ? 0d : Double.parseDouble(q.trim()); }
        catch (Exception e) { return 0d; }
    }

    private static String doubleToStr(double v) {
        // 정수면 "3", 아니면 "3.5"
        if (Math.abs(v - Math.rint(v)) < 1e-9) return String.valueOf((long)Math.rint(v));
        return String.valueOf(v);
    }

    private static double round2(double v) { return Math.round(v * 100.0) / 100.0; }
}
