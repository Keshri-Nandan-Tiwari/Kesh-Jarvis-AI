package com.keshri.kesh.service;

import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Decides whether a message should go to the offline (Ollama) brain
 * or the cloud (Groq/Gemini) brain, and — for weather/news questions —
 * fetches real current data first and injects it into the prompt so
 * the LLM isn't just guessing from stale training knowledge.
 *
 * Rules (mode = "auto"):
 *  1. If offline (no internet) -> always use local Ollama.
 *  2. If online AND message looks like it needs real-time info
 *     (news, weather, "today", "latest", "current", stock prices, etc.)
 *     -> use cloud, and if it's specifically weather/news, fetch live
 *        data first and hand it to the model as context.
 *  3. Otherwise, prefer local first for speed + zero cost.
 *
 * mode = "offline" or "cloud" forces that brain regardless of the above.
 */
@Service
public class BrainRouterService {

    private final OllamaService ollamaService;
    private final CloudAiService cloudAiService;
    private final ConnectivityService connectivityService;
    private final WeatherService weatherService;
    private final NewsService newsService;

    private static final List<String> REALTIME_KEYWORDS = List.of(
            "today", "latest", "current", "now", "news", "weather",
            "stock", "price of", "score", "who won", "this week",
            "recent", "right now", "update on", "2026"
    );

    private static final Pattern WEATHER_CITY_PATTERN =
            Pattern.compile("(?i)weather.*\\bin\\s+([a-zA-Z\\s]+?)(?:[?.!]|$)");

    public BrainRouterService(OllamaService ollamaService,
                               CloudAiService cloudAiService,
                               ConnectivityService connectivityService,
                               WeatherService weatherService,
                               NewsService newsService) {
        this.ollamaService = ollamaService;
        this.cloudAiService = cloudAiService;
        this.connectivityService = connectivityService;
        this.weatherService = weatherService;
        this.newsService = newsService;
    }

    public record BrainResult(String reply, String brainUsed) {}

    public BrainResult route(String message, String mode, String responseStyle) {
        boolean online = connectivityService.isOnline();
        String style = (responseStyle == null || responseStyle.isBlank()) ? "balanced" : responseStyle;

        String chosen;
        if ("offline".equalsIgnoreCase(mode)) {
            chosen = "offline";
        } else if ("cloud".equalsIgnoreCase(mode)) {
            chosen = online ? "cloud" : "offline"; // can't force cloud with no internet
        } else { // auto
            if (!online) {
                chosen = "offline";
            } else if (needsRealTimeData(message)) {
                chosen = "cloud";
            } else {
                chosen = "offline"; // default to free local for routine chat
            }
        }

        String promptToSend = message;

        // Only fetch live data when we're actually going to the cloud brain
        // (offline mode has no internet access for these lookups either way).
        if (chosen.equals("cloud")) {
            String liveContext = buildLiveContext(message);
            if (liveContext != null) {
                promptToSend = "[REAL-TIME CONTEXT — use this, don't rely on your training data for this]\n"
                        + liveContext
                        + "\n[END CONTEXT]\n\nUser question: " + message;
            }
        }

        String reply = chosen.equals("cloud")
                ? cloudAiService.generate(promptToSend, style)
                : ollamaService.generate(promptToSend, style);

        // If the offline brain was picked but Ollama isn't actually reachable
        // (e.g. this is deployed to Render/a server with no local Ollama
        // instance running), fall back to cloud automatically instead of
        // handing the user a raw connection-error string as Kesh's reply.
        if (chosen.equals("offline") && reply.startsWith("[Offline brain error") && online) {
            chosen = "cloud";
            reply = cloudAiService.generate(promptToSend, style);
        }

        return new BrainResult(reply, chosen);
    }

    /** Returns fetched weather/news context if the message asks for it, else null. */
    private String buildLiveContext(String message) {
        String lower = message.toLowerCase(Locale.ROOT);

        if (lower.contains("weather")) {
            Matcher matcher = WEATHER_CITY_PATTERN.matcher(message);
            if (matcher.find()) {
                String city = matcher.group(1).trim();
                return weatherService.getWeather(city);
            }
            return "[User asked about weather but didn't name a city — ask them which city.]";
        }

        if (lower.contains("news") || lower.contains("headline")) {
            return newsService.getTopHeadlines();
        }

        return null;
    }

    private boolean needsRealTimeData(String message) {
        String lower = message.toLowerCase(Locale.ROOT);
        return REALTIME_KEYWORDS.stream().anyMatch(lower::contains);
    }
}

