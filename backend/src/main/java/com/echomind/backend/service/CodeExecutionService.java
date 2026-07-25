package com.echomind.backend.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.FileWriter;
import java.nio.file.Files;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
public class CodeExecutionService {

    private final GeminiService geminiService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public Map<String, Object> executeCode(String language, String code, String testCasesJson) {
        Map<String, Object> response = new HashMap<>();
        
        if (!"javascript".equalsIgnoreCase(language) && !"js".equalsIgnoreCase(language)) {
            String prompt = String.format(
                "You are an isolated sandbox code execution engine. Virtually execute the following program snippet in the specified programming language and verify if it passes the test cases.\n\n" +
                "Language: %s\n" +
                "Code:\n%s\n\n" +
                "Test Cases JSON:\n%s\n\n" +
                "Return ONLY a clean JSON list representing the verification results. Follow this structure precisely:\n" +
                "[\n" +
                "  { \"index\": 0, \"output\": \"[actual outcome/value as a string or number]\", \"expected\": \"[expected value]\", \"passed\": true/false, \"duration\": 15, \"error\": null }\n" +
                "]\n" +
                "Do NOT wrap with markdown code blocks (like ```json). Return only the raw JSON array. If there is a syntax/compilation error, set 'error' to the description of the compilation error.",
                language, code, testCasesJson
            );

            try {
                String rawJson = geminiService.callGeminiApi(prompt);
                if (rawJson.startsWith("```")) {
                    rawJson = rawJson.replaceAll("```json|```", "").trim();
                }
                List<Map<String, Object>> outcomes = objectMapper.readValue(rawJson, List.class);
                
                long passedCount = outcomes.stream().filter(o -> Boolean.TRUE.equals(o.get("passed"))).count();
                int score = (int) Math.round((double) passedCount / outcomes.size() * 100);
                
                response.put("success", true);
                response.put("results", outcomes);
                response.put("score", score);
                return response;
            } catch (Exception e) {
                System.err.println("Gemini virtual code run failed: " + e.getMessage());
                response.put("success", false);
                response.put("error", "Code compilation or sandbox execution failed: " + e.getMessage());
                return response;
            }
        }

        File tempFile = null;
        try {
            // Parse test cases
            List<Map<String, Object>> testCases = objectMapper.readValue(testCasesJson, List.class);
            
            // Build the wrapper JavaScript code
            StringBuilder scriptBuilder = new StringBuilder();
            scriptBuilder.append(code).append("\n\n");
            scriptBuilder.append("const testCases = ").append(testCasesJson).append(";\n");
            scriptBuilder.append("const results = [];\n");
            scriptBuilder.append("for (let i = 0; i < testCases.length; i++) {\n");
            scriptBuilder.append("  try {\n");
            scriptBuilder.append("    // Parse the input\n");
            scriptBuilder.append("    const input = JSON.parse(testCases[i].input);\n");
            scriptBuilder.append("    const expected = JSON.parse(testCases[i].expected);\n");
            scriptBuilder.append("    \n");
            scriptBuilder.append("    // Find function name dynamically\n");
            scriptBuilder.append("    const funcName = 'solution'; // We'll assume the main function is named 'solution'\n");
            scriptBuilder.append("    // Alternatively find the first function defined in code\n");
            scriptBuilder.append("    let fn = typeof solution === 'function' ? solution : null;\n");
            scriptBuilder.append("    if (!fn) {\n");
            scriptBuilder.append("       // Try to extract first defined function name\n");
            scriptBuilder.append("       const matches = ").append("code".equals("code") ? "code" : "").append(".match(/function\\s+(\\w+)/);\n");
            scriptBuilder.append("       if (matches && matches[1]) {\n");
            scriptBuilder.append("          fn = global[matches[1]] || eval(matches[1]);\n");
            scriptBuilder.append("       }\n");
            scriptBuilder.append("    }\n");
            scriptBuilder.append("    if (!fn) {\n");
            scriptBuilder.append("       throw new Error('No function found. Please name your entry function solution().');\n");
            scriptBuilder.append("    }\n");
            scriptBuilder.append("    \n");
            scriptBuilder.append("    const startTime = Date.now();\n");
            scriptBuilder.append("    const output = Array.isArray(input) ? fn(...input) : fn(input);\n");
            scriptBuilder.append("    const duration = Date.now() - startTime;\n");
            scriptBuilder.append("    \n");
            scriptBuilder.append("    // Compare JSON structures\n");
            scriptBuilder.append("    const passed = JSON.stringify(output) === JSON.stringify(expected);\n");
            scriptBuilder.append("    results.push({ index: i, output, expected, passed, duration, error: null });\n");
            scriptBuilder.append("  } catch(e) {\n");
            scriptBuilder.append("    results.push({ index: i, output: null, expected: null, passed: false, duration: 0, error: e.message });\n");
            scriptBuilder.append("  }\n");
            scriptBuilder.append("}\n");
            scriptBuilder.append("console.log('===RESULT_START===');\n");
            scriptBuilder.append("console.log(JSON.stringify(results));\n");

            // Write to a temporary file
            tempFile = File.createTempFile("sandbox_", ".js");
            try (FileWriter writer = new FileWriter(tempFile)) {
                writer.write(scriptBuilder.toString());
            }

            // Execute process
            ProcessBuilder pb = new ProcessBuilder("node", tempFile.getAbsolutePath());
            pb.redirectErrorStream(true);
            Process process = pb.start();

            // Setup safety timeout
            boolean finished = process.waitFor(5, TimeUnit.SECONDS);
            if (!finished) {
                process.destroyForcibly();
                response.put("success", false);
                response.put("error", "Execution Timeout (Max 5 seconds)");
                return response;
            }

            // Read output
            String outputStr = new String(process.getInputStream().readAllBytes());
            int codeStart = outputStr.indexOf("===RESULT_START===");
            if (codeStart == -1) {
                response.put("success", false);
                response.put("error", "Syntax or runtime execution error:\n" + outputStr);
                return response;
            }

            String jsonPart = outputStr.substring(codeStart + "===RESULT_START===".length()).trim();
            List<Map<String, Object>> outcomes = objectMapper.readValue(jsonPart, List.class);
            
            response.put("success", true);
            response.put("results", outcomes);
            
            // Calculate overall score
            long passedCount = outcomes.stream().filter(o -> (Boolean) o.get("passed")).count();
            int score = (int) Math.round((double) passedCount / outcomes.size() * 100);
            response.put("score", score);

        } catch (Exception e) {
            response.put("success", false);
            response.put("error", "Sandbox execution failed: " + e.getMessage());
        } finally {
            if (tempFile != null && tempFile.exists()) {
                tempFile.delete();
            }
        }
        return response;
    }
}
