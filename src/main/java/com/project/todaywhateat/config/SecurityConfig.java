

// src/main/java/com/project/todaywhateat/config/SecurityConfig.java
package com.project.todaywhateat.config;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.factory.PasswordEncoderFactories;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfigurationSource;

//@EnableMethodSecurity
@Configuration
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;
    private final CorsConfigurationSource corsConfigurationSource; // 🔥 CorsConfig에서 주입

    @Bean
    SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                // ✅ CorsConfig 에서 만든 설정 사용
                .cors(c -> c.configurationSource(corsConfigurationSource))
                .csrf(csrf -> csrf.disable())
                .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

                        // 나만의 레시피 요약(모달) : 인증
                        .requestMatchers(HttpMethod.GET, "/api/my/recipes/summaries").authenticated()

                        // 나만의 레시피 CRUD : 인증
                        .requestMatchers("/api/my-recipes/**").authenticated()

                        // 내 정보 : 인증
                        .requestMatchers("/api/users/me/**").authenticated()

                        // 관리자
                        .requestMatchers("/api/admin/**").hasRole("ADMIN")

                        // 커뮤니티: GET 공개, 그 외 인증
                        .requestMatchers(HttpMethod.GET, "/api/community/**").permitAll()
                        .requestMatchers("/api/community/**").authenticated()

                        // 나머지는 일단 허용 (필요하면 나중에 조이기)
                        .anyRequest().permitAll()
                )
                .exceptionHandling(e -> e
                        .authenticationEntryPoint((req, res, ex) -> res.sendError(401))
                )
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

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
}
