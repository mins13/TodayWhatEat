// com.project.todaywhateat.dto.admin.notice.NoticeDetailDto
package com.project.todaywhateat.dto.admin.notice;

import com.project.todaywhateat.domain.Community.Post;
import com.project.todaywhateat.domain.Community.PostFile;

import java.util.List;

public record NoticeDetailDto(
        Long id,
        String title,
        String content,
        Boolean pinned,
        List<AttachmentDto> attachments
) {
    public record AttachmentDto(
            Long id,
            String url,
            String filename,
            Integer width,
            Integer height
    ) {}

    public static NoticeDetailDto from(Post p, List<PostFile> files) {
        var atts = files.stream()
                .map(f -> new AttachmentDto(
                        f.getId(), f.getUrl(), f.getFilename(), f.getWidth(), f.getHeight()
                ))
                .toList();

        return new NoticeDetailDto(
                p.getId(),
                p.getTitle(),
                p.getContent(),
                p.isPinned(),
                atts
        );
    }

    // 기존 from(Post) 쓰던 곳이 있으면 잠깐 유지해도 됩니다.
    public static NoticeDetailDto from(Post p) {
        return new NoticeDetailDto(p.getId(), p.getTitle(), p.getContent(), p.isPinned(), List.of());
    }
}
