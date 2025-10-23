// controller/MeController.java
package com.project.todaywhateat.controller;

import com.project.todaywhateat.domain.User;
import com.project.todaywhateat.dto.user.*;
import com.project.todaywhateat.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class MeController {
    private final UserRepository userRepo;
    private final PasswordEncoder encoder;

    private User currentUser(Authentication auth){
        if (auth == null || !auth.isAuthenticated())
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "로그인이 필요합니다.");
        String name = auth.getName(); // username or email
        return userRepo.findByUsername(name)
                .or(() -> userRepo.findByEmail(name))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "사용자를 찾을 수 없습니다."));
    }

    @GetMapping("/me")
    public MeDto me(Authentication auth){
        var u = currentUser(auth);
        return new MeDto(u.getId(), u.getEmail(), u.getUsername(), u.getNickname());
    }

    @PutMapping("/me")
    public MeDto updateNickname(@RequestBody NicknameReq req, Authentication auth){
        var u = currentUser(auth);
        u.setNickname(req.getNickname() == null ? "" : req.getNickname().trim());
        userRepo.save(u);
        return new MeDto(u.getId(), u.getEmail(), u.getUsername(), u.getNickname());
    }

    @PutMapping("/me/password")
    public Object changePassword(@RequestBody ChangePasswordReq req, Authentication auth){
        var u = currentUser(auth);
        if (req.getCurrentPassword() == null || !encoder.matches(req.getCurrentPassword(), u.getPassword()))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "현재 비밀번호가 일치하지 않습니다.");
        if (req.getNewPassword() == null || req.getNewPassword().length() < 6)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "새 비밀번호는 6자 이상이어야 합니다.");

        u.setPassword(encoder.encode(req.getNewPassword()));
        userRepo.save(u);
        return java.util.Map.of("ok", true);
    }

    @DeleteMapping("/me")
    public Object deleteMe(Authentication auth){
        var u = currentUser(auth);
        userRepo.deleteById(u.getId());
        return java.util.Map.of("ok", true);
    }
}
