package com.echomind.backend.service;

import com.echomind.backend.model.*;
import com.echomind.backend.repository.*;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.lowagie.text.*;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import org.springframework.stereotype.Service;

import java.awt.Color;
import java.io.File;
import java.io.FileOutputStream;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.io.ByteArrayOutputStream;
import java.util.Map;

@Service
public class FinalReportService {

    private final FinalReportRepository finalReportRepository;
    private final InterviewRepository interviewRepository;
    private final InterviewContextRepository contextRepository;
    private final VisionService visionService;
    private final ConsistencyAnalyzerService consistencyAnalyzerService;
    private final GeminiService geminiService;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public FinalReportService(FinalReportRepository finalReportRepository,
                              InterviewRepository interviewRepository,
                              InterviewContextRepository contextRepository,
                              VisionService visionService,
                              ConsistencyAnalyzerService consistencyAnalyzerService,
                              GeminiService geminiService,
                              UserRepository userRepository) {
        this.finalReportRepository = finalReportRepository;
        this.interviewRepository = interviewRepository;
        this.contextRepository = contextRepository;
        this.visionService = visionService;
        this.consistencyAnalyzerService = consistencyAnalyzerService;
        this.geminiService = geminiService;
        this.userRepository = userRepository;
    }

    public FinalReport generateReport(String interviewId) {
        Interview interview = interviewRepository.findById(interviewId)
                .orElseThrow(() -> new RuntimeException("Interview not found"));
        
        User user = userRepository.findById(interview.getUserId()).orElse(null);
        String candidateName = user != null ? user.getName() : "Unknown Candidate";

        List<InterviewContext> answers = contextRepository.findByInterviewIdOrderBySequenceNumberAsc(interviewId);
        
        // Fetch external scores
        VisionAnalysis vision = null;
        try {
            vision = visionService.getReport(interviewId);
        } catch (Exception e) {
            // Ignore if not present
        }
        
        ConsistencyAnalysis consistency = consistencyAnalyzerService.getReport(interviewId);
        
        int eyeContactScore = vision != null ? vision.getEyeContactScore() : 80;
        int attentionScore = vision != null ? vision.getAttentionScore() : 80;
        int consistencyScore = consistency != null ? consistency.getConsistencyScore() : 80;

        // Generate AI Analysis
        AiAssessmentResult aiResult = getAiAssessment(interview, answers);

        // Calculate overall score
        int overallScore = (aiResult.technicalScore + aiResult.communicationScore + eyeContactScore + attentionScore + consistencyScore) / 5;

        // Ensure directory exists
        String dirPath = "uploads/reports";
        File dir = new File(dirPath);
        if (!dir.exists()) {
            dir.mkdirs();
        }

        String pdfFileName = "Report_" + interviewId + "_" + System.currentTimeMillis() + ".pdf";
        String pdfPath = dirPath + "/" + pdfFileName;

        FinalReport.Roadmap roadmap = FinalReport.Roadmap.builder()
                .oneWeekPlan(aiResult.roadmap1Week)
                .oneMonthPlan(aiResult.roadmap1Month)
                .threeMonthPlan(aiResult.roadmap3Month)
                .build();

        FinalReport finalReport = FinalReport.builder()
                .interviewId(interviewId)
                .technicalScore(aiResult.technicalScore)
                .communicationScore(aiResult.communicationScore)
                .eyeContactScore(eyeContactScore)
                .attentionScore(attentionScore)
                .consistencyScore(consistencyScore)
                .overallScore(overallScore)
                .strengths(aiResult.strengths)
                .weaknesses(aiResult.weaknesses)
                .roadmap(roadmap)
                .summary(aiResult.summary)
                .pdfPath(pdfPath)
                .createdAt(LocalDateTime.now())
                .build();

        generatePdf(pdfPath, finalReport, interview, candidateName, vision, consistency);

        return finalReportRepository.save(finalReport);
    }

    public Optional<FinalReport> getReportByInterviewId(String interviewId) {
        return finalReportRepository.findByInterviewId(interviewId);
    }

