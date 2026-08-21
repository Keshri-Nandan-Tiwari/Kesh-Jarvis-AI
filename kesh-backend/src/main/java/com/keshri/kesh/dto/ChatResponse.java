package com.keshri.kesh.dto;

public class ChatResponse {

    private String reply;
    private String brainUsed;   // "offline" or "cloud"
    private Long sessionId;

    public ChatResponse() {}

    public ChatResponse(String reply, String brainUsed, Long sessionId) {
        this.reply = reply;
        this.brainUsed = brainUsed;
        this.sessionId = sessionId;
    }

    public String getReply() { return reply; }
    public void setReply(String reply) { this.reply = reply; }

    public String getBrainUsed() { return brainUsed; }
    public void setBrainUsed(String brainUsed) { this.brainUsed = brainUsed; }

    public Long getSessionId() { return sessionId; }
    public void setSessionId(Long sessionId) { this.sessionId = sessionId; }
}
