package com.project.todaywhateat.repository.projection;

public interface MyRecipeSummaryProj {
    Long getId();
    String getTitle();
    String getMainImageUrl(); // 컬럼 alias 로 채울 예정
}