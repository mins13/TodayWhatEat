package com.project.todaywhateat.service;

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

    private final Path root = Paths.get("uploads").toAbsolutePath().normalize();

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

        // ★ 브라우저가 접근할 공개 URL(항상 슬래시로 시작, 백슬래시 금지)
        String publicUrl = "/files/" + d.getYear() + "/"
                + String.format("%02d", d.getMonthValue()) + "/"
                + filename;
        return publicUrl;
    }
}
