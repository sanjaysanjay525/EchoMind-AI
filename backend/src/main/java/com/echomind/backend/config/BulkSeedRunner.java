package com.echomind.backend.config;

import com.echomind.backend.model.*;
import com.echomind.backend.repository.*;
import com.echomind.backend.service.CodeExecutionService;
import com.echomind.backend.service.GeminiService;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.*;

@Component
@RequiredArgsConstructor
@SuppressWarnings("unchecked")
public class BulkSeedRunner implements CommandLineRunner {

    private final RoleRepository roleRepository;
    private final AptitudeQuestionRepository aptitudeQuestionRepository;
    private final CommunicationQuestionRepository communicationQuestionRepository;
    private final CodingProblemRepository codingProblemRepository;
    private final GeminiService geminiService;
    private final CodeExecutionService codeExecutionService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public void run(String... args) throws Exception {
        boolean trigger = false;
        boolean force = false;
        String rolesFilter = null;

        for (String arg : args) {
            if ("--seed-questions".equalsIgnoreCase(arg)) {
                trigger = true;
            } else if ("--force".equalsIgnoreCase(arg)) {
                force = true;
            } else if (arg.startsWith("--roles=")) {
                rolesFilter = arg.substring("--roles=".length()).trim();
            }
        }

        if (!trigger) {
            return;
        }

        System.out.println("\n=======================================================");
        System.out.println("====== ECHO MIND AI: BULK QUESTION SEED RUNNER ======");
        System.out.println("=======================================================");
        System.out.println("Force Overwrite (--force): " + force);
        System.out.println("Roles Filter: " + (rolesFilter != null ? rolesFilter : "All"));

        List<Role> allRoles = roleRepository.findAll();
        List<Role> targetRoles = new ArrayList<>();

        if (rolesFilter != null && !rolesFilter.isEmpty()) {
            Set<String> filterSet = new HashSet<>(Arrays.asList(rolesFilter.toLowerCase().split(",")));
            for (Role r : allRoles) {
                if (filterSet.contains(r.getId().toLowerCase()) || filterSet.contains(r.getTitle().toLowerCase().replace(" ", "-"))) {
                    targetRoles.add(r);
                }
            }
        } else {
            targetRoles = allRoles;
        }

        System.out.println("Target Curated Roles Count: " + targetRoles.size());
        if (targetRoles.isEmpty()) {
            System.out.println("No matching roles found to seed. Exiting.");
            return;
        }

        System.out.println("\nStarting seed operations... (Sequential LLM execution to avoid rate limits)\n");

        int processed = 0;
        int skipped = 0;

        for (int i = 0; i < targetRoles.size(); i++) {
            Role role = targetRoles.get(i);
            String prefix = String.format("Role %d/%d [%s]: ", (i + 1), targetRoles.size(), role.getTitle());

            // Check if already seeded (resumability)
            long existingCount = aptitudeQuestionRepository.countByRoleIdAndSource(role.getId(), "batch_seeded") +
                    communicationQuestionRepository.countByRoleIdAndSource(role.getId(), "batch_seeded") +
                    codingProblemRepository.countByRoleIdAndSource(role.getId(), "batch_seeded");

            if (existingCount > 0 && !force) {
                System.out.println(prefix + "Already seeded (" + existingCount + " items). Skipping. (Pass --force to overwrite)");
                skipped++;
                continue;
            }

            System.out.println(prefix + "Clearing existing batch seeded questions...");
            aptitudeQuestionRepository.deleteByRoleIdAndSource(role.getId(), "batch_seeded");
            communicationQuestionRepository.deleteByRoleIdAndSource(role.getId(), "batch_seeded");
            codingProblemRepository.deleteByRoleIdAndSource(role.getId(), "batch_seeded");

            // 1. Generate Aptitude
            try {
                System.out.println(prefix + "Generating baseline Aptitude questions...");
                List<AptitudeQuestion> aptitudeList = generateAptitudeForRole(role);
                aptitudeQuestionRepository.saveAll(aptitudeList);
                System.out.println(prefix + "Saved " + aptitudeList.size() + " Aptitude MCQs.");
            } catch (Exception e) {
                System.err.println(prefix + "Failed to seed Aptitude: " + e.getMessage());
            }
            sleepDelay();

            // 2. Generate Communication
            try {
                System.out.println(prefix + "Generating baseline Communication questions...");
                List<CommunicationQuestion> commList = generateCommunicationForRole(role);
                communicationQuestionRepository.saveAll(commList);
                System.out.println(prefix + "Saved " + commList.size() + " Communication prompts.");
            } catch (Exception e) {
                System.err.println(prefix + "Failed to seed Communication: " + e.getMessage());
            }
            sleepDelay();

            // 3. Generate Coding / Advanced (only if Tech & Engineering category)
            boolean isTechnical = "Tech & Engineering".equalsIgnoreCase(role.getCategory()) ||
                    role.getTitle().toLowerCase().contains("developer") ||
                    role.getTitle().toLowerCase().contains("engineer") ||
                    role.getTitle().toLowerCase().contains("architect") ||
                    role.getTitle().toLowerCase().contains("programmer");

            if (isTechnical) {
                // Generate Coding Problems
                try {
                    System.out.println(prefix + "Generating baseline Coding problems...");
                    List<CodingProblem> codingList = generateCodingForRole(role);
                    codingProblemRepository.saveAll(codingList);
                    System.out.println(prefix + "Saved " + codingList.size() + " validated Coding problems.");
                } catch (Exception e) {
                    System.err.println(prefix + "Failed to seed Coding: " + e.getMessage());
                }
                sleepDelay();

                // Generate Advanced System Design
                try {
                    System.out.println(prefix + "Generating baseline Advanced/System Design questions...");
                    List<CodingProblem> advancedList = generateAdvancedForRole(role);
                    codingProblemRepository.saveAll(advancedList);
                    System.out.println(prefix + "Saved " + advancedList.size() + " Advanced System Design scenarios.");
                } catch (Exception e) {
                    System.err.println(prefix + "Failed to seed Advanced: " + e.getMessage());
                }
                sleepDelay();
            } else {
                System.out.println(prefix + "Non-technical category role. Skipping Coding and Advanced rounds.");
            }

            processed++;
        }

        System.out.println("\n=======================================================");
        System.out.println("====== SEED RUN COMPLETED SUCCESSFULLY! ======");
        System.out.println("=======================================================");
        System.out.println("Processed roles: " + processed);
        System.out.println("Skipped roles: " + skipped);
        System.out.println("=======================================================\n");

        System.exit(0);
    }

