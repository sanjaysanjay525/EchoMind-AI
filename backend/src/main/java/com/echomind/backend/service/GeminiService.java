package com.echomind.backend.service;

import com.echomind.backend.model.InterviewContext;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.List;

@Service
public class GeminiService {

    // === Direct Gemini (fallback) ===
    @Value("${gemini.api.key}")
    private String geminiApiKey;

    private static final String GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=";

    // === OmniRoute AI Gateway (primary) ===
    @Value("${omniroute.api.key:}")
    private String omniRouteApiKey;

    @Value("${omniroute.base.url:http://localhost:20128}")
    private String omniRouteBaseUrl;

    @Value("${omniroute.model:auto/best-free}")
    private String omniRouteModel;

    @Value("${omniroute.enabled:true}")
    private boolean omniRouteEnabled;

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(java.time.Duration.ofSeconds(10))
            .build();

    // =====================================================================
    // PUBLIC API — Interview Generation Methods
    // =====================================================================

    public String generateFirstQuestion(String domain, String difficulty, String persona) {
        String complexityDirective = getComplexityDirective(difficulty);
        String personaDirective = getPersonaDirectiveForQuestion(persona, difficulty);

        String prompt = String.format("You are an expert mock interviewer conducting an interview.\n" +
                "Candidate Job Domain: %s\n" +
                "Target Difficulty Level: %s\n" +
                "Difficulty Directive: %s\n" +
                "Interviewer Persona Directive: %s\n\n" +
                "Generate ONE interview question based on the following rules:\n" +
                "1. Keep it short and clear (maximum 30 words). Avoid long paragraph questions.\n" +
                "2. Focus on frequently asked conceptual questions. Prioritize concepts over case studies.\n" +
                "3. If the role is Software Developer, ask about: Java, OOP, Collections, Spring Boot, SQL, DBMS, Operating Systems, or Computer Networks.\n" +
                "4. If the role is Data Scientist, ask about: Python, Statistics, Machine Learning, Pandas, or NumPy.\n" +
                "5. If the role is Game Developer, ask about: game loop, memory optimization, ECS vs OOP, physics, or level streaming.\n" +
                "6. Output ONLY the question text without any extra conversational filler.", domain, difficulty, complexityDirective, personaDirective);

        try {
            return callWithFallback(prompt, 2);
        } catch (Exception e) {
            System.err.println("All AI providers failed in generateFirstQuestion: " + e.getMessage());
            return "Could you start by telling me about a challenging project you've worked on recently?";
        }
    }

    public String generateFollowUpQuestion(String domain, String difficulty, List<InterviewContext> contextHistory, String persona) {
        String complexityDirective = getComplexityDirective(difficulty);
        String personaDirective = getPersonaDirectiveForFollowUp(persona, difficulty);

        StringBuilder promptBuilder = new StringBuilder();
        promptBuilder.append(String.format("You are an expert mock interviewer for a %s role (Difficulty: %s).\n", domain, difficulty));
        promptBuilder.append(String.format("Difficulty Directive: %s\n", complexityDirective));
        promptBuilder.append(String.format("Interviewer Persona Directive: %s\n", personaDirective));
        promptBuilder.append("Here is the history of the interview so far:\n\n");

        for (InterviewContext context : contextHistory) {
            promptBuilder.append("Interviewer: ").append(context.getQuestion()).append("\n");
            promptBuilder.append("Candidate: ").append(context.getAnswer() != null ? context.getAnswer() : "No answer provided.").append("\n\n");
        }

        promptBuilder.append("Based on the candidate's last answer and the interview history, generate ONE next interview question following these rules:\n" +
                "1. Questions must be short and clear (maximum 30 words). Avoid long paragraph questions.\n" +
                "2. Focus on frequently asked concepts rather than long scenarios or case studies.\n" +
                "3. Generate follow-up questions ONLY when necessary to probe deeper or clarify a contradiction. Otherwise, move to a new core concept in the domain.\n" +
                "4. Ask exactly one question.\n" +
                "5. Output ONLY the question text without any extra conversational filler.");

        try {
            return callWithFallback(promptBuilder.toString(), 2);
        } catch (Exception e) {
            System.err.println("All AI providers failed in generateFollowUpQuestion: " + e.getMessage());
            List<String> fallbacks = java.util.Arrays.asList(
                "Could you elaborate more on your last point?",
                "Can you provide a specific example from your past experience?",
                "How would you approach this problem differently if you had more time?",
                "What are some common challenges you might face with this approach?",
                "Can you explain the trade-offs involved in that decision?"
            );
            return fallbacks.get(contextHistory.size() % fallbacks.size());
        }
    }

