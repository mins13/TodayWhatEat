package com.project.todaywhateat.dto.Community;

import java.util.List;

public record PageResponse<T>(List<T> items, long total) {}