    private List<AptitudeQuestion> generateAptitudeForRole(Role role) throws Exception {
        String prompt = String.format(
                "You are an Aptitude test writer. Generate exactly 10 multiple choice questions. " +
                "The questions should consist of 4 QUANT, 3 LOGICAL, and 3 VERBAL categories. " +
                "Incorporate themes relevant to the category of '%s' (e.g. data or stats metrics matching technical/analytics, logical business matching PM, verbal client communication matching sales/marketing).\n" +
                "Generate 5 matching BEGINNER difficulty level and 5 matching PROFESSIONAL difficulty level.\n\n" +
                "Return ONLY a clean JSON array matching this schema precisely without markdown wraps (no ```json):\n" +
                "[\n" +
                "  {\n" +
                "    \"category\": \"[QUANT, LOGICAL, or VERBAL]\",\n" +
                "    \"difficulty\": \"[BEGINNER or PROFESSIONAL]\",\n" +
                "    \"questionText\": \"[Question prompt text]\",\n" +
                "    \"options\": [\"Option A\", \"Option B\", \"Option C\", \"Option D\"],\n" +
                "    \"correctAnswerIndex\": [0, 1, 2, or 3]\n" +
                "  }\n" +
                "]",
                role.getCategory()
        );

        String json = cleanJson(geminiService.callGeminiApi(prompt));
        List<AptitudeQuestion> list = objectMapper.readValue(json, new TypeReference<List<AptitudeQuestion>>() {});
        for (AptitudeQuestion q : list) {
            q.setRoleId(role.getId());
            q.setSource("batch_seeded");
        }
        return list;
    }

    private List<CommunicationQuestion> generateCommunicationForRole(Role role) throws Exception {
        String prompt = String.format(
                "You are an HR recruiter. Generate exactly 10 behavioral and situational communication interview questions tailored for a candidate interviewing for the role of '%s' (Category: %s).\n" +
                "Pre-populate 5 for BEGINNER difficulty and 5 for PROFESSIONAL difficulty level.\n" +
                "Questions should focus on topics such as prioritization, collaboration, conflict resolution, or client interactions relevant to '%s'.\n\n" +
                "Return ONLY a clean JSON array matching this schema precisely without markdown wraps:\n" +
                "[\n" +
                "  {\n" +
                "    \"careerPath\": \"%s\",\n" +
                "    \"questionText\": \"[Tailored behavioral question text]\",\n" +
                "    \"expectedThemes\": [\"theme1\", \"theme2\", \"theme3\"],\n" +
                "    \"idealAnswerStructure\": \"STAR\"\n" +
                "  }\n" +
                "]",
                role.getTitle(), role.getCategory(), role.getTitle(), role.getTitle()
        );

        String json = cleanJson(geminiService.callGeminiApi(prompt));
        List<CommunicationQuestion> list = objectMapper.readValue(json, new TypeReference<List<CommunicationQuestion>>() {});
        for (CommunicationQuestion q : list) {
            q.setRoleId(role.getId());
            q.setSource("batch_seeded");
        }
        return list;
    }

