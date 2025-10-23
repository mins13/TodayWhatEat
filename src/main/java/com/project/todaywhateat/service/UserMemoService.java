// service/UserMemoService.java
package com.project.todaywhateat.service;

import com.project.todaywhateat.domain.memo.UserMemo;
import com.project.todaywhateat.dto.memo.UserMemoDto;
import com.project.todaywhateat.repository.UserRepository;
import com.project.todaywhateat.repository.memo.UserMemoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service @RequiredArgsConstructor
public class UserMemoService {
    private final UserMemoRepository memoRepo;
    private final UserRepository userRepo;

    @Transactional(readOnly = true)
    public UserMemoDto get(Long userId){
        var memo = memoRepo.findByUserId(userId).orElse(null);
        return memo == null
                ? UserMemoDto.builder().content("").updatedAt(null).build()
                : UserMemoDto.builder().content(memo.getContent()).updatedAt(memo.getUpdatedAt()).build();
    }

    @Transactional
    public UserMemoDto put(Long userId, String content){
        // (선택) 길이 제한: 20,000자 등
        if(content == null) content = "";
        var user = userRepo.getReferenceById(userId);
        var memo = memoRepo.findByUserId(userId)
                .orElse(UserMemo.builder().user(user).content("").build());
        memo.setContent(content);
        var saved = memoRepo.save(memo);
        return UserMemoDto.builder().content(saved.getContent()).updatedAt(saved.getUpdatedAt()).build();
    }
}