    private AiAssessmentResult getAiAssessment(Interview interview, List<InterviewContext> answers) {
        StringBuilder prompt = new StringBuilder();
        prompt.append("You are an expert AI Interview Assessor. Analyze the following interview transcript and generate a JSON evaluation. ");
        prompt.append("The JSON MUST be valid and strictly follow this schema:\n");
        prompt.append("{\n");
        prompt.append("  \"technicalScore\": integer (0-100),\n");
        prompt.append("  \"communicationScore\": integer (0-100),\n");
        prompt.append("  \"strengths\": [\"string\", \"string\", \"string\", \"string\", \"string\"],\n");
        prompt.append("  \"weaknesses\": [\"string\", \"string\", \"string\", \"string\", \"string\"],\n");
        prompt.append("  \"roadmap1Week\": \"string\",\n");
        prompt.append("  \"roadmap1Month\": \"string\",\n");
        prompt.append("  \"roadmap3Month\": \"string\",\n");
        prompt.append("  \"summary\": \"string\"\n");
        prompt.append("}\n\n");
        prompt.append("Domain: ").append(interview.getDomain()).append("\n");
        prompt.append("Difficulty: ").append(interview.getDifficulty()).append("\n\n");
        prompt.append("Transcript:\n");

        for (InterviewContext ctx : answers) {
            prompt.append("Q: ").append(ctx.getQuestion()).append("\n");
            prompt.append("A: ").append(ctx.getAnswer() != null ? ctx.getAnswer() : "No answer provided").append("\n\n");
        }

        AiAssessmentResult result = new AiAssessmentResult();
        try {
            String geminiResponse = geminiService.callGeminiApi(prompt.toString());
            String jsonStr = extractJsonFromResponse(geminiResponse);
            JsonNode rootNode = objectMapper.readTree(jsonStr);

            result.technicalScore = rootNode.path("technicalScore").asInt(75);
            result.communicationScore = rootNode.path("communicationScore").asInt(75);
            result.strengths = extractListFromJsonArray(rootNode.path("strengths"));
            result.weaknesses = extractListFromJsonArray(rootNode.path("weaknesses"));
            result.roadmap1Week = rootNode.path("roadmap1Week").asText("Review core concepts.");
            result.roadmap1Month = rootNode.path("roadmap1Month").asText("Build a small project.");
            result.roadmap3Month = rootNode.path("roadmap3Month").asText("Prepare for advanced topics and system design.");
            result.summary = rootNode.path("summary").asText("The candidate performed reasonably well, showing good potential.");

        } catch (Exception e) {
            System.err.println("Error parsing AI response for assessment: " + e.getMessage());
            result.technicalScore = 70;
            result.communicationScore = 70;
            result.strengths = List.of("Good effort", "Communicates adequately", "Basic knowledge", "Polite", "Willing to learn");
            result.weaknesses = List.of("Needs deeper technical knowledge", "Reduce filler words", "Improve confidence", "Be more concise", "Enhance problem solving");
            result.roadmap1Week = "Review fundamentals";
            result.roadmap1Month = "Practice coding";
            result.roadmap3Month = "Mock interviews";
            result.summary = "Unable to generate detailed AI summary due to an error, but default scores applied.";
        }
        return result;
    }

    private String extractJsonFromResponse(String response) {
        int startIndex = response.indexOf("{");
        int endIndex = response.lastIndexOf("}");
        if (startIndex != -1 && endIndex != -1) {
            return response.substring(startIndex, endIndex + 1);
        }
        return "{}";
    }

    private List<String> extractListFromJsonArray(JsonNode arrayNode) {
        List<String> list = new ArrayList<>();
        if (arrayNode != null && arrayNode.isArray()) {
            for (JsonNode node : arrayNode) {
                list.add(node.asText());
            }
        }
        // Ensure we have at least something if parsing fails
        if (list.isEmpty()) {
            list.add("N/A");
        }
        return list;
    }

