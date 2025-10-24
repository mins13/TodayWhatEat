package com.project.todaywhateat.service.view;

import com.project.todaywhateat.dto.response.RecipeCardDto;
import com.project.todaywhateat.repository.RecipeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;          // ✅ import
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class RecipeListPageService {
    private final RecipeRepository repo;

    // 🔁 목록 전용 캐시로 분리
    @Cacheable(cacheNames = "recipe:list",
            key = "#sort + ':' + #page + ':' + #size")
    public Page<RecipeCardDto> getCards(String sort, int page, int size) {
        return repo.findCards(sort, PageRequest.of(Math.max(0, page - 1), size));
    }
}