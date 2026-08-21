package com.keshri.kesh.repository;

import com.keshri.kesh.model.ChatSession;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ChatSessionRepository extends JpaRepository<ChatSession, Long> {
    List<ChatSession> findByOwnerUsernameOrderByCreatedAtDesc(String ownerUsername);
}
