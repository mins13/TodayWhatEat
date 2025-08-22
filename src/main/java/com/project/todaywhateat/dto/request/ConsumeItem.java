package com.project.todaywhateat.dto.request;

import lombok.Getter;
import lombok.Setter;

@Getter @Setter
public class ConsumeItem {
    private String name;    // 재료명
    private double amount;  // 소비량
    private String unit;    // 단위
}