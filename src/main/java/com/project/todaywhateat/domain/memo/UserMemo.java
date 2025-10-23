// domain/memo/UserMemo.java
package com.project.todaywhateat.domain.memo;

import com.project.todaywhateat.domain.User;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity @Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
@Table(name="user_memo", uniqueConstraints=@UniqueConstraint(columnNames="user_id"))
public class UserMemo {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id")
    private User user;

    @Lob
    @Column(nullable = false)
    private String content;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist @PreUpdate
    void onSave(){ this.updatedAt = LocalDateTime.now(); }
}
