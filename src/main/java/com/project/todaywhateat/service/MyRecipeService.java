package com.project.todaywhateat.service;

import com.project.todaywhateat.domain.User;
import com.project.todaywhateat.domain.my.MyRecipe;
import com.project.todaywhateat.domain.my.MyRecipeIngredient;
import com.project.todaywhateat.domain.my.MyRecipeStep;
import com.project.todaywhateat.dto.my.MyRecipeRes;
import com.project.todaywhateat.dto.my.MyRecipeUpsertReq;
import com.project.todaywhateat.repository.UserRepository;
import com.project.todaywhateat.repository.my.MyRecipeRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service @RequiredArgsConstructor
public class MyRecipeService {
    private final MyRecipeRepository repo;
    private final UserRepository userRepo;

    private User getUser(String principal) {
        // 1) 필요하면 보정(재할당 가능 변수)
        String p = principal;
        if (p == null || p.isBlank()) {
            var auth = SecurityContextHolder.getContext().getAuthentication();
            p = (auth != null ? auth.getName() : null);
        }

        log.info("AUTH principal={}", p);

        // 2) 람다에서 쓸 불변 키로 고정 (effectively final)
        final String key = p;
        if (key == null || key.isBlank()) {
            throw new AccessDeniedException("no principal");
        }

        // 3) username → email → nickname → numeric id
        return userRepo.findByUsername(key)
                .or(() -> userRepo.findByEmail(key))
                .or(() -> userRepo.findByNickname(key))
                .or(() -> {
                    try {
                        Long id = Long.parseLong(key);
                        return userRepo.findById(id);
                    } catch (NumberFormatException ignore) {
                        return java.util.Optional.empty();
                    }
                })
                .orElseThrow(() -> new EntityNotFoundException("user not found: " + key));
    }


    private void assertOwner(MyRecipe r, Long userId) {
        if (!r.getUser().getId().equals(userId)) throw new AccessDeniedException("not owner");
    }

    @Transactional
    public MyRecipeRes create(String username, MyRecipeUpsertReq req) {
        User u = getUser(username);
        MyRecipe r = new MyRecipe();
        r.setUser(u);
        apply(r, req);
        r.bindChildren();
        return toRes(repo.save(r));
    }

    @Transactional
    public MyRecipeRes update(Long id, String username, MyRecipeUpsertReq req) {
        User u = getUser(username);
        MyRecipe r = repo.findById(id).orElseThrow();
        assertOwner(r, u.getId());
        r.getIngredients().clear();
        r.getSteps().clear();
        apply(r, req);
        r.bindChildren();
        return toRes(r);
    }

    @Transactional(readOnly = true)
    public MyRecipeRes get(Long id, String username) {
        User u = getUser(username);
        MyRecipe r = repo.findById(id).orElseThrow();
        assertOwner(r, u.getId());
        return toRes(r);
    }

    @Transactional(readOnly = true)
    public Page<MyRecipeRes> myList(String username, Pageable pageable) {
        Long userId = getUser(username).getId();
        return repo.findByUser_IdOrderByUpdatedAtDesc(userId, pageable).map(this::toRes);
    }

    @Transactional
    public void delete(Long id, String username) {
        User u = getUser(username);
        MyRecipe r = repo.findById(id).orElseThrow();
        assertOwner(r, u.getId());
        repo.delete(r);
    }

    private void apply(MyRecipe r, MyRecipeUpsertReq req) {
        r.setTitle(req.title());
        r.setImageUrl(req.imageUrl());
        // r.setDescription(...); // 필요 시
        // r.setVisibility("PRIVATE");

        if (req.ingredients() != null) {
            int i = 1;
            for (var g : req.ingredients()) {
                var ig = new MyRecipeIngredient();
                ig.setName(g.name());
                ig.setQuantity(g.quantity());
                ig.setUnit(g.unit());
                ig.setSortOrder(g.sortOrder() != null ? g.sortOrder() : i++);
                ig.setRecipe(r);
                r.getIngredients().add(ig);
            }
        }
        if (req.steps() != null) {
            int s = 1;
            for (var st : req.steps()) {
                var step = new MyRecipeStep();
                step.setContent(st.content());
                step.setSortOrder(st.sortOrder() != null ? st.sortOrder() : s++);
                step.setRecipe(r);
                r.getSteps().add(step);
            }
        }
    }

    private MyRecipeRes toRes(MyRecipe r) {
        var ings = r.getIngredients().stream()
                .map(x -> new MyRecipeRes.IngredientRes(x.getId(), x.getName(), x.getQuantity(), x.getUnit(), x.getSortOrder()))
                .toList();
        var steps = r.getSteps().stream()
                .map(x -> new MyRecipeRes.StepRes(x.getId(), x.getContent(), x.getSortOrder()))
                .toList();
        return new MyRecipeRes(r.getId(), r.getTitle(), r.getImageUrl(), r.getVisibility(),
                ings, steps, r.getCreatedAt(), r.getUpdatedAt());
    }
}
