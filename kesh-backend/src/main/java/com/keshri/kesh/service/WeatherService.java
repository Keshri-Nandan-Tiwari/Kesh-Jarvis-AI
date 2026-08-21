package com.keshri.kesh.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.Map;

/**
 * Free weather lookups via OpenWeatherMap (free tier: 1000 calls/day).
 * Get a free key: https://home.openweathermap.org/api_keys
 */
@Service
public class WeatherService {

    private final WebClient webClient;

    @Value("${kesh.openweather.api-key:}")
    private String apiKey;

    public WeatherService(WebClient.Builder builder) {
        this.webClient = builder.build();
    }

    /** Returns a short factual weather summary for the given city, or an error note. */
    @SuppressWarnings("unchecked")
    public String getWeather(String city) {
        if (apiKey == null || apiKey.isBlank()) {
            return "[Weather unavailable: no OPENWEATHER_API_KEY configured]";
        }
        try {
            String url = "https://api.openweathermap.org/data/2.5/weather?q=" + city
                    + "&appid=" + apiKey + "&units=metric";

            Map response = webClient.get().uri(url).retrieve().bodyToMono(Map.class).block();

            Map main = (Map) response.get("main");
            var weatherList = (java.util.List<Map>) response.get("weather");
            String description = weatherList.isEmpty() ? "unknown" : weatherList.get(0).get("description").toString();
            Object temp = main.get("temp");
            Object feelsLike = main.get("feels_like");
            Object humidity = main.get("humidity");

            return String.format(
                    "Current weather in %s: %s, %.1f°C (feels like %.1f°C), humidity %s%%.",
                    city, description,
                    Double.parseDouble(temp.toString()),
                    Double.parseDouble(feelsLike.toString()),
                    humidity
            );
        } catch (Exception e) {
            return "[Couldn't fetch weather for " + city + ": " + e.getMessage() + "]";
        }
    }
}
