package com.keshri.kesh.controller;

import com.keshri.kesh.dto.ChatRequest;
import com.keshri.kesh.dto.ChatResponse;
import com.keshri.kesh.model.ChatMessage;
import com.keshri.kesh.model.ChatSession;
import com.keshri.kesh.repository.ChatMessageRepository;
import com.keshri.kesh.repository.ChatSessionRepository;
import com.keshri.kesh.service.BrainRouterService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
public class ChatController {

    private final BrainRouterService brainRouterService;
    private final ChatSessionRepository sessionRepository;
    private final ChatMessageRepository messageRepository;

    public ChatController(BrainRouterService brainRouterService,
                           ChatSessionRepository sessionRepository,
                           ChatMessageRepository messageRepository) {
        this.brainRouterService = brainRouterService;
        this.sessionRepository = sessionRepository;
        this.messageRepository = messageRepository;
    }

    @GetMapping("/health")
    public String health() {
        return "Jarvis backend is alive.";
    }

    @PostMapping("/chat")
    public ChatResponse chat(@Valid @RequestBody ChatRequest request, Authentication authentication) {
        String currentUser = authentication.getName();

        // 1. Get or create the session — only reuse it if it actually belongs
        // to the logged-in user, so nobody can append to someone else's chat
        // just by guessing a sessionId.
        ChatSession session;
        boolean isNewSession = false;
        if (request.getSessionId() != null) {
            session = sessionRepository.findById(request.getSessionId())
                    .filter(s -> s.getOwnerUsername().equals(currentUser))
                    .orElseGet(() -> new ChatSession());
            if (session.getId() == null) {
                session.setOwnerUsername(currentUser);
                isNewSession = true;
            }
        } else {
            session = new ChatSession();
            session.setOwnerUsername(currentUser);
            isNewSession = true;
        }

        // Title the chat after the user's first message (like ChatGPT/Gemini do)
        // instead of leaving every conversation labeled "New Chat" forever.
        if (isNewSession) {
            session.setTitle(deriveTitle(request.getMessage()));
        }
        session = sessionRepository.save(session);

        // 2. Save the user's message
        ChatMessage userMsg = new ChatMessage();
        userMsg.setSessionId(session.getId());
        userMsg.setRole("user");
        userMsg.setContent(request.getMessage());
        messageRepository.save(userMsg);

        // 3. Route to the right brain and get a reply
        BrainRouterService.BrainResult result = brainRouterService.route(
                request.getMessage(), request.getMode(), request.getResponseStyle()
        );

        // 4. Save Kesh's reply
        ChatMessage assistantMsg = new ChatMessage();
        assistantMsg.setSessionId(session.getId());
        assistantMsg.setRole("assistant");
        assistantMsg.setContent(result.reply());
        assistantMsg.setBrainUsed(result.brainUsed());
        messageRepository.save(assistantMsg);

        return new ChatResponse(result.reply(), result.brainUsed(), session.getId());
    }

    @GetMapping("/chat/{sessionId}/history")
    public ResponseEntity<?> history(@PathVariable Long sessionId, Authentication authentication) {
        ChatSession session = sessionRepository.findById(sessionId).orElse(null);
        if (session == null || !session.getOwnerUsername().equals(authentication.getName())) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
        return ResponseEntity.ok(messageRepository.findBySessionIdOrderByCreatedAtAsc(sessionId));
    }

    @GetMapping("/sessions")
    public List<ChatSession> allSessions(Authentication authentication) {
        return sessionRepository.findByOwnerUsernameOrderByCreatedAtDesc(authentication.getName());
    }

    private String deriveTitle(String firstMessage) {
        if (firstMessage == null || firstMessage.isBlank()) return "New Chat";
        String cleaned = firstMessage.trim().replaceAll("\\s+", " ");
        return cleaned.length() > 42 ? cleaned.substring(0, 42) + "…" : cleaned;
    }
}
