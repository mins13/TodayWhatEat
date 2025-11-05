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
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;
    private final UserRepository userRepository;

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain chain
    ) throws ServletException, IOException {

        // 1) 프리플라이트(OPTIONS)는 그냥 통과
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            chain.doFilter(request, response);
            return;
        }

        String token = null;

        // 2) 토큰 꺼내기 – 여기서 에러 나면 그냥 익명으로 진행
        try {
            token = jwtUtil.resolveToken(request);
        } catch (Exception e) {
            log.debug("JWT resolve 실패: {}", e.getMessage());
            SecurityContextHolder.clearContext();
            chain.doFilter(request, response);
            return;
        }

        // 3) 토큰이 없으면 인증 세팅 안 하고 그대로 진행
        if (token == null || token.isBlank()) {
            SecurityContextHolder.clearContext();
            chain.doFilter(request, response);
            return;
        }

        // 4) 토큰 검증 – ACCESS 토큰만 인정
        try {
            if (!jwtUtil.validateAccessToken(token)) {
                SecurityContextHolder.clearContext();
                chain.doFilter(request, response);
                return;
            }
        } catch (Exception e) {
            log.debug("JWT 검증 실패: {}", e.getMessage());
            SecurityContextHolder.clearContext();
            chain.doFilter(request, response);
            return;
        }

        // 5) 유저 조회 후 SecurityContext 에만 인증 세팅
        try {
            String username = jwtUtil.getUsername(token);

            User user = userRepository.findByUsername(username).orElse(null);
            if (user != null) {
                String role = "ROLE_" + user.getRole().toUpperCase();

                UsernamePasswordAuthenticationToken auth =
                        new UsernamePasswordAuthenticationToken(
                                username,
                                null,
                                List.of(new SimpleGrantedAuthority(role))
                        );

                SecurityContextHolder.getContext().setAuthentication(auth);
            } else {
                // 토큰은 맞는데 유저가 없으면 인증 클리어
                SecurityContextHolder.clearContext();
            }
        } catch (Exception e) {
            log.debug("JWT 인증 세팅 중 예외: {}", e.getMessage());
            SecurityContextHolder.clearContext();
        }

        // 6) 절대 여기서 response.setStatus(401/403) 같은 거 하지 않는다!!
        chain.doFilter(request, response);
    }
}
