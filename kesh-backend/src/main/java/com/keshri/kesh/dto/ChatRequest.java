package com.keshri.kesh.dto;

import jakarta.validation.constraints.NotBlank;

public class ChatRequest {

    @NotBlank(message = "message must not be empty")
    private String message;

    /** Optional: lets the frontend force cloud or offline mode. Values: "auto" | "offline" | "cloud" */
    private String mode = "auto";

    /** Optional: how much depth/effort to put into the reply. Values: "fast" | "balanced" | "deep" */
    private String responseStyle = "balanced";

    /** Optional: groups messages into a conversation. If null, a new session is implied. */
    private Long sessionId;

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public String getMode() { return mode; }
    public void setMode(String mode) { this.mode = mode; }

    public String getResponseStyle() { return responseStyle; }
    public void setResponseStyle(String responseStyle) { this.responseStyle = responseStyle; }

    public Long getSessionId() { return sessionId; }
    public void setSessionId(Long sessionId) { this.sessionId = sessionId; }
}
