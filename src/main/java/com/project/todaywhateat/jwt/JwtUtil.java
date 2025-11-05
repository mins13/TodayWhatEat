// com.project.todaywhateat.jwt.JwtUtil
package com.project.todaywhateat.jwt;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.time.Duration;
import java.util.Date;

@Component
public class JwtUtil {

    // 32바이트 이상 (운영에선 환경변수/설정에서 주입 권장)
    private final Key key =
            Keys.hmacShaKeyFor("오늘뭐먹지오늘뭐먹지오늘뭐먹지오늘뭐먹지".getBytes(StandardCharsets.UTF_8));

    // === 만료 시간 ===
    private static final long ACCESS_TOKEN_EXPIRE_MS  = 1000L * 60 * 15;        // 15분
    private static final long REFRESH_TOKEN_EXPIRE_MS = 1000L * 60 * 60 * 24 * 7; // 7일

    private static final String CLAIM_TYPE = "type";
    private static final String TYPE_ACCESS  = "ACCESS";
    private static final String TYPE_REFRESH = "REFRESH";

    /* ---------- 토큰 생성 공통 ---------- */

    private String buildToken(String username, String nickname, Long userId,
                              String type, long expireMs) {
        Date now = new Date();
        Date exp = new Date(now.getTime() + expireMs);

        JwtBuilder builder = Jwts.builder()
                .setSubject(username)
                .claim(CLAIM_TYPE, type)
                .setIssuedAt(now)
                .setExpiration(exp)
                .signWith(key, SignatureAlgorithm.HS256);

        if (nickname != null) {
            builder.claim("nickname", nickname);
        }
        if (userId != null) {
            builder.claim("id", userId);
        }
        return builder.compact();
    }

    /** ACCESS 토큰 (username + nickname + userId) */
    public String createAccessToken(String username, String nickname, Long userId) {
        return buildToken(username, nickname, userId, TYPE_ACCESS, ACCESS_TOKEN_EXPIRE_MS);
    }

    /** REFRESH 토큰 (username만 있으면 충분) */
    public String createRefreshToken(String username) {
        return buildToken(username, null, null, TYPE_REFRESH, REFRESH_TOKEN_EXPIRE_MS);
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

    private Claims getClaims(String token) {
        return parse(token).getBody();
    }

    /* ---------- 추출 ---------- */

    public String getUsername(String token) {
        return getClaims(token).getSubject();
    }

    public String getNickname(String token) {
        return getClaims(token).get("nickname", String.class);
    }

    public Long getUserId(String token) {
        Object v = getClaims(token).get("id");
        if (v instanceof Number n) return n.longValue();
        if (v instanceof String s) {
            try { return Long.parseLong(s); } catch (NumberFormatException ignore) {}
        }
        return null;
    }

    public String getTokenType(String token) {
        return getClaims(token).get(CLAIM_TYPE, String.class);
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

        // 3) 쿠키 (accessToken / token / authorization 등)  ← 여기에는 "ACCESS"만 넣을 계획
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

    private boolean validate(String token, String expectedType) {
        try {
            Claims claims = getClaims(token); // 여기서 만료/서명 체크 됨
            String type = claims.get(CLAIM_TYPE, String.class);
            if (expectedType != null && !expectedType.equals(type)) {
                return false;
            }
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }

    /** ACCESS 토큰용 검증 */
    public boolean validateAccessToken(String token) {
        return validate(token, TYPE_ACCESS);
    }

    /** REFRESH 토큰용 검증 */
    public boolean validateRefreshToken(String token) {
        return validate(token, TYPE_REFRESH);
    }
}
