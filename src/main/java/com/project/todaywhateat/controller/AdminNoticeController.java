package com.project.todaywhateat.controller;

import com.project.todaywhateat.domain.Community.Board;
import com.project.todaywhateat.domain.Community.Post;
import com.project.todaywhateat.dto.Community.PageResponse;
import com.project.todaywhateat.dto.admin.notice.NoticeAdminDto;
import com.project.todaywhateat.dto.admin.notice.NoticeDetailDto;
import com.project.todaywhateat.dto.admin.notice.NoticeIdDto;
import com.project.todaywhateat.dto.admin.notice.NoticeUpsertDto;
import com.project.todaywhateat.repository.Community.BoardRepo;
import com.project.todaywhateat.repository.Community.PostRepo;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/notices")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminNoticeController {

    private final PostRepo postRepo;
    private final BoardRepo boardRepo;

    private static final String NOTICE_BOARD = "notice";

    /** 목록 (제목/내용 검색) */
    @GetMapping
    public PageResponse<NoticeAdminDto> list(@RequestParam(defaultValue = "0") int page,
                                             @RequestParam(defaultValue = "10") int size,
                                             @RequestParam(defaultValue = "") String query) {
        Pageable p = PageRequest.of(
                Math.max(0, page),
                size,
                Sort.by(Sort.Order.desc("pinned"), Sort.Order.desc("id"))
        );

        Page<Post> pg = (query == null || query.isBlank())
                ? postRepo.findByBoard_Code(NOTICE_BOARD, p)
                : postRepo.searchByBoardAndTitleOrContent(NOTICE_BOARD, query, p);

        return new PageResponse<>(
                pg.map(NoticeAdminDto::from).getContent(),
                pg.getTotalElements()
        );
    }

    /** 단건 상세 (수정 모달 오픈용) */
    @GetMapping("/{id}")
    public NoticeDetailDto get(@PathVariable Long id) {
        Post p = postRepo.findById(id).orElseThrow();
        if (!NOTICE_BOARD.equals(p.getBoard().getCode())) {
            throw new IllegalArgumentException("공지 게시물이 아닙니다.");
        }
        return NoticeDetailDto.from(p);
    }

    /** 생성 */
    @PostMapping
    @Transactional
    public NoticeIdDto create(@RequestBody NoticeUpsertDto dto) {
        if (dto.title() == null || dto.title().isBlank()) {
            throw new IllegalArgumentException("제목은 필수입니다.");
        }
        if (dto.content() == null || dto.content().isBlank()) {
            throw new IllegalArgumentException("내용은 필수입니다.");
        }

        Board board = boardRepo.findByCode(NOTICE_BOARD).orElseThrow();

        Post p = new Post();
        p.setBoard(board);
        p.setTitle(dto.title().trim());
        p.setContent(dto.content().trim());
        p.setAuthorName("관리자");
        p.setLikesCount(0);
        p.setViewsCount(0);
        // 커뮤니티 공지에는 상단고정 기능이 없어 항상 false 로 저장
        p.setPinned(false);

        postRepo.save(p);
        return new NoticeIdDto(p.getId());
    }

    /** 수정 */
    @PutMapping("/{id}")
    @Transactional
    public void update(@PathVariable Long id, @RequestBody NoticeUpsertDto dto) {
        Post p = postRepo.findById(id).orElseThrow();
        if (!NOTICE_BOARD.equals(p.getBoard().getCode())) {
            throw new IllegalArgumentException("공지 게시물이 아닙니다.");
        }
        if (dto.title() == null || dto.title().isBlank()) {
            throw new IllegalArgumentException("제목은 필수입니다.");
        }
        if (dto.content() == null || dto.content().isBlank()) {
            throw new IllegalArgumentException("내용은 필수입니다.");
        }

        p.setTitle(dto.title().trim());
        p.setContent(dto.content().trim());
        // 고정 미지원
        p.setPinned(Boolean.TRUE.equals(dto.pinned()));

        postRepo.save(p);
    }

    /** 삭제 */
    @DeleteMapping("/{id}")
    @Transactional
    public void delete(@PathVariable Long id) {
        Post p = postRepo.findById(id).orElseThrow();
        if (!NOTICE_BOARD.equals(p.getBoard().getCode())) {
            throw new IllegalArgumentException("공지 게시물이 아닙니다.");
        }
        postRepo.deleteById(id);
    }
}