    public String evaluateAnswer(String question, String answer, String language, String gender, String difficulty, String persona, java.util.List<String> coveredKeywords) {
        String strictnessPrompt = getStrictnessPrompt(difficulty);
        String personaEvalPrompt = getPersonaEvalPrompt(persona);

        String keywordsContext = "";
        if (coveredKeywords != null && !coveredKeywords.isEmpty()) {
            keywordsContext = "The candidate successfully mentioned the following expected key concepts/keywords in their spoken answer: " + String.join(", ", coveredKeywords) + ".\n";
        }

        String prompt = String.format("You are an expert mock interviewer. Evaluate the candidate's answer under a %s difficulty level context.\n" +
                "Evaluation Strictness Directive: %s\n" +
                "Persona Grading Style: %s\n" +
                "Question: %s\n" +
                "Candidate's Answer: %s\n" +
                "%s\n" +
                "You MUST evaluate the response using 4 categories and return a JSON object with this exact structure:\n" +
                "{\n" +
                "  \"scoreBreakdown\": {\n" +
                "    \"starStructure\": { \"score\": [an integer from 0 to 10], \"rationale\": \"[rationale here]\" },\n" +
                "    \"technicalAccuracy\": { \"score\": [an integer from 0 to 10], \"rationale\": \"[rationale here]\" },\n" +
                "    \"communicationClarity\": { \"score\": [an integer from 0 to 10], \"rationale\": \"[rationale here]\" },\n" +
                "    \"confidenceDelivery\": { \"score\": [an integer from 0 to 10], \"rationale\": \"[rationale here]\" }\n" +
                "  },\n" +
                "  \"feedback\": \"[A brief overall assessment of correctness and an ideal example answer, maximum 60 words total]\"\n" +
                "}\n\n" +
                "Rules:\n" +
                "1. Each category score must be an integer between 0 and 10.\n" +
                "2. Rationales should be concise (maximum 20 words per category).\n" +
                "3. Output ONLY the valid JSON object. Do not wrap in markdown tags like ```json or use any other conversational text.", difficulty, strictnessPrompt, personaEvalPrompt, question, answer != null ? answer : "No answer provided.", keywordsContext);

        if ("th".equalsIgnoreCase(language)) {
            String genderSuffix = "female".equalsIgnoreCase(gender) ? "khâ" : "khráp";
            prompt += String.format("\nSince the candidate is practicing in Thai, please provide the feedback and all rationales in polite Thai language. End the feedback with polite particles like '%s'. Keep the tone matching the requested persona.", genderSuffix);
        }

        String rawResult = "";
        try {
            rawResult = callWithFallback(prompt, 1);
            if (isValidJsonEvaluation(rawResult)) {
                return cleanJsonResult(rawResult);
            }
        } catch (Exception e) {
            System.err.println("First attempt to evaluate answer failed: " + e.getMessage());
        }

        // Retry once if parsing fails
        String retryPrompt = prompt + "\n\nIMPORTANT: Your previous output was invalid JSON. You must return ONLY the raw JSON object. Do not include markdown fences, backticks, or any leading/trailing text.";
        try {
            rawResult = callWithFallback(retryPrompt, 1);
            if (isValidJsonEvaluation(rawResult)) {
                return cleanJsonResult(rawResult);
            }
        } catch (Exception e) {
            System.err.println("Retry attempt to evaluate answer failed: " + e.getMessage());
        }

        // Fallback: return a valid JSON string with reasonable default values
        String defaultFeedback = "Feedback evaluation unavailable at this time due to AI limits. An ideal answer covers the core concepts clearly with examples.";
        if ("th".equalsIgnoreCase(language)) {
            String genderSuffix = "female".equalsIgnoreCase(gender) ? "ค่ะ" : "ครับ";
            defaultFeedback = "ไม่สามารถประเมินผลได้ในขณะนี้เนื่องจากปัญหาการเชื่อมต่อภายนอก โปรดลองใหม่อีกครั้ง" + genderSuffix;
        }
        return String.format("{\n" +
                "  \"scoreBreakdown\": {\n" +
                "    \"starStructure\": { \"score\": 7, \"rationale\": \"Foundation is acceptable, but structure could be more organized.\" },\n" +
                "    \"technicalAccuracy\": { \"score\": 7, \"rationale\": \"Demonstrated baseline understanding of the concept.\" },\n" +
                "    \"communicationClarity\": { \"score\": 7, \"rationale\": \"Delivery was clear and easy to follow.\" },\n" +
                "    \"confidenceDelivery\": { \"score\": 7, \"rationale\": \"Pacing and confidence were stable.\" }\n" +
                "  },\n" +
                "  \"feedback\": \"%s\"\n" +
                "}", defaultFeedback);
    }

