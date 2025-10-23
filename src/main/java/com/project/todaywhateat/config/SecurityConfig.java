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
                        // ✅ CORS preflight 허용
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

                        // ✅ 내 정보 API는 인증 필요
                        .requestMatchers("/api/users/me/**").authenticated()

                        // 관리자 전용
                        .requestMatchers("/api/admin/**").hasRole("ADMIN")

                        // 커뮤니티: GET 공개, 그 외 인증
                        .requestMatchers(HttpMethod.GET, "/api/community/**").permitAll()
                        .requestMatchers("/api/community/**").authenticated()

                        // 나머지는 정책에 맞게
                        .anyRequest().permitAll()
                )
                // JWT 필터 등록
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    // ✅ 비밀번호 인코더 등록 (주입 에러 해결)
    @Bean
    public PasswordEncoder passwordEncoder() {
        PasswordEncoder delegating = PasswordEncoderFactories.createDelegatingPasswordEncoder(); // {bcrypt}...
        PasswordEncoder bcrypt = new BCryptPasswordEncoder(); // $2a$...

        return new PasswordEncoder() {
            @Override
            public String encode(CharSequence rawPassword) {
                // 새로 저장/변경은 {bcrypt} 접두사로 저장
                return delegating.encode(rawPassword);
            }
            @Override
            public boolean matches(CharSequence rawPassword, String encodedPassword) {
                if (encodedPassword != null && encodedPassword.startsWith("{")) {
                    // {bcrypt}..., {noop}... 등 접두사 있는 경우
                    return delegating.matches(rawPassword, encodedPassword);
                }
                // 접두사 없이 $2a$... 로 저장된 순수 BCrypt
                return bcrypt.matches(rawPassword, encodedPassword);
            }
        };
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOriginPatterns(List.of("http://localhost:5173"));
        config.setAllowedMethods(List.of("GET","POST","PUT","PATCH","DELETE","OPTIONS"));
        config.addAllowedHeader("*");
        config.setAllowCredentials(false);
        config.setMaxAge(3600L);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}
