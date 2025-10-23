package com.project.todaywhateat.service;

import com.project.todaywhateat.domain.User;
import com.project.todaywhateat.exception.DuplicateFieldException;
import com.project.todaywhateat.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder; // ✅ SecurityConfig 의 빈 사용

    // 회원가입: 비밀번호 해시 저장
    public User register(User user) {
        Map<String, String> errorMap = new HashMap<>();

        if (userRepository.existsByUsername(user.getUsername())) errorMap.put("username", "이미 사용 중인 아이디입니다.");
        if (userRepository.existsByEmail(user.getEmail()))       errorMap.put("email", "이미 사용 중인 이메일입니다.");
        if (userRepository.existsByNickname(user.getNickname())) errorMap.put("nickname", "이미 사용 중인 닉네임입니다.");

        if (!errorMap.isEmpty()) throw new DuplicateFieldException(errorMap);

        // ✅ 반드시 해시로 저장
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        return userRepository.save(user);
    }

    // 로그인: 해시 검증 (+ 평문이면 즉시 업그레이드)
    public User login(String usernameOrEmail, String rawPassword) {
        Optional<User> optionalUser =
                userRepository.findByUsername(usernameOrEmail)
                        .or(() -> userRepository.findByEmail(usernameOrEmail));

        User user = optionalUser.orElseThrow(
                () -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "존재하지 않는 사용자입니다.")
        );

        String stored = user.getPassword();

        boolean matches;
        if (stored != null && (stored.startsWith("{") || stored.startsWith("$2a$"))) {
            // ✅ 해시 형태({bcrypt}..., $2a$...) → encoder로 검증
            matches = passwordEncoder.matches(rawPassword, stored);
        } else {
            // ❗ 과거 평문 저장된 계정 → 우선 평문 비교 후, 성공하면 해시로 업그레이드
            matches = rawPassword.equals(stored);
            if (matches) {
                user.setPassword(passwordEncoder.encode(rawPassword));
                userRepository.save(user); // 업그레이드 저장
            }
        }

        if (!matches) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "비밀번호가 일치하지 않습니다.");
        }
        return user;
    }

    public Optional<User> findById(Long id) {
        return userRepository.findById(id);
    }
}
