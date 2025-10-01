package com.project.todaywhateat.domain.Community;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name="posts")
@Getter
@Setter
public class Post {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name="board_id", nullable=false)
    private Board board;
    private Long userId; // nullable
    @Column(nullable=false, length=50)  private String authorName;
    @Column(nullable=false, length=200) private String title;
    @Lob @Column(nullable=false)        private String content;
    private int likesCount = 0;
    private int viewsCount = 0;
    @Column(nullable=false) private LocalDateTime createdAt = LocalDateTime.now();
    @Column(nullable=false) private LocalDateTime updatedAt = LocalDateTime.now();
    @PreUpdate
    void onUpdate(){ this.updatedAt = LocalDateTime.now(); }
}