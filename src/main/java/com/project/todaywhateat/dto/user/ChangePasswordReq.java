package com.project.todaywhateat.dto.user;
import lombok.*;
@Getter @Setter public class ChangePasswordReq {
    private String currentPassword;
    private String newPassword;
}