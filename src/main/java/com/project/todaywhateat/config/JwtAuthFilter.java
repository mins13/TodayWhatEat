// com.project.todaywhateat.config.JwtAuthFilter
package com.project.todaywhateat.config;

import com.project.todaywhateat.domain.User;
import com.project.todaywhateat.jwt.JwtUtil;
import com.project.todaywhateat.repository.UserRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

@Component
@RequiredArgsConstructor
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;
    private final UserRepository userRepository;

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain chain) throws ServletException, IOException {

        // 1) 프리플라이트는 절대 막지 않음 (CORS 헤더 붙도록 통과)
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            chain.doFilter(request, response);
            return;
        }

        // 2) 토큰 없으면 그대로 통과 (공개 GET, 프리플라이트 등)
        String token = null;
        try {
            token = jwtUtil.resolveToken(request);
        } catch (Exception ignore) {
            // 헤더 파싱 중 예외가 떠도 막지 않고 통과
            chain.doFilter(request, response);
            return;
        }

        if (token == null || token.isBlank()) {
            chain.doFilter(request, response);
            return;
        }

        // 3) 토큰 검증 실패해도 여기서 401 쓰지 말고 통과 (보호 리소스는 뒤에서 거절됨)
        try {
            if (!jwtUtil.validateToken(token)) {
                chain.doFilter(request, response);
                return;
            }
        } catch (Exception e) {
            SecurityContextHolder.clearContext();
            chain.doFilter(request, response);
            return;
        }

        // 4) 인증 성공 시 컨텍스트에만 심어줌
        try {
            String username = jwtUtil.getUsername(token);
            String role = userRepository.findByUsername(username)
                    .map(User::getRole)
                    .map(String::toUpperCase)
                    .orElse("USER");

            var auth = new UsernamePasswordAuthenticationToken(
                    username, null, List.of(new SimpleGrantedAuthority("ROLE_" + role))
            );
            SecurityContextHolder.getContext().setAuthentication(auth);
        } catch (Exception e) {
            // 사용자 조회 실패 등 – 인증만 비워두고 계속 진행
            SecurityContextHolder.clearContext();
        }

        chain.doFilter(request, response);
    }
}
