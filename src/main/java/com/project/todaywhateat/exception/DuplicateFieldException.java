package com.project.todaywhateat.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

import java.util.Map;

@ResponseStatus(HttpStatus.BAD_REQUEST) // ✨ 이걸 꼭 추가!
public class DuplicateFieldException extends RuntimeException {
    private final Map<String, String> errors;

    public DuplicateFieldException(Map<String, String> errors) {
        super("중복 필드 오류");
        this.errors = errors;
    }

    public Map<String, String> getErrors() {
        return errors;
    }
}
