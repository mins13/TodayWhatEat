package com.project.todaywhateat.service;

import com.project.todaywhateat.domain.User;
import com.project.todaywhateat.exception.DuplicateFieldException;
import com.project.todaywhateat.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@Service
public class UserService {

    private final UserRepository userRepository;

    @Autowired // 생성자 주입
    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    // 회원가입
    public User register(User user) {
        Map<String, String> errorMap = new HashMap<>();

        if (userRepository.existsByUsername(user.getUsername())) {
            errorMap.put("username", "이미 사용 중인 아이디입니다.");
        }

        if (userRepository.existsByEmail(user.getEmail())) {
            errorMap.put("email", "이미 사용 중인 이메일입니다.");
        }

        if (userRepository.existsByNickname(user.getNickname())) {
            errorMap.put("nickname", "이미 사용 중인 닉네임입니다.");
        }

        // 하나라도 오류가 있으면 예외 발생
        if (!errorMap.isEmpty()) {
            throw new DuplicateFieldException(errorMap);
        }

        return userRepository.save(user);
    }


    // 로그인
    public User login(String username, String password) {
        Optional<User> optionalUser = userRepository.findByUsername(username);
        if (optionalUser.isEmpty()) {
            throw new IllegalArgumentException("존재하지 않는 사용자입니다.");
        }
        User user = optionalUser.get();
        if (!user.getPassword().equals(password)) {
            throw new IllegalArgumentException("비밀번호가 일치하지 않습니다.");
        }
        return user;
    }

    // 사용자 정보 조회
    public Optional<User> findById(Long id) {
        return userRepository.findById(id);
    }
}
