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
        List<FridgeIngredient> stock = repo.findByUserId(userId);

        for (ConsumeItem req : items) {
            String name = norm(req.getName());   // 공백/대소문자 정규화
            String unit = norm(req.getUnit());
            double need = req.getAmount();
            if (name.isEmpty() || need <= 0) continue;

            // 이름(+단위) 매칭 (FIFO)
            List<FridgeIngredient> batches = stock.stream()
                    .filter(fi -> norm(fi.getIngredientName()).equals(name))
                    .filter(fi -> unit.isEmpty() || norm(fi.getUnit()).equals(unit))
                    .sorted(Comparator.comparing(
                            FridgeIngredient::getExpirationDate,
                            Comparator.nullsLast(Comparator.naturalOrder())))
                    .toList();

            // 단위 무시 재시도
            if (batches.isEmpty() && !unit.isEmpty()) {
                batches = stock.stream()
                        .filter(fi -> norm(fi.getIngredientName()).equals(name))
                        .sorted(Comparator.comparing(
                                FridgeIngredient::getExpirationDate,
                                Comparator.nullsLast(Comparator.naturalOrder())))
                        .toList();
            }

            // 매칭이 없으면 에러 발생 (없음으로 처리)
            if (batches.isEmpty()) {
                throw new IllegalArgumentException("냉장고에 해당 재료가 없습니다: " + req.getName());
            }

            double needBefore = need;

            for (FridgeIngredient fi : batches) {
                double have = parseQty(fi.getQuantity());
                if (have <= 0) continue; // 0은 건너뜀

                // ✅ 수량 > 0 인데 상태가 USED면 복구 후 진행
                if (fi.getStatus() == FridgeIngredient.Status.USED) {
                    fi.setStatus(FridgeIngredient.Status.ACTIVE);
                    fi.setUsedAt(null);
                    repo.save(fi);
                }

                // 여기부터 정상 차감
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


            // 차감이 안 된 경우(수량 부족 등) 에러
            if (Math.abs(needBefore - need) < 1e-9) {
                if (needBefore == 0) {
                    throw new IllegalArgumentException("냉장고에 해당 재료가 없습니다: " + req.getName());
                } else {
                    throw new IllegalStateException("재고 수량이 부족합니다: " + req.getName());
                }
            }
        }
        return repo.findByUserId(userId);
    }




    // 공백 제거 + 소문자화
    private static String norm(String s) {
        if (s == null) return "";
        return s.replaceAll("\\s+", "").toLowerCase();
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
        FridgeIngredient s = repo.findById(id).orElseThrow();
        if (!Objects.equals(s.getUserId(), userId)) {
            throw new IllegalArgumentException("권한 없음");
        }
        if (amount <= 0) {
            return new ConsumeOneResult(s.getId(), s.getIngredientName(),
                    0, parseQty(s.getQuantity()), s.getUnit(), s.getStatus().name());
        }

        double have = parseQty(s.getQuantity());

        // ✅ 자동 재활성: 수량은 있는데 USED면 ACTIVE로 되돌리고 계속 진행
        if (have > 0 && s.getStatus() == FridgeIngredient.Status.USED) {
            s.setStatus(FridgeIngredient.Status.ACTIVE);
            s.setUsedAt(null);
            repo.save(s);
        }

        // ❌ 기존의 "ACTIVE가 아니면 바로 리턴"은 제거/변경
        // if (s.getStatus() != FridgeIngredient.Status.ACTIVE) {
        //     return new ConsumeOneResult(...);  ← 이 early-return 막기
        // }

        double used = Math.min(have, amount);
        double remain = round2(have - used);

        if (remain <= 1e-9) {
            s.setQuantity("0");
            s.setStatus(FridgeIngredient.Status.USED);
            s.setUsedAt(LocalDateTime.now());
            repo.save(s);
            return new ConsumeOneResult(s.getId(), s.getIngredientName(),
                    used, 0, s.getUnit(), "USED");
        } else {
            s.setQuantity(doubleToStr(remain));
            repo.save(s);
            return new ConsumeOneResult(s.getId(), s.getIngredientName(),
                    used, remain, s.getUnit(), "ACTIVE");
        }


    }

    @Transactional
    public ConsumeOneResult markUsed(String userId, Long id) {
        FridgeIngredient s = repo.findById(id).orElseThrow();
        if (!Objects.equals(s.getUserId(), userId)) throw new IllegalArgumentException("권한 없음");

        // 핵심: 수량도 0으로
        s.setQuantity("0");
        s.setStatus(FridgeIngredient.Status.USED);
        s.setUsedAt(LocalDateTime.now());
        repo.save(s);

        return new ConsumeOneResult(s.getId(), s.getIngredientName(),
                0, 0, s.getUnit(), "USED");
    }

    // ✅ USED여도 복구 가능하도록 허용
    // 추가된 부분만
    @Transactional
    public ConsumeOneResult restoreOne(String userId, Long id, double amount) {
        FridgeIngredient s = repo.findById(id).orElseThrow();
        if (!Objects.equals(s.getUserId(), userId)) throw new IllegalArgumentException("권한 없음");
        if (amount <= 0) {
            return new ConsumeOneResult(s.getId(), s.getIngredientName(),
                    0, parseQty(s.getQuantity()), s.getUnit(), s.getStatus().name());
        }

        double cur = parseQty(s.getQuantity());
        double next = round2(cur + amount);

        s.setQuantity(doubleToStr(next));
        // 복구하면 언제나 ACTIVE
        s.setStatus(FridgeIngredient.Status.ACTIVE);
        s.setUsedAt(null);
        repo.save(s);

        return new ConsumeOneResult(s.getId(), s.getIngredientName(),
                0, next, s.getUnit(), "ACTIVE");
    }



    // -------- utils --------
    private static double parseQty(String q) {
        try { return q==null ? 0d : Double.parseDouble(q.trim()); }
        catch (Exception e) { return 0d; }
    }
    private static String doubleToStr(double v) {
        if (Math.abs(v - Math.rint(v)) < 1e-9) return String.valueOf((long)Math.rint(v));
        return String.valueOf(v);
    }
    private static double round2(double v) { return Math.round(v * 100.0) / 100.0; }


}




