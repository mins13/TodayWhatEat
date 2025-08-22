package com.project.todaywhateat.dto.response;

import java.time.LocalDate;
import java.util.List;

public record ConsumeResponse(
        List<Affected> affected, // 어떤 레코드가 얼마나 줄었는지/사용완료 되었는지
        List<Remain> remains     // 남은 재고 집계(나의 냉장고 갱신용)
) {
    public record Affected(Long id, String name, Double changed, String unit, boolean fullyUsed, LocalDate date) {}
    public record Remain(String name, Double amount, String unit) {}
}
