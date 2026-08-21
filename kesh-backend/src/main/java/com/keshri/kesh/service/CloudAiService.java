package com.keshri.kesh.service;

import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.List;
import java.util.Map;

/**
 * Cloud brain. Tries Groq first (free tier, very fast), falls back to
 * Gemini if Groq fails or no Groq key is set.
 *
 * Get free keys:
 *  - Groq:   https://console.groq.com/keys
 *  - Gemini: https://aistudio.google.com/apikey
 */
@Service
public class CloudAiService {

    private final WebClient webClient;

    @Value("${kesh.groq.api-key:}")
    private String groqApiKey;

    @Value("${kesh.groq.model:openai/gpt-oss-120b}")
    private String groqModel;

    @Value("${kesh.gemini.api-key:}")
    private String geminiApiKey;

    @Value("${kesh.gemini.model:gemini-1.5-flash}")
    private String geminiModel;

    public CloudAiService(WebClient.Builder builder) {
        this.webClient = builder.build();
    }

    @PostConstruct
    private void logKeyStatus() {
        System.out.println("==================================");
        System.out.println(" GROQ key loaded: " + (groqApiKey != null && !groqApiKey.isBlank())
                + " (length=" + (groqApiKey == null ? 0 : groqApiKey.length()) + ")");
        System.out.println(" GEMINI key loaded: " + (geminiApiKey != null && !geminiApiKey.isBlank())
                + " (length=" + (geminiApiKey == null ? 0 : geminiApiKey.length()) + ")");
        System.out.println("==================================");
    }

    public String generate(String prompt, String responseStyle) {
        String groqError = null;
        if (groqApiKey != null && !groqApiKey.isBlank()) {
            try {
                return callGroq(prompt, responseStyle);
            } catch (Exception e) {
                groqError = e.getMessage();
                System.out.println("Groq failed, falling back to Gemini: " + groqError);
            }
        }
        if (geminiApiKey != null && !geminiApiKey.isBlank()) {
            try {
                return callGemini(prompt, responseStyle);
            } catch (Exception e) {
                return "[Cloud brain error (Gemini): " + e.getMessage() + "]";
            }
        }
        if (groqError != null) {
            return "[Groq call failed: " + groqError + "]";
        }
        return "[No cloud API key configured. Add kesh.groq.api-key or kesh.gemini.api-key in application.yml / .env]";
    }

    @SuppressWarnings("unchecked")
    private String callGroq(String prompt, String responseStyle) {
        Map<String, Object> body = Map.of(
                "model", groqModel,
                "temperature", temperatureFor(responseStyle),
                "messages", List.of(
                        Map.of("role", "system", "content", systemPrompt(responseStyle)),
                        Map.of("role", "user", "content", prompt)
                )
        );

        Map response = webClient.post()
                .uri("https://api.groq.com/openai/v1/chat/completions")
                .header("Authorization", "Bearer " + groqApiKey)
                .header("Content-Type", "application/json")
                .bodyValue(body)
                .retrieve()
                .onStatus(status -> status.isError(), clientResponse ->
                        clientResponse.bodyToMono(String.class).map(errorBody ->
                                new RuntimeException("Groq API error [" + clientResponse.statusCode() + "]: " + errorBody)
                        )
                )
                .bodyToMono(Map.class)
                .block();

        List<Map> choices = (List<Map>) response.get("choices");
        Map message = (Map) choices.get(0).get("message");
        return message.get("content").toString().trim();
    }

    @SuppressWarnings("unchecked")
    private String callGemini(String prompt, String responseStyle) {
        String url = "https://generativelanguage.googleapis.com/v1beta/models/"
                + geminiModel + ":generateContent?key=" + geminiApiKey;

        Map<String, Object> body = Map.of(
                "contents", List.of(
                        Map.of("parts", List.of(
                                Map.of("text", systemPrompt(responseStyle) + "\n\nUser: " + prompt)
                        ))
                )
        );

        Map response = webClient.post()
                .uri(url)
                .header("Content-Type", "application/json")
                .bodyValue(body)
                .retrieve()
                .bodyToMono(Map.class)
                .block();

        List<Map> candidates = (List<Map>) response.get("candidates");
        Map content = (Map) candidates.get(0).get("content");
        List<Map> parts = (List<Map>) content.get("parts");
        return parts.get(0).get("text").toString().trim();
    }

    private double temperatureFor(String responseStyle) {
        return switch (responseStyle == null ? "balanced" : responseStyle) {
            case "fast" -> 0.4;
            case "deep" -> 0.9;
            default -> 0.7;
        };
    }

    private String systemPrompt(String responseStyle) {
        String base = "You are Jarvis, a warm, witty, highly capable personal AI assistant built by Keshri. "
                + "Speak like a genuine friend — direct, natural, a little playful, never robotic or overly formal.";

        String styleNote = switch (responseStyle == null ? "balanced" : responseStyle) {
            case "fast" -> " Keep this reply short and to the point — a sentence or two, no filler.";
            case "deep" -> " Take your time here: think it through carefully, add useful detail, nuance, and examples where they genuinely help.";
            default -> " Keep the reply clear and reasonably concise, but include the useful detail the question actually needs.";
        };

        return base + styleNote;
    }
}
