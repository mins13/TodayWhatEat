package com.project.todaywhateat.domain.Community;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "post_files")
@Getter @Setter
public class PostFile {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "post_id", nullable = false)
    private Post post;

    @Column(nullable = false)
    private String url;          // 클라이언트가 접근할 공개 URL (/files/2025/10/uuid.jpg)

    private String filename;     // 원본 파일명
    private Long size;           // 바이트
    private Integer width;       // (선택)
    private Integer height;      // (선택)
}
