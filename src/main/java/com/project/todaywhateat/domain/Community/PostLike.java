package com.project.todaywhateat.domain.Community;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name="post_likes")
@Getter
@Setter
@IdClass(PostLikeId.class)
public class PostLike {
    @Id @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name="post_id")
    private Post post;
    @Id private Long userId;
    @Column(nullable=false) private LocalDateTime createdAt = LocalDateTime.now();
}
