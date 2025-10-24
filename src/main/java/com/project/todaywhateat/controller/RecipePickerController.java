// com.project.todaywhateat.controller.RecipePickerController
package com.project.todaywhateat.controller;

import com.project.todaywhateat.dto.RecipeSummaryDto;
import com.project.todaywhateat.repository.UserRepository;          // ⬅ 추가
import com.project.todaywhateat.repository.my.MyRecipeRepository;
import com.project.todaywhateat.repository.projection.MyRecipeSummaryProj;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.lang.reflect.Method;
import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/my/recipes")
public class RecipePickerController {

    private final MyRecipeRepository myRecipeRepository;
    private final UserRepository userRepository;   // ⬅ 추가

    @GetMapping("/summaries")
    @PreAuthorize("isAuthenticated()")
    public List<RecipeSummaryDto> myRecipeSummaries(Authentication auth) {
        Long userId = resolveUserId(auth);
        if (userId == null) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "로그인 사용자 ID를 확인할 수 없습니다."
            );
        }

        List<MyRecipeSummaryProj> rows = myRecipeRepository.findSummariesByUserId(userId);
        return rows.stream()
                .map(p -> new RecipeSummaryDto(p.getId(), p.getTitle(), p.getMainImageUrl()))
                .toList();
    }

    private Long resolveUserId(Authentication auth) {
        if (auth == null) return null;
        Object principal = auth.getPrincipal();

        // 1) 커스텀 principal.getId()
        try {
            Method m = principal.getClass().getMethod("getId");
            Object id = m.invoke(principal);
            Long v = toLongOrNull(id);
            if (v != null) return v;
        } catch (Exception ignored) {}

        // 2) JWT/OAuth2 claims
        Map<?,?> claims = tryGetMap(principal, "getClaims");
        if (claims == null) claims = tryGetMap(auth, "getTokenAttributes");
        if (claims == null && principal instanceof Map<?,?> m) claims = m;
        if (claims != null) {
            Long v = toLongOrNull(claims.get("id"));
            if (v == null) v = toLongOrNull(claims.get("userId"));
            if (v != null) return v;
        }

        // 3) 표준 UserDetails → username으로 DB 조회
        if (principal instanceof UserDetails ud) {
            return userRepository.findByUsername(ud.getUsername())
                    .map(u -> u.getId())
                    .orElse(null);
        }

        // 4) principal이 String(username) 인 경우 → 숫자면 그대로, 아니면 DB 조회
        if (principal instanceof String s) {
            Long v = toLongOrNull(s);
            if (v != null) return v;
            return userRepository.findByUsername(s)
                    .map(u -> u.getId())
                    .orElse(null);
        }

        // 5) auth.getName() 마지막 보정
        String name = auth.getName();
        Long v = toLongOrNull(name);
        if (v != null) return v;
        return userRepository.findByUsername(name)
                .map(u -> u.getId())
                .orElse(null);
    }

    private Map<?,?> tryGetMap(Object target, String methodName) {
        try {
            var m = target.getClass().getMethod(methodName);
            Object r = m.invoke(target);
            if (r instanceof Map<?,?> map) return map;
        } catch (Exception ignored) {}
        return null;
    }

    private Long toLongOrNull(Object o) {
        if (o == null) return null;
        if (o instanceof Number n) return n.longValue();
        if (o instanceof String s) {
            try { return Long.parseLong(s); } catch (NumberFormatException ignored) {}
        }
        return null;
    }
}