    private void generatePdf(String pdfPath, FinalReport report, Interview interview, String candidateName, VisionAnalysis vision, ConsistencyAnalysis consistency) {
        try {
            Document document = new Document(PageSize.A4, 50, 50, 50, 50);
            PdfWriter.getInstance(document, new FileOutputStream(pdfPath));
            document.open();

            Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 24, Color.BLACK);
            Font headerFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 16, new Color(50, 50, 150));
            Font subHeaderFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12, Color.DARK_GRAY);
            Font normalFont = FontFactory.getFont(FontFactory.HELVETICA, 11, Color.BLACK);

            // Cover Page / Header
            Paragraph title = new Paragraph("Professional Interview Evaluation Report", titleFont);
            title.setAlignment(Element.ALIGN_CENTER);
            title.setSpacingAfter(20);
            document.add(title);

            // Summary
            Paragraph summaryTitle = new Paragraph("Executive Summary", headerFont);
            summaryTitle.setSpacingAfter(10);
            document.add(summaryTitle);
            Paragraph summaryBody = new Paragraph(report.getSummary(), normalFont);
            summaryBody.setSpacingAfter(20);
            document.add(summaryBody);

            // Candidate Details
            PdfPTable detailsTable = new PdfPTable(2);
            detailsTable.setWidthPercentage(100);
            detailsTable.setSpacingAfter(20);
            
            addTableCell(detailsTable, "Candidate Name:", subHeaderFont);
            addTableCell(detailsTable, candidateName, normalFont);
            addTableCell(detailsTable, "Domain:", subHeaderFont);
            addTableCell(detailsTable, interview.getDomain(), normalFont);
            addTableCell(detailsTable, "Difficulty:", subHeaderFont);
            addTableCell(detailsTable, interview.getDifficulty(), normalFont);
            addTableCell(detailsTable, "Date:", subHeaderFont);
            addTableCell(detailsTable, interview.getDate() != null ? interview.getDate().toString() : "N/A", normalFont);
            document.add(detailsTable);

            // Scores
            Paragraph scoresTitle = new Paragraph("Performance Scores", headerFont);
            scoresTitle.setSpacingAfter(10);
            document.add(scoresTitle);

            PdfPTable scoresTable = new PdfPTable(2);
            scoresTable.setWidthPercentage(100);
            scoresTable.setSpacingAfter(20);
            
            addTableCell(scoresTable, "Overall Score", subHeaderFont);
            addTableCell(scoresTable, report.getOverallScore() + " / 100", normalFont);
            addTableCell(scoresTable, "Technical Knowledge", subHeaderFont);
            addTableCell(scoresTable, report.getTechnicalScore() + " / 100", normalFont);
            addTableCell(scoresTable, "Communication", subHeaderFont);
            addTableCell(scoresTable, report.getCommunicationScore() + " / 100", normalFont);
            addTableCell(scoresTable, "Eye Contact", subHeaderFont);
            addTableCell(scoresTable, report.getEyeContactScore() + " / 100", normalFont);
            addTableCell(scoresTable, "Attention", subHeaderFont);
            addTableCell(scoresTable, report.getAttentionScore() + " / 100", normalFont);
            addTableCell(scoresTable, "Consistency (Memory)", subHeaderFont);
            addTableCell(scoresTable, report.getConsistencyScore() + " / 100", normalFont);
            
            document.add(scoresTable);

            // Strengths
            Paragraph strengthsTitle = new Paragraph("Top Strengths", headerFont);
            strengthsTitle.setSpacingAfter(10);
            document.add(strengthsTitle);
            com.lowagie.text.List strengthsList = new com.lowagie.text.List(com.lowagie.text.List.UNORDERED);
            for (String s : report.getStrengths()) {
                strengthsList.add(new ListItem(s, normalFont));
            }
            document.add(strengthsList);
            document.add(new Paragraph("\n"));

            // Weaknesses
            Paragraph weaknessesTitle = new Paragraph("Areas for Improvement", headerFont);
            weaknessesTitle.setSpacingAfter(10);
            document.add(weaknessesTitle);
            com.lowagie.text.List weaknessesList = new com.lowagie.text.List(com.lowagie.text.List.UNORDERED);
            for (String w : report.getWeaknesses()) {
                weaknessesList.add(new ListItem(w, normalFont));
            }
            document.add(weaknessesList);
            document.add(new Paragraph("\n"));

            // Roadmap
            Paragraph roadmapTitle = new Paragraph("Personalized Improvement Roadmap", headerFont);
            roadmapTitle.setSpacingAfter(10);
            document.add(roadmapTitle);

            document.add(new Paragraph("1 Week Plan:", subHeaderFont));
            document.add(new Paragraph(report.getRoadmap().getOneWeekPlan(), normalFont));
            document.add(new Paragraph("\n1 Month Plan:", subHeaderFont));
            document.add(new Paragraph(report.getRoadmap().getOneMonthPlan(), normalFont));
            document.add(new Paragraph("\n3 Month Plan:", subHeaderFont));
            document.add(new Paragraph(report.getRoadmap().getThreeMonthPlan(), normalFont));

            document.close();
        } catch (Exception e) {
            System.err.println("Error generating PDF: " + e.getMessage());
        }
    }

    private void addTableCell(PdfPTable table, String text, Font font) {
        PdfPCell cell = new PdfPCell(new Phrase(text, font));
        cell.setPadding(8);
        cell.setBorderColor(new Color(200, 200, 200));
        table.addCell(cell);
    }

    public byte[] generateConsolidatedPdfBytes(Map<String, Object> reportData) {
        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Document document = new Document(PageSize.A4, 50, 50, 50, 50);
            PdfWriter.getInstance(document, out);
            document.open();

            Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 20, Color.BLACK);
            Font headerFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 14, new Color(99, 102, 241)); // Indigo accent
            Font subHeaderFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 11, Color.DARK_GRAY);
            Font normalFont = FontFactory.getFont(FontFactory.HELVETICA, 10, Color.BLACK);

            // Title
            Paragraph title = new Paragraph("Consolidated Interview Evaluation Report", titleFont);
            title.setAlignment(Element.ALIGN_CENTER);
            title.setSpacingAfter(20);
            document.add(title);

            // Executive Summary Title
            Paragraph summaryTitle = new Paragraph("Executive Summary", headerFont);
            summaryTitle.setSpacingAfter(8);
            document.add(summaryTitle);
            
            String careerPath = "";
            String sessionId = "";
            if (reportData.get("session") instanceof InterviewSession) {
                InterviewSession session = (InterviewSession) reportData.get("session");
                careerPath = session.getCareerPath();
                sessionId = session.getId();
            } else if (reportData.get("session") instanceof Map) {
                Map<?, ?> sessionMap = (Map<?, ?>) reportData.get("session");
                careerPath = String.valueOf(sessionMap.get("careerPath"));
                sessionId = String.valueOf(sessionMap.get("id"));
            }

            Paragraph summaryBody = new Paragraph("This report compiles performance evaluations across all sequential rounds completed for the position of " + careerPath + ".", normalFont);
            summaryBody.setSpacingAfter(15);
            document.add(summaryBody);

            // Details Table
            PdfPTable detailsTable = new PdfPTable(2);
            detailsTable.setWidthPercentage(100);
            detailsTable.setSpacingAfter(15);
            
            addTableCell(detailsTable, "Session ID:", subHeaderFont);
            addTableCell(detailsTable, sessionId, normalFont);
            addTableCell(detailsTable, "Career Path:", subHeaderFont);
            addTableCell(detailsTable, careerPath, normalFont);
            addTableCell(detailsTable, "Overall Consolidated Score:", subHeaderFont);
            addTableCell(detailsTable, String.valueOf(reportData.get("overallScore")) + "%", normalFont);
            document.add(detailsTable);

            // Scores Table
            Paragraph scoresTitle = new Paragraph("Round-by-Round Breakdown", headerFont);
            scoresTitle.setSpacingAfter(8);
            document.add(scoresTitle);

            PdfPTable scoresTable = new PdfPTable(2);
            scoresTable.setWidthPercentage(100);
            scoresTable.setSpacingAfter(15);
            
            if (reportData.get("results") instanceof List) {
                List<?> results = (List<?>) reportData.get("results");
                for (Object resObj : results) {
                    if (resObj instanceof RoundResult) {
                        RoundResult r = (RoundResult) resObj;
                        addTableCell(scoresTable, r.getRoundType() + " Round", subHeaderFont);
                        addTableCell(scoresTable, r.getScore() + "%", normalFont);
                    } else if (resObj instanceof Map) {
                        Map<?, ?> rMap = (Map<?, ?>) resObj;
                        addTableCell(scoresTable, String.valueOf(rMap.get("roundType")) + " Round", subHeaderFont);
                        addTableCell(scoresTable, String.valueOf(rMap.get("score")) + "%", normalFont);
                    }
                }
            }
            document.add(scoresTable);

            // Strengths
            Paragraph strengthsTitle = new Paragraph("Top Strengths", headerFont);
            strengthsTitle.setSpacingAfter(8);
            document.add(strengthsTitle);
            com.lowagie.text.List strengthsList = new com.lowagie.text.List(com.lowagie.text.List.UNORDERED);
            if (reportData.get("strengths") instanceof List) {
                List<?> strengths = (List<?>) reportData.get("strengths");
                for (Object s : strengths) {
                    strengthsList.add(new ListItem(String.valueOf(s), normalFont));
                }
            }
            document.add(strengthsList);
            document.add(new Paragraph("\n"));

            // Areas for Improvement
            Paragraph improvementsTitle = new Paragraph("Areas for Improvement", headerFont);
            improvementsTitle.setSpacingAfter(8);
            document.add(improvementsTitle);
            com.lowagie.text.List improvementsList = new com.lowagie.text.List(com.lowagie.text.List.UNORDERED);
            if (reportData.get("improvements") instanceof List) {
                List<?> improvements = (List<?>) reportData.get("improvements");
                for (Object imp : improvements) {
                    improvementsList.add(new ListItem(String.valueOf(imp), normalFont));
                }
            }
            document.add(improvementsList);

            document.close();
            return out.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate consolidated PDF report", e);
        }
    }

    public java.util.Map<String, Object> getRolePercentile(String sessionId) {
        java.util.Optional<FinalReport> reportOpt = finalReportRepository.findByInterviewId(sessionId);
        if (reportOpt.isEmpty()) {
            return null;
        }
        FinalReport userReport = reportOpt.get();
        Integer userScore = userReport.getOverallScore();
        if (userScore == null) {
            return null;
        }

        java.util.Optional<Interview> interviewOpt = interviewRepository.findById(sessionId);
        if (interviewOpt.isEmpty()) {
            return null;
        }
        Interview interview = interviewOpt.get();
        String domain = interview.getDomain();

        // Get all interviews in this domain
        List<Interview> domainInterviews = interviewRepository.findByDomain(domain);
        List<String> interviewIds = domainInterviews.stream().map(Interview::getId).toList();

        // Get all final reports for these interviews
        List<FinalReport> reports = finalReportRepository.findByInterviewIdIn(interviewIds);

        List<Integer> scores = reports.stream()
                .map(FinalReport::getOverallScore)
                .filter(s -> s != null)
                .toList();

        // Only show this feature if sampleSize >= 20 for that role
        if (scores.size() < 20) {
            return null;
        }

        double totalScoreSum = 0;
        double countLess = 0;
        double countEqual = 0;

        for (int score : scores) {
            totalScoreSum += score;
            if (score < userScore) {
                countLess++;
            } else if (score == userScore) {
                countEqual++;
            }
        }

        double roleAverage = totalScoreSum / scores.size();
        double percentile = ((countLess + 0.5 * countEqual) / scores.size()) * 100;

        double roundedPercentile = Math.round(percentile * 10.0) / 10.0;
        double roundedAverage = Math.round(roleAverage * 10.0) / 10.0;

        java.util.Map<String, Object> benchmark = new java.util.HashMap<>();
        benchmark.put("percentile", roundedPercentile);
        benchmark.put("sampleSize", scores.size());
        benchmark.put("roleAverage", roundedAverage);

        return benchmark;
    }

    private static class AiAssessmentResult {
        int technicalScore;
        int communicationScore;
        List<String> strengths;
        List<String> weaknesses;
        String roadmap1Week;
        String roadmap1Month;
        String roadmap3Month;
        String summary;
    }
}
