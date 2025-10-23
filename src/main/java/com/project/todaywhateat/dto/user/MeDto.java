package com.project.todaywhateat.dto.user;
import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class MeDto {
    private Long id;
    private String email;
    private String username;
    private String nickname;
}