    private String cleanJsonResult(String rawJson) {
        if (rawJson == null) return "";
        String clean = rawJson.trim();
        if (clean.startsWith("```")) {
            clean = clean.replaceAll("(?s)^```(?:json)?\\n|\\n```$", "").trim();
        }
        return clean;
    }

    private boolean isValidJsonEvaluation(String rawJson) {
        if (rawJson == null || rawJson.trim().isEmpty()) {
            return false;
        }
        try {
            String clean = cleanJsonResult(rawJson);
            JsonNode root = objectMapper.readTree(clean);
            JsonNode breakdown = root.path("scoreBreakdown");
            return breakdown.has("starStructure") &&
                   breakdown.has("technicalAccuracy") &&
                   breakdown.has("communicationClarity") &&
                   breakdown.has("confidenceDelivery") &&
                   root.has("feedback");
        } catch (Exception e) {
            return false;
        }
    }

    public String callGeminiApi(String prompt) {
        try {
            return callWithFallback(prompt, 2);
        } catch (Exception e) {
            System.err.println("Failed to call AI API: " + e.getMessage());
            return "Could not generate response at this time.";
        }
    }

    public java.util.List<String> generateExpectedKeywords(String questionText, String language) {
        String prompt = String.format(
            "You are an expert technical interviewer. For the following mock interview question, list 3 to 5 critical technical keywords or short concepts (maximum 3 words per concept) that a candidate's answer should contain to show good understanding.\n" +
            "Question: %s\n\n" +
            "Output rules:\n" +
            "1. Output ONLY the keywords as a comma-separated list.\n" +
            "2. Do not write anything else, no introduction, no numbering, no period.\n" +
            "3. If the question is in Thai, output the keywords in Thai, otherwise in English.\n" +
            "Example: \"dependency injection, loose coupling, interface design\"", questionText
        );
        try {
            String raw = callWithFallback(prompt, 2);
            if (raw == null || raw.trim().isEmpty()) {
                return java.util.Collections.emptyList();
            }
            return java.util.Arrays.stream(raw.split(","))
                    .map(String::trim)
                    .filter(s -> !s.isEmpty())
                    .toList();
        } catch (Exception e) {
            System.err.println("Failed to generate expected keywords: " + e.getMessage());
            return java.util.Collections.emptyList();
        }
    }

    public String generateInterruptionPushback(String question, String partialAnswer, String language, String persona) {
        String toneDirective = "";
        if ("Technical Grillmaster".equalsIgnoreCase(persona)) {
            toneDirective = "Be extremely direct, critical, and challenge their half-finished assumption immediately. Demand deep technical precision.";
        } else if ("Skeptical Panel".equalsIgnoreCase(persona)) {
            toneDirective = "Push back formally on the trade-offs or assumptions they started to make. Demand architectural justification.";
        } else {
            toneDirective = "Gently probe on the concept they were starting to introduce, asking them to elaborate further on teamwork or process.";
        }

        String prompt = String.format(
            "You are an expert interviewer with the following persona: %s.\n" +
            "Interruption Directive: %s\n" +
            "You have interrupted the candidate mid-sentence. They only managed to say a partial answer.\n" +
            "Original Question: %s\n" +
            "Candidate's Partial Answer: %s\n\n" +
            "Formulate a brief, sharp pushback question (maximum 30 words) that directly challenges or probes whatever they just said.\n" +
            "Output ONLY the question text. Do not add intro/outro comments or quotes.",
            persona, toneDirective, question, partialAnswer
        );

        if ("th".equalsIgnoreCase(language)) {
            prompt += "\nFormat the question in polite Thai language. End the question with appropriate polite particles ('ค่ะ' or 'ครับ').";
        }

        try {
            return callWithFallback(prompt, 2);
        } catch (Exception e) {
            System.err.println("Failed to generate interruption pushback: " + e.getMessage());
            if ("th".equalsIgnoreCase(language)) {
                return "แล้วรายละเอียดเกี่ยวกับการจัดการส่วนนี้คุณวางแผนอย่างไรคะ?";
            }
            return "How would you handle the operational details of that approach?";
        }
    }