    private List<CodingProblem> generateCodingForRole(Role role) throws Exception {
        List<CodingProblem> problems = new ArrayList<>();
        // Generate 3 problems (Easy in JavaScript, Medium in Python, Hard in Java)
        String[] difficulties = {"Easy", "Medium", "Hard"};
        String[] languages = {"JavaScript", "Python", "Java"};

        for (int j = 0; j < 3; j++) {
            String diff = difficulties[j];
            String lang = languages[j];
            
            boolean validated = false;
            int attempts = 0;
            while (!validated && attempts < 3) {
                attempts++;
                try {
                    String prompt = String.format(
                            "You are a programming interviewer. Generate ONE coding problem for a candidate interviewing for '%s' at difficulty '%s' in language '%s'.\n" +
                            "Choose a problem theme aligned with typical workloads for this role.\n\n" +
                            "JSON Output Schema (Return ONLY this clean JSON object, no markdown code block formatting):\n" +
                            "{\n" +
                            "  \"title\": \"[Short problem title]\",\n" +
                            "  \"description\": \"[Markdown description of problem, parameters, constraints, and 2 examples]\",\n" +
                            "  \"difficulty\": \"%s\",\n" +
                            "  \"careerPath\": \"%s\",\n" +
                            "  \"templateCode\": \"[Starter code block skeleton for candidate in target language: %s]\",\n" +
                            "  \"testCasesJson\": \"[JSON string containing exactly 3 test cases: [ { \\\"input\\\": \\\"[arg1, arg2]\\\", \\\"expected\\\": \\\"value\\\" }, ... ] ]\",\n" +
                            "  \"referenceSolutionJavaScript\": \"[A complete working reference solution function in JavaScript/Node.js, named solution, to solve the problem]\"\n" +
                            "}",
                            role.getTitle(), diff, lang, diff, role.getTitle(), lang
                    );

                    String json = cleanJson(geminiService.callGeminiApi(prompt));
                    CodingProblem problem = objectMapper.readValue(json, CodingProblem.class);
                    
                    // Run sandbox validation check
                    Map<String, Object> validationRun = codeExecutionService.executeCode("javascript", problem.getReferenceSolutionJavaScript(), problem.getTestCasesJson());
                    if (Boolean.TRUE.equals(validationRun.get("success")) && Integer.valueOf(100).equals(validationRun.get("score"))) {
                        problem.setRoleId(role.getId());
                        problem.setSource("batch_seeded");
                        problem.setLanguage(lang);
                        problems.add(problem);
                        validated = true;
                    } else {
                        System.err.println("  -> Coding problem validation failed (Attempt " + attempts + "/3): " + validationRun.get("error"));
                    }
                } catch (Exception e) {
                    System.err.println("  -> Error generating coding problem (Attempt " + attempts + "/3): " + e.getMessage());
                }
                if (!validated) {
                    sleepDelay();
                }
            }
        }
        return problems;
    }

    private List<CodingProblem> generateAdvancedForRole(Role role) throws Exception {
        String prompt = String.format(
                "You are a Principal Software Architect.\n" +
                "Generate exactly 4 advanced system architecture design challenges tailored for a candidate interviewing for the role '%s'.\n" +
                "Format as a JSON array matching this schema precisely without markdown wraps:\n" +
                "[\n" +
                "  {\n" +
                "    \"title\": \"[Advanced System Design Title]\",\n" +
                "    \"description\": \"[Detailed markdown description of the architectural requirements, expected traffic load, and scaling challenges candidate must address]\",\n" +
                "    \"difficulty\": \"Hard\",\n" +
                "    \"careerPath\": \"%s\",\n" +
                "    \"templateCode\": \"\",\n" +
                "    \"testCasesJson\": \"[]\",\n" +
                "    \"gradingCriteria\": [\"grading point 1\", \"grading point 2\"],\n" +
                "    \"idealTopicsCovered\": [\"topic 1\", \"topic 2\"]\n" +
                "  }\n" +
                "]",
                role.getTitle(), role.getTitle()
        );

        String json = cleanJson(geminiService.callGeminiApi(prompt));
        List<CodingProblem> list = objectMapper.readValue(json, new TypeReference<List<CodingProblem>>() {});
        for (CodingProblem p : list) {
            p.setRoleId(role.getId());
            p.setSource("batch_seeded");
        }
        return list;
    }

    private String cleanJson(String raw) {
        if (raw.startsWith("```")) {
            raw = raw.replaceAll("```json|```", "").trim();
        }
        return raw.trim();
    }

    private void sleepDelay() {
        try {
            Thread.sleep(1500); // 1.5 seconds delay between LLM calls to avoid rate limiting
        } catch (InterruptedException ignored) {}
    }
}
