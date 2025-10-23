// dto/memo/UserMemoDto.java
package com.project.todaywhateat.dto.memo;

import lombok.*;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class UserMemoDto {
    private String content;
    private LocalDateTime updatedAt;
}