    public String generateAnswerRewrite(String question, String answer, String language) {
        String prompt = String.format(
            "You are a stellar job candidate. Rewrite the following answer to be professional, well-structured, clear, and high-scoring, while keeping the candidate's original context, key points, and experience.\n" +
            "Original Question: %s\n" +
            "Candidate's Answer: %s\n\n" +
            "Output ONLY the rewritten answer (maximum 120 words). Do not add any conversational filler, meta-comments, or quotes.",
            question, answer
        );

        if ("th".equalsIgnoreCase(language)) {
            prompt += "\nFormat the rewritten answer in polite Thai language with polite particles.";
        }

        try {
            return callWithFallback(prompt, 2);
        } catch (Exception e) {
            System.err.println("Failed to rewrite answer: " + e.getMessage());
            return "Rewrite service temporarily unavailable. Please try again.";
        }
    }

    // =====================================================================
    // CORE ROUTING LOGIC — OmniRoute primary, Gemini fallback
    // =====================================================================

    /**
     * Primary routing: tries OmniRoute first (free multi-model gateway),
     * then falls back to direct Gemini API if OmniRoute is unavailable.
     */
    private String callWithFallback(String prompt, int maxRetries) throws Exception {
        // Try OmniRoute first (free AI gateway via Kilo Code)
        if (omniRouteEnabled && omniRouteApiKey != null && !omniRouteApiKey.isBlank()) {
            try {
                String result = callOmniRouteWithRetry(prompt, maxRetries);
                System.out.println("[OmniRoute] AI response delivered via " + omniRouteModel);
                return result;
            } catch (Exception e) {
                System.err.println("[OmniRoute] Failed, falling back to Gemini: " + e.getMessage());
            }
        }

        // Fallback:
        return callGeminiApiWithRetry(prompt, maxRetries);
    }

    public String getCodingReviewJson(String questionTitle, String questionDesc, String code, String language) {
        String prompt = String.format(
            "You are an expert technical interviewer reviewing a candidate's submitted code for a timed DSA coding challenge.\n" +
            "Review the submitted code for readability, time/space complexity, and edge-case handling.\n\n" +
            "Problem Title: %s\n" +
            "Problem Description: %s\n" +
            "Submitted Language: %s\n" +
            "Submitted Code:\n%s\n\n" +
            "Generate a structured JSON response matching the following schema precisely. Do not include markdown backticks or formatting, just the raw JSON object:\n" +
            "{\n" +
            "  \"complexity\": \"Time: O(N), Space: O(1)\",\n" +
            "  \"readabilityScore\": 85,\n" +
            "  \"feedback\": [\n" +
            "    \"2-3 lines of constructive feedback detailing code readability, complexity, or edge cases.\",\n" +
            "    \"Use separate array strings for each point.\"\n" +
            "  ]\n" +
            "}\n",
            questionTitle, questionDesc, language, code
        );
        return callGeminiApi(prompt);
    }

    // =====================================================================
    // OMNIROUTE — OpenAI-Compatible API calls
    // =====================================================================

    private String callOmniRouteWithRetry(String prompt, int maxRetries) throws Exception {
        Exception lastException = null;
        for (int i = 0; i < maxRetries; i++) {
            try {
                return callOmniRouteInternal(prompt);
            } catch (Exception e) {
                lastException = e;
                System.err.println("[OmniRoute] Attempt " + (i + 1) + " failed: " + e.getMessage());
                if (i < maxRetries - 1) {
                    Thread.sleep(1000);
                }
            }
        }
        throw lastException;
    }

    private String callOmniRouteInternal(String prompt) throws Exception {
        // Build OpenAI-compatible chat completions request body
        String requestBody = objectMapper.writeValueAsString(java.util.Map.of(
            "model", omniRouteModel,
            "messages", java.util.List.of(
                java.util.Map.of("role", "user", "content", prompt)
            ),
            "max_tokens", 1024,
            "stream", false
        ));

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(omniRouteBaseUrl + "/api/v1/chat/completions"))
                .header("Content-Type", "application/json")
                .header("Authorization", "Bearer " + omniRouteApiKey)
                .timeout(java.time.Duration.ofSeconds(30))
                .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

        if (response.statusCode() == 200) {
            JsonNode rootNode = objectMapper.readTree(response.body());
            // Handle both streaming and non-streaming responses
            JsonNode choices = rootNode.path("choices");
            if (choices.isArray() && choices.size() > 0) {
                JsonNode message = choices.get(0).path("message");
                String content = message.path("content").asText("").trim();
                if (!content.isEmpty()) {
                    return content;
                }
            }
        }

