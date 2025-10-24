// com.project.todaywhateat.service.CommunityPostService
package com.project.todaywhateat.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;   // ✅ 추가
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class CommunityPostService {

    @Transactional
    public long create(String board,
                       String title,
                       String content,
                       String authorName,
                       Long recipeId,
                       List<MultipartFile> files,
                       Authentication auth) {

        // ⬇️ 이 부분에 실제 저장 로직을 붙이세요.
        //  - auth.getName() 또는 SecurityContext에서 사용자 찾기
        //  - Post 엔티티 저장
        //  - files(멀티파트) 저장: FileStorageService 같은 걸 사용한다면 여기서 호출
        //  - recipeId가 있으면 게시글-레시피 연동

        log.info("[CREATE POST] board={}, title={}, recipeId={}, files={}",
                board, title, recipeId, (files != null ? files.size() : 0));

        // TODO: 실제로 저장 후 생성된 게시글 ID 반환
        // 예: long id = postService.save(...); return id;

        // 임시로 더미 ID를 반환하면 빌드는 통과하지만,
        // 프론트가 /community/{board}/{id}로 이동할 때 404가 날 수 있습니다.
        // 저장 로직을 붙인 뒤 실제 DB에서 생성된 id를 반환하세요.
        return 1L;
    }
}
