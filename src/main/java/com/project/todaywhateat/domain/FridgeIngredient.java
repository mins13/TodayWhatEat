package com.project.todaywhateat.domain;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "fridge_ingredient")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FridgeIngredient {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private String userId;

    @Column(name = "ingredient_name", nullable = false)
    private String ingredientName;

    @Column(name = "category")
    private String category;

    @Column(name = "quantity", nullable = false)
    private String quantity;

    @Column(name = "unit", nullable = false)
    private String unit;

    @Column(name = "purchase_date")
    private LocalDate purchaseDate;

    @Column(name = "expiration_date")
    private LocalDate expirationDate;

    @Column(name = "color")
    private String color;

    @Column(name = "memo")
    private String memo;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    // ✅ 추가: 사용 상태 / 사용완료 시각
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private Status status = Status.ACTIVE;   // ACTIVE, USED

    @Column(name = "used", nullable = false)
    private boolean used = false;

    @Column(name = "used_at")
    private LocalDateTime usedAt;

    public enum Status { ACTIVE, USED }


}
