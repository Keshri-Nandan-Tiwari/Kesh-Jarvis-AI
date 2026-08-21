package com.keshri.kesh.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Free headline lookups via NewsAPI (free tier: developer/testing use, 100 req/day).
 * Get a free key: https://newsapi.org/register
 */
@Service
public class NewsService {

    private final WebClient webClient;

    @Value("${kesh.newsapi.api-key:}")
    private String apiKey;

    public NewsService(WebClient.Builder builder) {
        this.webClient = builder.build();
    }

    /** Returns the top few current headlines as a short bullet summary, or an error note. */
    @SuppressWarnings("unchecked")
    public String getTopHeadlines() {
        if (apiKey == null || apiKey.isBlank()) {
            return "[News unavailable: no NEWSAPI_API_KEY configured]";
        }
        try {
            String url = "https://newsapi.org/v2/top-headlines?country=us&pageSize=5&apiKey=" + apiKey;

            Map response = webClient.get().uri(url).retrieve().bodyToMono(Map.class).block();
            List<Map> articles = (List<Map>) response.get("articles");

            if (articles == null || articles.isEmpty()) {
                return "[No current headlines returned]";
            }

            return "Current top headlines:\n" + articles.stream()
                    .limit(5)
                    .map(a -> "- " + a.get("title"))
                    .collect(Collectors.joining("\n"));
        } catch (Exception e) {
            return "[Couldn't fetch news: " + e.getMessage() + "]";
        }
    }
}
