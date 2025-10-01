package com.project.todaywhateat.service;

import com.project.todaywhateat.Specification.PostSpecs;
import com.project.todaywhateat.domain.Community.Board;
import com.project.todaywhateat.domain.Community.Comment;
import com.project.todaywhateat.domain.Community.Post;
import com.project.todaywhateat.domain.Community.PostLike;
import com.project.todaywhateat.dto.Community.*;
import com.project.todaywhateat.repository.Community.BoardRepo;
import com.project.todaywhateat.repository.Community.CommentRepo;
import com.project.todaywhateat.repository.Community.PostLikeRepo;
import com.project.todaywhateat.repository.Community.PostRepo;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class CommunityService {
    private final BoardRepo boardRepo;
    private final PostRepo postRepo;
    private final CommentRepo commentRepo;
    private final PostLikeRepo likeRepo;

    public PageResponse<PostListDto> list(String boardCode, String q, String sort, int page, int size){
        Board board = boardRepo.findByCode(boardCode)
                .orElseThrow(() -> notFound("board"));
        Pageable pageable = PageRequest.of(Math.max(0, page - 1), size, sortOf(sort));
        Specification<Post> spec = Specification.where(PostSpecs.inBoard(board))
                .and(PostSpecs.keyword(q));
        Page<Post> p = postRepo.findAll(spec, pageable);
        return new PageResponse<>(
                p.getContent().stream().map(PostListDto::from).toList(),
                p.getTotalElements()
        );
    }

    @Transactional
    public PostDetailDto getAndIncreaseView(String boardCode, Long id){
        Post post = findPost(boardCode, id);
        post.setViewsCount(post.getViewsCount() + 1);
        return PostDetailDto.from(post);
    }

    @Transactional
    public Long create(String boardCode, Long userId, CreatePostReq req){
        Board board = boardRepo.findByCode(boardCode).orElseThrow(() -> notFound("board"));
        Post p = new Post();
        p.setBoard(board);
        p.setUserId(userId);
        p.setAuthorName((req.authorName() == null || req.authorName().isBlank()) ? "익명" : req.authorName());
        p.setTitle(req.title());
        p.setContent(req.content());
        return postRepo.save(p).getId();
    }

    @Transactional
    public void update(String boardCode, Long id, Long userId, UpdatePostReq req){
        Post p = findPost(boardCode, id);
        if (p.getUserId() != null && !p.getUserId().equals(userId)) throw forbidden();
        p.setTitle(req.title());
        p.setContent(req.content());
    }

    @Transactional
    public void delete(String boardCode, Long id, Long userId){
        Post p = findPost(boardCode, id);
        if (p.getUserId() != null && !p.getUserId().equals(userId)) throw forbidden();
        postRepo.delete(p);
    }

    @Transactional
    public boolean toggleLike(String boardCode, Long id, Long userId){
        Post p = findPost(boardCode, id);
        boolean liked = likeRepo.existsByPostIdAndUserId(p.getId(), userId);
        if (liked) {
            likeRepo.deleteByPostIdAndUserId(p.getId(), userId);
            p.setLikesCount(Math.max(0, p.getLikesCount() - 1));
            return false;
        } else {
            PostLike pl = new PostLike();
            pl.setPost(p);
            pl.setUserId(userId);
            likeRepo.save(pl);
            p.setLikesCount(p.getLikesCount() + 1);
            return true;
        }
    }

    public PageResponse<CommentDto> listComments(Long postId, int page, int size){
        Page<Comment> p = commentRepo.findByPostIdOrderByCreatedAtDesc(
                postId, PageRequest.of(Math.max(0, page - 1), size)
        );
        return new PageResponse<>(
                p.getContent().stream().map(CommentDto::from).toList(),
                p.getTotalElements()
        );
    }

    @Transactional
    public Long addComment(Long postId, Long userId, CreateCommentReq req){
        Post post = postRepo.findById(postId).orElseThrow(() -> notFound("post"));
        Comment c = new Comment();
        c.setPost(post);
        c.setUserId(userId);
        c.setAuthorName((req.authorName() == null || req.authorName().isBlank()) ? "익명" : req.authorName());
        c.setContent(req.content());
        return commentRepo.save(c).getId();
    }

    @Transactional
    public void updateComment(Long commentId, Long userId, String content){
        Comment c = commentRepo.findById(commentId).orElseThrow(() -> notFound("comment"));
        if (c.getUserId() != null && !c.getUserId().equals(userId)) throw forbidden();
        c.setContent(content);
    }

    @Transactional
    public void deleteComment(Long commentId, Long userId){
        Comment c = commentRepo.findById(commentId).orElseThrow(() -> notFound("comment"));
        if (c.getUserId() != null && !c.getUserId().equals(userId)) throw forbidden();
        commentRepo.delete(c);
    }

    // ---------- helpers ----------
    private Post findPost(String boardCode, Long id){
        Board b = boardRepo.findByCode(boardCode).orElseThrow(() -> notFound("board"));
        Post p = postRepo.findById(id).orElseThrow(() -> notFound("post"));
        if (!p.getBoard().getId().equals(b.getId())) throw notFound("post");
        return p;
    }

    private Sort sortOf(String sort) {
        String key = (sort == null ? "latest" : sort).toLowerCase();
        return switch (key) {
            case "views" -> Sort.by(Sort.Order.desc("viewsCount"))
                    .and(Sort.by(Sort.Order.desc("likesCount")));
            case "likes" -> Sort.by(Sort.Order.desc("likesCount"))
                    .and(Sort.by(Sort.Order.desc("viewsCount")));
            default -> Sort.by(Sort.Order.desc("createdAt"));
        };
    }


    private ResponseStatusException notFound(String what){
        return new ResponseStatusException(HttpStatus.NOT_FOUND, what + " not found");
    }
    private ResponseStatusException forbidden(){
        return new ResponseStatusException(HttpStatus.FORBIDDEN, "forbidden");
    }



}