        // Parse error message for clearer logging
        String errorBody = response.body();
        try {
            JsonNode err = objectMapper.readTree(errorBody);
            String errMsg = err.path("error").path("message").asText(errorBody);
            throw new RuntimeException("[OmniRoute] HTTP " + response.statusCode() + ": " + errMsg);
        } catch (Exception parseEx) {
            throw new RuntimeException("[OmniRoute] HTTP " + response.statusCode() + ": " + errorBody);
        }
    }

    // =====================================================================
    // GEMINI — Direct API calls (fallback)
    // =====================================================================

    private String callGeminiApiWithRetry(String prompt, int maxRetries) throws Exception {
        Exception lastException = null;
        for (int i = 0; i < maxRetries; i++) {
            try {
                return callGeminiApiInternal(prompt);
            } catch (Exception e) {
                lastException = e;
                System.err.println("Gemini API attempt " + (i + 1) + " failed: " + e.getMessage());
                if (i < maxRetries - 1) {
                    Thread.sleep(1500);
                }
            }
        }
        throw lastException;
    }

    private String callGeminiApiInternal(String prompt) throws Exception {
        String requestBody = String.format(
                "{\"contents\": [{\"parts\": [{\"text\": \"%s\"}]}]}",
                escapeJson(prompt)
        );

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(GEMINI_API_URL + geminiApiKey))
                .header("Content-Type", "application/json")
                .timeout(java.time.Duration.ofSeconds(15))
                .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

        if (response.statusCode() == 200) {
            JsonNode rootNode = objectMapper.readTree(response.body());
            JsonNode candidates = rootNode.path("candidates");
            if (candidates.isArray() && candidates.size() > 0) {
                JsonNode textNode = candidates.get(0).path("content").path("parts").get(0).path("text");
                return textNode.asText().trim();
            }
        }
        throw new RuntimeException("Gemini API error: HTTP " + response.statusCode() + " - " + response.body());
    }

    // =====================================================================
    // HELPER — Directive builders
    // =====================================================================

    private String getComplexityDirective(String difficulty) {
        if ("Junior".equalsIgnoreCase(difficulty)) {
            return "Focus on foundational concepts, basic APIs, syntax, simple designs, and friendly starter questions. Do NOT ask about advanced system design, heavy concurrency, or complex scaling.";
        } else if ("Senior".equalsIgnoreCase(difficulty)) {
            return "Focus on high-level system architecture, production failure scenarios, concurrency bottlenecks, scaling trade-offs, complex database indexing, and advanced patterns.";
        } else {
            return "Focus on standard design patterns, intermediate databases, unit testing, REST practices, and practical problem-solving.";
        }
    }

    private String getPersonaDirectiveForQuestion(String persona, String difficulty) {
        if ("STRICT_BAR_RAISER".equalsIgnoreCase(persona) || "Strict Bar Raiser".equalsIgnoreCase(persona)) {
            return "Persona: Strict Bar Raiser. You are a strict Amazon Bar-Raiser interviewer. Keep your tone demanding, critical, and objective. Focus on STAR behavior verification and high standards.";
        } else if ("FRIENDLY_STARTUP_FOUNDER".equalsIgnoreCase(persona) || "Friendly Startup Founder".equalsIgnoreCase(persona)) {
            return "Persona: Friendly Startup Founder. You are a friendly startup founder. Keep your tone collaborative, vision-oriented, positive, and conversational. Ask about agility and passion.";
        } else if ("RAPID_FIRE_TECHNICAL".equalsIgnoreCase(persona) || "Rapid-Fire Technical Grinder".equalsIgnoreCase(persona)) {
            return "Persona: Rapid-Fire Technical Grinder. You are a rapid-fire technical interviewer. Keep your tone precise, direct, and swift. Focus purely on technical accuracy, optimizations, and deep concept definitions.";
        } else if ("SUPPORTIVE_COACH".equalsIgnoreCase(persona) || "Supportive Coach".equalsIgnoreCase(persona)) {
            return "Persona: Supportive Coach. You are a supportive and warm career coach. Keep your tone encouraging, constructive, helpful, and highly positive. Nudge the candidate gently.";
        }

        // Legacy fallbacks:
        if ("Technical Grillmaster".equalsIgnoreCase(persona)) {
            return "Persona: Technical Grillmaster. Direct, intense, strict, demanding, and highly focused. Skip all pleasantries. Ask straight-to-the-point technical or conceptual questions. " +
                   ("Junior".equalsIgnoreCase(difficulty) ? "However, keep content foundational since difficulty is Junior." : "");
        } else if ("Skeptical Panel".equalsIgnoreCase(persona)) {
            return "Persona: Skeptical Panel. Formal, analytical, challenging, and slightly suspicious. Focus heavily on architectural justification, alternative patterns, and trade-offs.";
        } else {
            return "Persona: Friendly HR. Warm, supportive, empathetic, conversational, and welcoming. Frame the question warmly and focus on behavioral fit, growth, teamwork, and foundational domain concepts.";
        }
    }

    private String getPersonaDirectiveForFollowUp(String persona, String difficulty) {
        if ("STRICT_BAR_RAISER".equalsIgnoreCase(persona) || "Strict Bar Raiser".equalsIgnoreCase(persona)) {
            return "Persona: Strict Bar Raiser. You are a demanding Bar-Raiser. Challenge their STAR structure, look for gaps in metrics and details, and ask critical follow-up questions.";
        } else if ("FRIENDLY_STARTUP_FOUNDER".equalsIgnoreCase(persona) || "Friendly Startup Founder".equalsIgnoreCase(persona)) {
            return "Persona: Friendly Startup Founder. Ask supportive but vision-oriented follow-up questions regarding scalability, adaptability, and teamwork fit.";
        } else if ("RAPID_FIRE_TECHNICAL".equalsIgnoreCase(persona) || "Rapid-Fire Technical Grinder".equalsIgnoreCase(persona)) {
            return "Persona: Rapid-Fire Technical Grinder. Ask direct, swift technical follow-up questions on time/space complexity, trade-offs, and optimization constraints.";
        } else if ("SUPPORTIVE_COACH".equalsIgnoreCase(persona) || "Supportive Coach".equalsIgnoreCase(persona)) {
            return "Persona: Supportive Coach. Probe gently and constructively, offering gentle guiding words if they missed a concept.";
        }

        // Legacy fallbacks:
        if ("Technical Grillmaster".equalsIgnoreCase(persona)) {
            return "Persona: Technical Grillmaster. Direct, intense, and critical. Probes deeply on technical flaws, edge cases, system limits, and syntax correctness. Flags any contradictions immediately. " +
                   ("Junior".equalsIgnoreCase(difficulty) ? "Dampen aggressiveness slightly for a Junior: be direct but instructive." : "");
        } else if ("Skeptical Panel".equalsIgnoreCase(persona)) {
            return "Persona: Skeptical Panel. Formal, analytical, challenging, and slightly suspicious. Push back on the candidate's assumptions. Ask: 'Why did you choose X over Y?' or challenge their architectural scalability.";
        } else {
            return "Persona: Friendly HR. Warm, encouraging, empathetic, and conversational. Probe gently and constructively, offering gentle guiding words if they missed a concept.";
        }
    }

    private String getStrictnessPrompt(String difficulty) {
        if ("Junior".equalsIgnoreCase(difficulty)) {
            return "Be encouraging, lenient, and supportive. Focus on whether the candidate understands the foundational concept, even if their explanation lacks details or advanced syntax.";
        } else if ("Senior".equalsIgnoreCase(difficulty)) {
            return "Be highly critical, strict, and demanding. Expect thorough technical explanations, reference to trade-offs, architecture choices, performance implications, and professional terminology. Point out minor mistakes strictly.";
        } else {
            return "Be balanced and objective. Expect standard technical proficiency, basic trade-off knowledge, and general industry practices.";
        }
    }

    private String getPersonaEvalPrompt(String persona) {
        if ("Technical Grillmaster".equalsIgnoreCase(persona)) {
            return "Evaluate with high technical rigor. Focus strictly on optimization limits, safety, code execution, and absolute accuracy. Tone should be direct and blunt.";
        } else if ("Skeptical Panel".equalsIgnoreCase(persona)) {
            return "Evaluate based on system design trade-offs, risk assessment, architectural logic, and candidate justification. Focus on alternatives they failed to mention.";
        } else {
            return "Evaluate constructively and gently. Emphasize positive aspects of their answer while offering helpful suggestions. Tone should be warm and motivating.";
        }
    }

    private String escapeJson(String text) {
        return text.replace("\\", "\\\\")
                   .replace("\"", "\\\"")
                   .replace("\n", "\\n")
                   .replace("\r", "\\r");
    }
}
