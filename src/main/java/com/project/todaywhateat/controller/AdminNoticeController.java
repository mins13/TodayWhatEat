package com.project.todaywhateat.controller;

import com.project.todaywhateat.domain.Community.Board;
import com.project.todaywhateat.domain.Community.Post;
import com.project.todaywhateat.domain.Community.PostFile;
import com.project.todaywhateat.dto.Community.PageResponse;
import com.project.todaywhateat.dto.admin.notice.NoticeAdminDto;
import com.project.todaywhateat.dto.admin.notice.NoticeDetailDto;
import com.project.todaywhateat.dto.admin.notice.NoticeIdDto;
import com.project.todaywhateat.dto.admin.notice.NoticeUpsertDto;
import com.project.todaywhateat.repository.Community.BoardRepo;
import com.project.todaywhateat.repository.Community.PostFileRepo;
import com.project.todaywhateat.repository.Community.PostRepo;
import com.project.todaywhateat.service.FileStorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/admin/notices")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminNoticeController {

    private final PostRepo postRepo;
    private final BoardRepo boardRepo;
    private final PostFileRepo postFileRepo;
    private final FileStorageService fileStorageService;

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

    /** 단건 상세 (첨부 포함) */
    @GetMapping("/{id}")
    public NoticeDetailDto get(@PathVariable Long id) {
        Post p = postRepo.findById(id).orElseThrow();
        if (!NOTICE_BOARD.equals(p.getBoard().getCode())) {
            throw new IllegalArgumentException("공지 게시물이 아닙니다.");
        }
        List<PostFile> files = postFileRepo.findByPost_IdOrderByIdAsc(id);
        return NoticeDetailDto.from(p, files);
    }

    /* ================== 생성 ================== */

    /** JSON 생성 (파일 없이) */
    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    @Transactional
    public NoticeIdDto createJson(@RequestBody NoticeUpsertDto dto) {
        Long id = doCreate(dto.title(), dto.content(), Boolean.TRUE.equals(dto.pinned()), null);
        return new NoticeIdDto(id);
    }

    /** multipart 생성 (파일 첨부) */
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Transactional
    public NoticeIdDto createMultipart(@RequestParam String title,
                                       @RequestParam String content,
                                       @RequestParam(required = false, defaultValue = "false") boolean pinned,
                                       @RequestPart(required = false, name = "files") List<MultipartFile> files) {
        Long id = doCreate(title, content, pinned, files);
        return new NoticeIdDto(id);
    }

    /* ================== 수정 ================== */

    /** JSON 수정 (본문만) */
    @PutMapping(value = "/{id}", consumes = MediaType.APPLICATION_JSON_VALUE)
    @Transactional
    public void updateJson(@PathVariable Long id, @RequestBody NoticeUpsertDto dto) {
        doUpdate(id, dto.title(), dto.content(), Boolean.TRUE.equals(dto.pinned()), null);
    }

    /** multipart 수정 (본문 + 새 파일 추가) */
    @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Transactional
    public void updateMultipart(@PathVariable Long id,
                                @RequestParam String title,
                                @RequestParam String content,
                                @RequestParam(required = false, defaultValue = "false") boolean pinned,
                                @RequestPart(required = false, name = "files") List<MultipartFile> files) {
        doUpdate(id, title, content, pinned, files);
    }

    /* ================== 첨부 개별 삭제(옵션) ================== */
    @DeleteMapping("/{postId}/attachments/{fileId}")
    @Transactional
    public void deleteAttachment(@PathVariable Long postId, @PathVariable Long fileId) {
        PostFile pf = postFileRepo.findById(fileId).orElseThrow();
        if (!pf.getPost().getId().equals(postId)) {
            throw new IllegalArgumentException("잘못된 첨부 요청");
        }
        // 실제 파일까지 지우고 싶으면 아래 한 줄 유지
        fileStorageService.deleteQuietly(pf.getUrl());
        postFileRepo.delete(pf);
    }

    /** 삭제 (첨부 먼저 삭제해서 FK 오류 방지) */
    @DeleteMapping("/{id}")
    @Transactional
    public void delete(@PathVariable Long id) {
        Post p = postRepo.findById(id).orElseThrow();
        if (!NOTICE_BOARD.equals(p.getBoard().getCode())) {
            throw new IllegalArgumentException("공지 게시물이 아닙니다.");
        }
        // 첨부 파일 정리
        List<PostFile> files = postFileRepo.findByPost_IdOrderByIdAsc(id);
        files.forEach(f -> fileStorageService.deleteQuietly(f.getUrl()));
        postFileRepo.deleteAll(files);

        postRepo.deleteById(id);
    }

    /* ================== 내부 공통 로직 ================== */

    private Long doCreate(String title, String content, boolean pinned, List<MultipartFile> files) {
        if (title == null || title.isBlank()) throw new IllegalArgumentException("제목은 필수입니다.");
        if (content == null || content.isBlank()) throw new IllegalArgumentException("내용은 필수입니다.");

        Board board = boardRepo.findByCode(NOTICE_BOARD).orElseThrow();

        Post p = new Post();
        p.setBoard(board);
        p.setTitle(title.trim());
        p.setContent(content.trim());
        p.setAuthorName("관리자");
        p.setLikesCount(0);
        p.setViewsCount(0);
        p.setPinned(pinned);
        postRepo.save(p);

        saveFiles(p, files);
        return p.getId();
    }

    private void doUpdate(Long id, String title, String content, boolean pinned, List<MultipartFile> files) {
        Post p = postRepo.findById(id).orElseThrow();
        if (!NOTICE_BOARD.equals(p.getBoard().getCode())) {
            throw new IllegalArgumentException("공지 게시물이 아닙니다.");
        }
        if (title == null || title.isBlank()) throw new IllegalArgumentException("제목은 필수입니다.");
        if (content == null || content.isBlank()) throw new IllegalArgumentException("내용은 필수입니다.");

        p.setTitle(title.trim());
        p.setContent(content.trim());
        p.setPinned(pinned);
        postRepo.save(p);

        // 새로 업로드한 파일만 추가 (기존 첨부는 그대로 둠)
        saveFiles(p, files);
    }

    private void saveFiles(Post post, List<MultipartFile> files) {
        if (files == null || files.isEmpty()) return;
        for (MultipartFile f : files) {
            if (f == null || f.isEmpty()) continue;
            try {
                String url = fileStorageService.savePublic(f); // /files/... 반환
                PostFile pf = new PostFile();
                pf.setPost(post);
                pf.setUrl(url);
                pf.setFilename(f.getOriginalFilename());
                pf.setSize(f.getSize());
                postFileRepo.save(pf);
            } catch (Exception ignore) {
                // 실패하면 일단 무시 (필요하면 로그 추가)
            }
        }
    }
}
