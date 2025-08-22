package com.project.todaywhateat.domain;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class ConsumeRequest {
    private List<Item> items; // name, amount, unit
    @Getter @Setter public static class Item {
        private String name;
        private Double amount;
        private String unit;
    }
}
