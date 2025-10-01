package com.project.todaywhateat.domain.Community;

import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.Setter;

import java.io.Serializable;

@Getter
@Setter
@EqualsAndHashCode   // ✅ 꼭 필요
public class PostLikeId implements Serializable {
    private Long post;   // Post의 PK 타입(Long) - 엔티티의 @Id 필드명(post)와 동일
    private Long userId;
}
