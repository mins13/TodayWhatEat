package com.project.todaywhateat.domain.Community;

import lombok.Getter;
import lombok.Setter;

import java.io.Serializable;

@Getter
@Setter
public class PostLikeId implements Serializable {
    private Long post;  // matches field name in PostLike
    private Long userId;
}