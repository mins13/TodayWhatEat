package com.project.todaywhateat.support;

import com.project.todaywhateat.domain.User;
import com.project.todaywhateat.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class UserResolver {
    private final UserRepository userRepo;

    /** 숫자PK | username | email | nickname 아무거나 받아서 User로 변환 */
    public User resolve(String any) {
        if (any == null || any.isBlank())
            throw new EntityNotFoundException("user not found: (blank)");

        // username → email → nickname
        var u = userRepo.findByUsername(any)
                .or(() -> userRepo.findByEmail(any))
                .or(() -> userRepo.findByNickname(any));

        if (u.isPresent()) return u.get();

        // 숫자PK 시도
        try {
            return userRepo.findById(Long.parseLong(any))
                    .orElseThrow();
        } catch (NumberFormatException ignore) { /* not numeric */ }

        throw new EntityNotFoundException("user not found: " + any);
    }
}