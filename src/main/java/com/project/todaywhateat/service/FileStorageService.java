package com.project.todaywhateat.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDate;
import java.util.UUID;

@Service
public class FileStorageService {

    // 업로드 루트 디렉터리 (프로젝트 기준 /uploads)
    private final Path root = Paths.get("uploads").toAbsolutePath().normalize();

    // application.yml 에 server.servlet.context-path=/api 이런 식으로 들어가는 값
    @Value("${server.servlet.context-path:}")
    private String contextPath;

    /**
     * context-path 를 "/api" 형식으로 정리해서 돌려주는 헬퍼
     * - 설정이 없으면 "" 리턴
     */
    private String ctxPrefix() {
        if (contextPath == null || contextPath.isBlank() || "/".equals(contextPath)) {
            return "";
        }
        return contextPath.startsWith("/") ? contextPath : "/" + contextPath;
    }

    /**
     * 파일을 저장하고 브라우저에서 접근 가능한 URL을 반환
     * - context-path 가 "/api" 라면 "/api/files/연/월/파일명"
     * - context-path 가 없으면 "/files/연/월/파일명"
     */
    public String savePublic(MultipartFile mf) throws IOException {
        if (!Files.exists(root)) Files.createDirectories(root);

        LocalDate d = LocalDate.now();
        Path dir = root.resolve(Paths.get(
                String.valueOf(d.getYear()),
                String.format("%02d", d.getMonthValue())
        ));
        if (!Files.exists(dir)) Files.createDirectories(dir);

        String original = mf.getOriginalFilename();
        String ext = "";
        if (original != null) {
            int dot = original.lastIndexOf('.');
            if (dot >= 0) ext = original.substring(dot); // .png
        }
        // 확장자에 대문자/공백/한글 섞여도 안전하게
        ext = ext.replaceAll("[^\\w.]", "").toLowerCase();

        String filename = UUID.randomUUID().toString().replace("-", "") + ext;
        Path dest = dir.resolve(filename);
        try (InputStream in = mf.getInputStream()) {
            Files.copy(in, dest, StandardCopyOption.REPLACE_EXISTING);
        }

        // 🔥 컨텍스트패스까지 포함한 공개 URL
        String prefix = ctxPrefix(); // 예: "", "/api"
        String publicUrl = prefix + "/files/" + d.getYear() + "/"
                + String.format("%02d", d.getMonthValue()) + "/"
                + filename;

        return publicUrl;
    }

    /**
     * savePublic 로 저장된 파일을 조용히 삭제.
     * - url 이 null/blank 이면 무시
     * - 삭제 실패해도 예외를 던지지 않음
     *
     * 예시 입력:
     *   "/files/2025/11/abcd.png"
     *   "/api/files/2025/11/abcd.png"
     *   "http://localhost:8080/files/2025/11/abcd.png"
     *   "https://todaywhateat-production.up.railway.app/api/files/2025/11/abcd.png"
     */
    public void deleteQuietly(String url) {
        if (url == null || url.isBlank()) return;

        try {
            String pathPart = url;

            // 쿼리스트링 제거
            int q = pathPart.indexOf('?');
            if (q >= 0) {
                pathPart = pathPart.substring(0, q);
            }

            // 절대 URL이면 /files/ 기준으로 잘라내기
            if (pathPart.startsWith("http://") || pathPart.startsWith("https://")) {
                int idx = pathPart.indexOf("/files/");
                if (idx >= 0) {
                    pathPart = pathPart.substring(idx); // "/files/..." 또는 "/api/files/..."
                }
            }

            // 백슬래시 → 슬래시
            pathPart = pathPart.replace("\\", "/");

            // 🔥 context-path 제거: "/api/files/..." → "/files/..."
            String prefix = ctxPrefix(); // 예: "/api" 또는 ""
            if (!prefix.isEmpty() && pathPart.startsWith(prefix + "/")) {
                pathPart = pathPart.substring(prefix.length()); // "/files/..."
            }

            // 앞의 / 제거
            if (pathPart.startsWith("/")) {
                pathPart = pathPart.substring(1); // "files/..."
            }

            // 앞의 "files/" 제거 → 실제 로컬 경로 부분만 남김
            if (pathPart.startsWith("files/")) {
                pathPart = pathPart.substring("files/".length()); // "2025/11/abcd.png"
            }

            // uploads/2025/11/abcd.png
            Path target = root.resolve(pathPart).normalize();

            // 안전장치: root 밖이면 삭제 안 함
            if (!target.startsWith(root)) return;

            Files.deleteIfExists(target);
        } catch (Exception ignore) {
            // 실패해도 조용히 무시 (필요하면 로그 추가)
        }
    }
}
