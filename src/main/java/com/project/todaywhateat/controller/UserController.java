package com.project.todaywhateat.controller;

import com.project.todaywhateat.domain.User;
import com.project.todaywhateat.jwt.JwtUtil;
import com.project.todaywhateat.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;

    @Autowired // 생성자 주입
    public UserController(UserService userService) {
        this.userService = userService;
    }

    // 회원가입
    @PostMapping("/register")
    public User registerUser(@RequestBody User user) {
        return userService.register(user);
    }

    @Autowired
    private JwtUtil jwtUtil;

    @PostMapping("/login")
    public Map<String, String> loginUser(@RequestBody User loginData) {
        User user = userService.login(loginData.getUsername(), loginData.getPassword());

        String token = jwtUtil.createToken(user.getUsername(), user.getNickname());

        Map<String, String> response = new HashMap<>();
        response.put("token", token);
        response.put("nickname", user.getNickname());
        return response;
    }

}
