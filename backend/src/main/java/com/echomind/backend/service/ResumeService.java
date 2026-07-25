package com.echomind.backend.service;

import com.echomind.backend.model.ResumeDraft;
import com.echomind.backend.repository.ResumeDraftRepository;
import com.lowagie.text.*;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.time.LocalDateTime;
import java.util.*;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ResumeService {

    private final ResumeDraftRepository resumeDraftRepository;
    private final GeminiService geminiService;

    public ResumeDraft getOrCreateDraft(String userId) {
        return resumeDraftRepository.findByUserId(userId)
                .orElseGet(() -> {
                    ResumeDraft newDraft = ResumeDraft.builder()
                            .userId(userId)
                            .templateId("Classic")
                            .sections(new HashMap<>())
                            .status("DRAFT")
                            .createdAt(LocalDateTime.now())
                            .build();
                    return resumeDraftRepository.save(newDraft);
                });
    }

    public ResumeDraft saveDraft(String userId, ResumeDraft draft) {
        ResumeDraft existing = getOrCreateDraft(userId);
        existing.setTemplateId(draft.getTemplateId());
        existing.setSections(draft.getSections());
        existing.setStatus(draft.getStatus());
        return resumeDraftRepository.save(existing);
    }

    public String improveSection(String sectionType, String sectionText) {
        if (sectionText == null || sectionText.trim().isEmpty()) {
            return "Please provide content to improve.";
        }

        String prompt = String.format(
            "You are an expert executive resume writer.\n" +
            "Improve the following resume [%s] section for clarity, professional impact, and brevity. Use action verbs and metric placeholders where appropriate. Keep it factual and do NOT invent experience.\n\n" +
            "Original Text:\n%s\n\n" +
            "Return ONLY the polished replacement text. Do not write any introduction, headers, quotes, or conversational explanations.",
            sectionType, sectionText
        );

        try {
            return geminiService.callGeminiApi(prompt).trim();
        } catch (Exception e) {
            System.err.println("Gemini resume improvement failed: " + e.getMessage());
            return sectionText; // fallback
        }
    }

    @SuppressWarnings("unchecked")
    public byte[] exportPdf(String userId) {
        ResumeDraft draft = getOrCreateDraft(userId);
        Map<String, Object> sections = draft.getSections();

        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Document document = new Document(PageSize.A4, 40, 40, 40, 40);
            PdfWriter.getInstance(document, out);
            document.open();

            // Font system configurations matching standard A4 dimensions
            Font nameFont = FontFactory.getFont(FontFactory.HELVETICA, 22, Font.BOLD, Color.BLACK);
            Font sectionTitleFont = FontFactory.getFont(FontFactory.HELVETICA, 12, Font.BOLD, new Color(99, 102, 241));
            Font entryTitleFont = FontFactory.getFont(FontFactory.HELVETICA, 10, Font.BOLD, Color.BLACK);
            Font normalFont = FontFactory.getFont(FontFactory.HELVETICA, 9, Font.NORMAL, Color.DARK_GRAY);
            Font italicFont = FontFactory.getFont(FontFactory.HELVETICA, 9, Font.ITALIC, Color.GRAY);

            // Read contact section
            Map<String, Object> contact = (Map<String, Object>) sections.getOrDefault("contact", new HashMap<>());
            String name = (String) contact.getOrDefault("name", "Candidate Name");
            String email = (String) contact.getOrDefault("email", "");
            String phone = (String) contact.getOrDefault("phone", "");
            String location = (String) contact.getOrDefault("location", "");
            String website = (String) contact.getOrDefault("website", "");

            // 1. Name Centered
            Paragraph nameParagraph = new Paragraph(name, nameFont);
            nameParagraph.setAlignment(Element.ALIGN_CENTER);
            nameParagraph.setSpacingAfter(4);
            document.add(nameParagraph);

            // 2. Contact details centered line
            StringJoiner sj = new StringJoiner("  |  ");
            if (!phone.isEmpty()) sj.add(phone);
            if (!email.isEmpty()) sj.add(email);
            if (!location.isEmpty()) sj.add(location);
            if (!website.isEmpty()) sj.add(website);

            Paragraph contactParagraph = new Paragraph(sj.toString(), normalFont);
            contactParagraph.setAlignment(Element.ALIGN_CENTER);
            contactParagraph.setSpacingAfter(15);
            document.add(contactParagraph);

            // Divider Rule
            Paragraph divider = new Paragraph("______________________________________________________________________________", italicFont);
            divider.setSpacingAfter(15);
            document.add(divider);

            // 3. Professional Summary
            String summary = (String) sections.getOrDefault("summary", "");
            if (summary != null && !summary.trim().isEmpty()) {
                Paragraph title = new Paragraph("EXECUTIVE SUMMARY", sectionTitleFont);
                title.setSpacingAfter(4);
                document.add(title);

                Paragraph text = new Paragraph(summary, normalFont);
                text.setSpacingAfter(15);
                document.add(text);
            }

            // 4. Experience Section
            List<Map<String, Object>> experienceList = (List<Map<String, Object>>) sections.get("experience");
            if (experienceList != null && !experienceList.isEmpty()) {
                Paragraph title = new Paragraph("PROFESSIONAL EXPERIENCE", sectionTitleFont);
                title.setSpacingAfter(8);
                document.add(title);

                for (Map<String, Object> exp : experienceList) {
                    String role = (String) exp.getOrDefault("role", "");
                    String company = (String) exp.getOrDefault("company", "");
                    String startDate = (String) exp.getOrDefault("startDate", "");
                    String endDate = (String) exp.getOrDefault("endDate", "");
                    String desc = (String) exp.getOrDefault("description", "");

                    Paragraph itemHeader = new Paragraph();
                    itemHeader.add(new Chunk(role + " - " + company, entryTitleFont));
                    itemHeader.add(new Chunk("  (" + startDate + " - " + endDate + ")", italicFont));
                    itemHeader.add(Chunk.NEWLINE);
                    document.add(itemHeader);

                    Paragraph itemDesc = new Paragraph(desc, normalFont);
                    itemDesc.setSpacingAfter(10);
                    document.add(itemDesc);
                }
                document.add(new Paragraph(" ", normalFont));
            }

            // 5. Education Section
            List<Map<String, Object>> educationList = (List<Map<String, Object>>) sections.get("education");
            if (educationList != null && !educationList.isEmpty()) {
                Paragraph title = new Paragraph("EDUCATION", sectionTitleFont);
                title.setSpacingAfter(8);
                document.add(title);

                for (Map<String, Object> edu : educationList) {
                    String degree = (String) edu.getOrDefault("degree", "");
                    String school = (String) edu.getOrDefault("school", "");
                    String gradDate = (String) edu.getOrDefault("gradDate", "");
                    String desc = (String) edu.getOrDefault("description", "");

                    Paragraph itemHeader = new Paragraph();
                    itemHeader.add(new Chunk(degree + " - " + school, entryTitleFont));
                    itemHeader.add(new Chunk("  (" + gradDate + ")", italicFont));
                    itemHeader.add(Chunk.NEWLINE);
                    document.add(itemHeader);

                    Paragraph itemDesc = new Paragraph(desc, normalFont);
                    itemDesc.setSpacingAfter(10);
                    document.add(itemDesc);
                }
                document.add(new Paragraph(" ", normalFont));
            }

            // 6. Skills Section
            Object skillsObj = sections.get("skills");
            if (skillsObj != null) {
                Paragraph title = new Paragraph("CORE SKILLS & TECHNOLOGIES", sectionTitleFont);
                title.setSpacingAfter(4);
                document.add(title);

                String skillsStr = "";
                if (skillsObj instanceof List) {
                    skillsStr = String.join(", ", (List<String>) skillsObj);
                } else {
                    skillsStr = skillsObj.toString();
                }

                Paragraph text = new Paragraph(skillsStr, normalFont);
                text.setSpacingAfter(15);
                document.add(text);
            }

            // 7. Projects Section
            List<Map<String, Object>> projectsList = (List<Map<String, Object>>) sections.get("projects");
            if (projectsList != null && !projectsList.isEmpty()) {
                Paragraph title = new Paragraph("KEY PROJECTS", sectionTitleFont);
                title.setSpacingAfter(8);
                document.add(title);

                for (Map<String, Object> proj : projectsList) {
                    String projName = (String) proj.getOrDefault("name", "");
                    String tech = (String) proj.getOrDefault("technologies", "");
                    String desc = (String) proj.getOrDefault("description", "");

                    Paragraph itemHeader = new Paragraph();
                    itemHeader.add(new Chunk(projName, entryTitleFont));
                    if (!tech.isEmpty()) {
                        itemHeader.add(new Chunk("  [Tech: " + tech + "]", italicFont));
                    }
                    itemHeader.add(Chunk.NEWLINE);
                    document.add(itemHeader);

                    Paragraph itemDesc = new Paragraph(desc, normalFont);
                    itemDesc.setSpacingAfter(10);
                    document.add(itemDesc);
                }
            }

            document.close();
            return out.toByteArray();
        } catch (Exception e) {
            System.err.println("Failed to build OpenPDF Resume: " + e.getMessage());
            return new byte[0];
        }
    }
}
