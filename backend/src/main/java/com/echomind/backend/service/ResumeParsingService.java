package com.echomind.backend.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.echomind.backend.model.ResumeProfile;
import lombok.RequiredArgsConstructor;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.apache.poi.xwpf.extractor.XWPFWordExtractor;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ResumeParsingService {

    private final GeminiService geminiService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public String parseToText(MultipartFile file) {
        try {
            String filename = file.getOriginalFilename();
            if (filename == null) {
                return "";
            }
            try (InputStream is = file.getInputStream()) {
                if (filename.toLowerCase().endsWith(".pdf")) {
                    return parsePdf(is);
                } else if (filename.toLowerCase().endsWith(".docx")) {
                    return parseDocx(is);
                } else {
                    return new String(file.getBytes());
                }
            }
        } catch (Exception e) {
            System.err.println("File parsing failed: " + e.getMessage());
            return "";
        }
    }

    public List<String> parseAndExtractKeywords(MultipartFile file) {
        String content = parseToText(file);

        if (content.trim().isEmpty()) {
            return new ArrayList<>();
        }

        // Call Gemini to parse and return skills keywords
        String prompt = String.format(
            "Analyze the following candidate resume profile text and extract exactly 10 key technical skills, frameworks, or experience keywords.\n" +
            "Return ONLY a clean JSON object containing:\n" +
            "{\n" +
            "  \"keywords\": [\"React\", \"Java\", \"MongoDB\", ...]\n" +
            "}\n" +
            "Do NOT include markdown block ticks like ```json or any explanation.\n\n" +
            "Resume Text:\n%s", content
        );

        try {
            String rawJson = geminiService.callGeminiApi(prompt);
            if (rawJson.startsWith("```")) {
                rawJson = rawJson.replaceAll("```json|```", "").trim();
            }
            Map<String, List<String>> result = objectMapper.readValue(rawJson, new TypeReference<Map<String, List<String>>>() {});
            return result.getOrDefault("keywords", new ArrayList<>());
        } catch (Exception e) {
            System.err.println("Gemini keyword extraction failed: " + e.getMessage());
            // Safe fallback
            return List.of("Software Engineering", "Problem Solving", "Object-Oriented Programming");
        }
    }

    private String parsePdf(InputStream is) throws Exception {
        try (PDDocument document = PDDocument.load(is)) {
            PDFTextStripper stripper = new PDFTextStripper();
            return stripper.getText(document);
        }
    }

    private String parseDocx(InputStream is) throws Exception {
        try (XWPFDocument doc = new XWPFDocument(is)) {
            XWPFWordExtractor extractor = new XWPFWordExtractor(doc);
            return extractor.getText();
        }
    }

    public Map<String, Object> analyzeResume(MultipartFile file, String desiredRole, String jobDescription) {
        String resumeText = parseToText(file);
        if (resumeText.trim().isEmpty()) {
            throw new IllegalArgumentException("Could not extract any text from the uploaded resume file.");
        }

        String jdSection = (jobDescription != null && !jobDescription.trim().isEmpty()) 
            ? String.format("Job Description:\n%s\n", jobDescription) : "";

        String prompt = String.format(
            "You are an expert AI Resume Matcher and Recruiting Assistant.\n" +
            "Analyze the candidate's resume text against the desired target job role and optional job description.\n\n" +
            "Desired Role: %s\n" +
            "%s\n" +
            "Candidate Resume:\n%s\n\n" +
            "Return ONLY a clean JSON object. Do not include markdown code block wraps like ```json or any explanation. Output schema must match:\n" +
            "{\n" +
            "  \"matchScore\": [an integer between 0 and 100 representing how well candidate skills match the role requirements],\n" +
            "  \"matchedKeywords\": [\"Java\", \"Spring Boot\", ...],\n" +
            "  \"missingKeywords\": [\"Kubernetes\", \"CI/CD\", ...],\n" +
            "  \"strengths\": [\"Strong foundation in backend APIs\", ...],\n" +
            "  \"gaps\": [\"Lacks cloud deployment experience\", ...],\n" +
            "  \"suggestions\": [\"Add docker projects to resume\", ...]\n" +
            "}",
            desiredRole, jdSection, resumeText
        );

        try {
            String rawJson = geminiService.callGeminiApi(prompt);
            if (rawJson.startsWith("```")) {
                rawJson = rawJson.replaceAll("```json|```", "").trim();
            }
            return objectMapper.readValue(rawJson, new TypeReference<Map<String, Object>>() {});
        } catch (Exception e) {
            System.err.println("Resume analysis failed: " + e.getMessage());
            return Map.of(
                "matchScore", 60,
                "matchedKeywords", List.of("Software Development"),
                "missingKeywords", List.of("Cloud Infrastructure"),
                "strengths", List.of("Solid experience mapping core logic."),
                "gaps", List.of("No cloud integrations visible."),
                "suggestions", List.of("Incorporate projects indicating cloud environments.")
            );
        }
    }

    public Map<String, Object> parseStructured(MultipartFile file) {
        String text = parseToText(file);
        if (text.trim().isEmpty()) {
            return new HashMap<>();
        }

        String prompt = String.format(
            "You are a structured CV data extraction engine. Analyze the resume profile text below and extract contact details, summary, experience list, education list, skills, and projects list.\n\n" +
            "Return ONLY a clean JSON object without markdown wraps or explanations. Follow this JSON schema exactly:\n" +
            "{\n" +
            "  \"contact\": { \"name\": \"\", \"email\": \"\", \"phone\": \"\", \"location\": \"\", \"website\": \"\" },\n" +
            "  \"summary\": \"\",\n" +
            "  \"experience\": [\n" +
            "     { \"company\": \"\", \"role\": \"\", \"startDate\": \"\", \"endDate\": \"\", \"description\": \"\" }\n" +
            "  ],\n" +
            "  \"education\": [\n" +
            "     { \"school\": \"\", \"degree\": \"\", \"gradDate\": \"\", \"description\": \"\" }\n" +
            "  ],\n" +
            "  \"skills\": [\"React\", \"Java\", ...],\n" +
            "  \"projects\": [\n" +
            "     { \"name\": \"\", \"technologies\": \"\", \"description\": \"\", \"link\": \"\" }\n" +
            "  ]\n" +
            "}\n\n" +
            "Resume Text:\n%s",
            text
        );

        try {
            String rawJson = geminiService.callGeminiApi(prompt);
            if (rawJson.startsWith("```")) {
                rawJson = rawJson.replaceAll("```json|```", "").trim();
            }
            return objectMapper.readValue(rawJson, new TypeReference<Map<String, Object>>() {});
        } catch (Exception e) {
            System.err.println("Gemini structured extraction failed: " + e.getMessage());
            return new HashMap<>();
        }
    }

    public ResumeProfile extractResumeProfile(MultipartFile file) {
        String text = parseToText(file);
        if (text.trim().isEmpty()) {
            return null;
        }

        String prompt = String.format(
            "You are a structured CV data extraction engine. Analyze the resume profile text below and extract technical skills, tools, years of experience, past roles, domains, and notable projects.\n" +
            "Do NOT extract or include any PII (personal identifying information) such as candidate name, email address, phone number, physical address, or links to personal social media.\n\n" +
            "Return ONLY a clean JSON object without markdown wraps or explanations. Follow this JSON schema exactly:\n" +
            "{\n" +
            "  \"technicalSkills\": [\"React\", \"Java\", ...],\n" +
            "  \"tools\": [\"Docker\", \"Kubernetes\", \"Figma\", ...],\n" +
            "  \"yearsOfExperience\": [integer or null if not clear],\n" +
            "  \"pastRoles\": [\"Software Engineer\", \"Product Manager\", ...],\n" +
            "  \"domains\": [\"fintech\", \"e-commerce\", \"healthcare\", ...],\n" +
            "  \"notableProjects\": [\"Payment gateway rebuild\", \"Inventory management dashboard\", ...]\n" +
            "}\n\n" +
            "Resume Text:\n%s",
            text
        );

        try {
            String rawJson = geminiService.callGeminiApi(prompt);
            if (rawJson.startsWith("```")) {
                rawJson = rawJson.replaceAll("```json|```", "").trim();
            }
            return objectMapper.readValue(rawJson, ResumeProfile.class);
        } catch (Exception e) {
            System.err.println("Gemini resume profile extraction failed: " + e.getMessage());
            return null;
        }
    }
}
