package com.project.todaywhateat.Specification;

import com.project.todaywhateat.domain.Community.Board;
import com.project.todaywhateat.domain.Community.Post;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;

import java.util.Optional;

public class PostSpecs {
    public static Specification<Post> inBoard(Board board) {
        return (root, cq, cb) -> cb.equal(root.get("board"), board);
    }
    public static Specification<Post> keyword(String q) {
        if (q == null || q.trim().isEmpty()) return (r, cq, cb) -> cb.conjunction();
        String like = "%" + q.trim().toLowerCase() + "%";
        return (root, cq, cb) -> cb.or(
                cb.like(cb.lower(root.get("title")), like),
                cb.like(cb.lower(root.get("content")), like)
        );
    }

    private Sort sortOf(String sort) {
        String key = Optional.ofNullable(sort).orElse("latest").toLowerCase();
        switch (key) {
            case "views": return Sort.by(Sort.Order.desc("viewsCount")).and(Sort.by(Sort.Order.desc("likesCount")));
            case "likes": return Sort.by(Sort.Order.desc("likesCount")).and(Sort.by(Sort.Order.desc("viewsCount")));
            case "latest":
            default:      return Sort.by(Sort.Order.desc("createdAt"));
        }
    }
}

