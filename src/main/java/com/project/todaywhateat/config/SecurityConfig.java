// com.project.todaywhateat.config.SecurityConfig
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
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
//@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;

    @Bean
    SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                // 🔥 CORS 설정
                .cors(c -> c.configurationSource(corsConfigurationSource()))
                .csrf(csrf -> csrf.disable())
                .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        // CORS preflight
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

                        // 나머지는 허용
                        .anyRequest().permitAll()
                )
                // 인증 실패시 401
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

    // 🔥 CORS 핵심
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();

        // ① 허용 origin (로컬 + Vercel)
        //    allowedOrigins 대신 allowedOriginPatterns 를 쓰면 좀 더 안정적
        config.setAllowedOriginPatterns(List.of(
                "http://localhost:5173",
                "https://today-what-eat.vercel.app"
        ));

        // ② 메서드/헤더
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        // 헤더는 그냥 * 로 풀어주는 게 편하다
        config.setAllowedHeaders(List.of("*"));

        // ③ 쿠키/인증정보 허용
        config.setAllowCredentials(true);

        // ④ 브라우저에서 읽을 수 있는 헤더
        config.setExposedHeaders(List.of("Authorization", "Set-Cookie"));

        config.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}
