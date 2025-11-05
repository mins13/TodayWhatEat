// src/main/java/com/project/todaywhateat/config/CorsConfig.java
package com.project.todaywhateat.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
public class CorsConfig {

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration cfg = new CorsConfiguration();

        // ✅ 프론트 두 도메인 모두 허용
        cfg.setAllowedOriginPatterns(List.of(
                "http://localhost:5173",
                "https://today-what-eat.vercel.app"
        ));

        // 메서드 / 헤더
        cfg.setAllowedMethods(List.of("GET","POST","PUT","PATCH","DELETE","OPTIONS"));
        cfg.setAllowedHeaders(List.of("*"));

        // ✅ 쿠키 / withCredentials=true 쓰니까 true 필수
        cfg.setAllowCredentials(true);

        // (선택) 브라우저에서 읽을 수 있는 헤더
        cfg.setExposedHeaders(List.of("Authorization", "Set-Cookie"));

        cfg.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", cfg);
        return source;
    }
}
