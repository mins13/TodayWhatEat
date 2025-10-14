// com.project.todaywhateat.config.SecurityConfig
package com.project.todaywhateat.config;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;

    @Bean
    SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .cors(c -> c.configurationSource(corsConfigurationSource()))
                .csrf(csrf -> csrf.disable())
                .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        // ✅ CORS preflight는 모두 허용
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

                        // 관리자 전용
                        .requestMatchers("/api/admin/**").hasRole("ADMIN")

                        // 커뮤니티: GET은 공개, 그 외는 인증 필요
                        .requestMatchers(HttpMethod.GET, "/api/community/**").permitAll()
                        .requestMatchers("/api/community/**").authenticated()

                        // 나머지는 프로젝트 정책에 맞게
                        .anyRequest().permitAll()
                )
                // JWT 필터 등록
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();

        // ✅ 개발 프론트(포트 5173) 허용 — 배포 도메인 생기면 여기에 추가
        config.setAllowedOriginPatterns(List.of("http://localhost:5173"));

        // ✅ PUT 포함 (프리플라이트 대상)
        config.setAllowedMethods(List.of("GET","POST","PUT","PATCH","DELETE","OPTIONS"));

        // ✅ 모든 요청 헤더 허용 (Authorization, Content-Type 등)
        config.addAllowedHeader("*");

        // 쿠키를 안 쓰고 Bearer 토큰만 쓰면 false여도 OK (쿠키 쓰면 true)
        config.setAllowCredentials(false);

        // 프리플라이트 캐시(초)
        config.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}
