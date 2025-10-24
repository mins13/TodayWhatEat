// com.project.todaywhateat.config.SecurityConfig
package com.project.todaywhateat.config;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.factory.PasswordEncoderFactories;
import org.springframework.security.crypto.password.PasswordEncoder;
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
                        // CORS preflight
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

                        // ✅ 나만의 레시피 요약(모달) : 인증만 요구
                        .requestMatchers(HttpMethod.GET, "/api/my/recipes/summaries").authenticated()

                        // ✅ 나만의 레시피 CRUD : 인증 필요
                        .requestMatchers("/api/my-recipes/**").authenticated()

                        // 내 정보 API : 인증 필요
                        .requestMatchers("/api/users/me/**").authenticated()

                        // 관리자 전용
                        .requestMatchers("/api/admin/**").hasRole("ADMIN")

                        // 커뮤니티: GET 공개, 그 외 인증
                        .requestMatchers(HttpMethod.GET, "/api/community/**").permitAll()
                        .requestMatchers("/api/community/**").authenticated()

                        // 그 외 모두 허용(필요에 맞게 조정)
                        .anyRequest().permitAll()
                )
                // 인증 실패 시 401로 응답(403 대신) – 선택
                .exceptionHandling(e -> e
                        .authenticationEntryPoint((req, res, ex) -> res.sendError(401))
                )
                // JWT 필터
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    // 비밀번호 인코더
    @Bean
    public PasswordEncoder passwordEncoder() {
        var delegating = PasswordEncoderFactories.createDelegatingPasswordEncoder();
        var bcrypt = new BCryptPasswordEncoder();
        return new PasswordEncoder() {
            @Override public String encode(CharSequence raw) { return delegating.encode(raw); }
            @Override public boolean matches(CharSequence raw, String encoded) {
                if (encoded != null && encoded.startsWith("{")) return delegating.matches(raw, encoded);
                return bcrypt.matches(raw, encoded);
            }
        };
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOriginPatterns(List.of("http://localhost:5173"));
        config.setAllowedMethods(List.of("GET","POST","PUT","PATCH","DELETE","OPTIONS"));
        config.setAllowedHeaders(List.of("*"));   // Authorization 포함
        config.setAllowCredentials(false);        // 토큰은 헤더로 보내므로 false면 충분
        config.setMaxAge(3600L);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}
