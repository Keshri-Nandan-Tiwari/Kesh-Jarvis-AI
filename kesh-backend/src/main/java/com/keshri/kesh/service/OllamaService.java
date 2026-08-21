package com.keshri.kesh.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.Map;

/**
 * Talks to a locally running Ollama instance (default: http://localhost:11434).
 * Requires: `ollama serve` running, and the model already pulled
 * e.g. `ollama pull llama3.1:8b`
 */
@Service
public class OllamaService {

    private final WebClient webClient;

    @Value("${kesh.ollama.base-url:http://localhost:11434}")
    private String baseUrl;

    @Value("${kesh.ollama.model:llama3.1:8b}")
    private String model;

    public OllamaService(WebClient.Builder builder) {
        this.webClient = builder.build();
    }

    public String generate(String prompt, String responseStyle) {
        try {
            Map<String, Object> body = Map.of(
                    "model", model,
                    "prompt", buildJarvisPrompt(prompt, responseStyle),
                    "stream", false
            );

            Map response = webClient.post()
                    .uri(baseUrl + "/api/generate")
                    .bodyValue(body)
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block();

            if (response != null && response.get("response") != null) {
                return response.get("response").toString().trim();
            }
            return "I couldn't generate a response locally right now.";
        } catch (Exception e) {
            return "[Offline brain error: " + e.getMessage() + "] Is Ollama running? Try `ollama serve` in a terminal.";
        }
    }

    private String buildJarvisPrompt(String userMessage, String responseStyle) {
        String styleNote = switch (responseStyle == null ? "balanced" : responseStyle) {
            case "fast" -> "Keep it short — a sentence or two.";
            case "deep" -> "Think it through carefully and add useful detail.";
            default -> "Be clear and reasonably concise.";
        };

        return """
                You are Jarvis, a warm, witty, highly capable personal AI assistant \
                built by Keshri. Speak like a genuine friend — direct, natural, \
                a little playful, never robotic or overly formal. %s

                User: %s
                Jarvis:""".formatted(styleNote, userMessage);
    }
}
