package com.interview.simulator.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
public class HealthController {

    @GetMapping("/health")
    public Map<String, Object> getHealth() {
        Map<String, Object> status = new HashMap<>();
        status.put("status", "UP");
        status.put("message", "AI Interview Simulator Backend is running!");

        // Run thorough diagnostics
        List<Map<String, Object>> diagnostics = new ArrayList<>();
        diagnostics.add(testEndpoint("https://api.openai.com", "OpenAI API"));
        diagnostics.add(testEndpoint("https://generativelanguage.googleapis.com", "Gemini API"));
        diagnostics.add(testEndpoint("https://www.google.com", "Google Web Gateway"));

        boolean hasInternet = false;
        long totalLatency = 0;
        int activeEndpoints = 0;

        for (Map<String, Object> diag : diagnostics) {
            if ("UP".equals(diag.get("status"))) {
                hasInternet = true;
                totalLatency += (Long) diag.get("latencyMs");
                activeEndpoints++;
            }
        }

        status.put("internet", hasInternet ? "CONNECTED" : "DISCONNECTED");
        status.put("endpoints", diagnostics);

        String quality = "OFFLINE";
        if (hasInternet) {
            long avgLatency = totalLatency / activeEndpoints;
            status.put("averageLatencyMs", avgLatency);
            if (avgLatency < 250) {
                quality = "EXCELLENT";
            } else if (avgLatency < 600) {
                quality = "GOOD";
            } else {
                quality = "DEGRADED";
            }
        }
        status.put("networkQuality", quality);

        return status;
    }

    private Map<String, Object> testEndpoint(String urlString, String name) {
        Map<String, Object> result = new HashMap<>();
        long startTime = System.currentTimeMillis();
        try {
            java.net.URL url = new java.net.URL(urlString);
            java.net.HttpURLConnection connection = (java.net.HttpURLConnection) url.openConnection();
            connection.setConnectTimeout(1500);
            connection.setReadTimeout(1500);
            connection.setRequestMethod("HEAD");
            connection.connect();
            int responseCode = connection.getResponseCode();
            long elapsed = System.currentTimeMillis() - startTime;
            result.put("name", name);
            result.put("status", responseCode > 0 ? "UP" : "DOWN");
            result.put("latencyMs", elapsed);
        } catch (Exception e) {
            result.put("name", name);
            result.put("status", "OFFLINE");
            result.put("latencyMs", -1L);
        }
        return result;
    }
}
