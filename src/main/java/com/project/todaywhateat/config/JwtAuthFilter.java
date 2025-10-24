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
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {

        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            chain.doFilter(request, response);
            return;
        }

        String token;
        try {
            token = jwtUtil.resolveToken(request);
        } catch (Exception e) {
            chain.doFilter(request, response);
            return;
        }
        if (token == null || token.isBlank()) {
            chain.doFilter(request, response);
            return;
        }

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

        try {
            String username = jwtUtil.getUsername(token);
            String role = userRepository.findByUsername(username)
                    .map(User::getRole).map(String::toUpperCase).orElse("USER");

            var auth = new UsernamePasswordAuthenticationToken(
                    username, null, List.of(new SimpleGrantedAuthority("ROLE_" + role)));
            SecurityContextHolder.getContext().setAuthentication(auth);
        } catch (Exception e) {
            SecurityContextHolder.clearContext();
        }

        chain.doFilter(request, response);
    }


}
