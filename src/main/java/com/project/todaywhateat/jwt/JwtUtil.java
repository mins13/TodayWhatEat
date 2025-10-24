// com.project.todaywhateat.jwt.JwtUtil
package com.project.todaywhateat.jwt;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Component;

import java.security.Key;
import java.time.Duration;
import java.util.Date;

@Component
public class JwtUtil {

    // 32바이트 이상 (운영에선 환경변수/설정에서 주입 권장)
    private final Key key = Keys.hmacShaKeyFor("오늘뭐먹지오늘뭐먹지오늘뭐먹지오늘뭐먹지".getBytes());
    private final long expirationMs = 1000L * 60 * 60; // 1h

    /* ---------- 생성 ---------- */

    /** 기본 토큰: username + nickname */
    public String createToken(String username, String nickname) {
        return Jwts.builder()
                .setSubject(username)
                .claim("nickname", nickname)
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + expirationMs))
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();
    }

    /** 필요 시 userId까지 담는 버전(선택) */
    public String createToken(String username, String nickname, Long userId) {
        return Jwts.builder()
                .setSubject(username)
                .claim("nickname", nickname)
                .claim("id", userId) // 컨트롤러에서 바로 꺼내 쓸 수 있음
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + expirationMs))
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();
    }

    /* ---------- 파싱 공통 ---------- */

    private Jws<Claims> parse(String token) {
        // 시계 오차 허용(예: 서버간 clock skew)
        return Jwts.parserBuilder()
                .setSigningKey(key)
                .setAllowedClockSkewSeconds(Duration.ofMinutes(1).getSeconds())
                .build()
                .parseClaimsJws(token);
    }

    /* ---------- 추출 ---------- */

    public String getUsername(String token) {
        return parse(token).getBody().getSubject();
    }

    public String getNickname(String token) {
        return parse(token).getBody().get("nickname", String.class);
    }

    public Long getUserId(String token) {
        Object v = parse(token).getBody().get("id");
        if (v instanceof Number n) return n.longValue();
        if (v instanceof String s) {
            try { return Long.parseLong(s); } catch (NumberFormatException ignore) {}
        }
        return null;
    }

    /* ---------- 토큰 회수(헤더/쿠키 등) ---------- */

    public String resolveToken(HttpServletRequest request) {
        // 1) Authorization 헤더 (대소문자/따옴표/공백 보정)
        String h = request.getHeader("Authorization");
        if (h != null && !h.isBlank()) {
            String v = h.trim();
            if (v.startsWith("\"") && v.endsWith("\"")) v = v.substring(1, v.length() - 1);
            if (v.regionMatches(true, 0, "Bearer ", 0, 7)) v = v.substring(7).trim();
            if (!v.isBlank()) return v;
        }

        // 2) 관용 헤더도 허용
        String x = request.getHeader("X-Auth-Token");
        if (x != null && !x.isBlank()) return x.trim();
        String t = request.getHeader("Token");
        if (t != null && !t.isBlank()) return t.trim();

        // 3) 쿠키 (accessToken / token / authorization 등)
        if (request.getCookies() != null) {
            for (Cookie c : request.getCookies()) {
                String name = c.getName();
                if ("accessToken".equalsIgnoreCase(name)
                        || "token".equalsIgnoreCase(name)
                        || "authorization".equalsIgnoreCase(name)) {
                    String cv = c.getValue();
                    if (cv != null && !cv.isBlank()) return cv.trim();
                }
            }
        }

        // 4) (옵션) 쿼리 파라미터 지원
        String qp = request.getParameter("access_token");
        if (qp != null && !qp.isBlank()) return qp.trim();

        return null;
    }

    /* ---------- 검증 ---------- */

    public boolean validateToken(String token) {
        try {
            parse(token); // 예외 안 나면 유효
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }
}
