package com.echomind.backend.config;

import com.echomind.backend.model.*;
import com.echomind.backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.List;

@Component
@RequiredArgsConstructor
public class DatabaseInitializer implements CommandLineRunner {

    private final QuestionRepository questionRepository;
    private final AptitudeQuestionRepository aptitudeQuestionRepository;
    private final CommunicationQuestionRepository communicationQuestionRepository;
    private final CodingProblemRepository codingProblemRepository;
    private final RoundConfigRepository roundConfigRepository;
    private final RoleRepository roleRepository;
    private final CodingQuestionRepository codingQuestionRepository;
    private final FlashcardRepository flashcardRepository;

    @jakarta.annotation.PostConstruct
    public void init() {
        System.out.println("====== DATABASE INITIALIZER BEAN CREATED ======");
    }

    @Override
    public void run(String... args) throws Exception {
        System.out.println("====== DATABASE INITIALIZER RUNNING ======");
        try {
            // Seed coding questions (Feature Batch 2 - Feature 1)
            seedCodingQuestions();
            // Seed default flashcards (Feature Batch 2 - Feature 2)
            seedFlashcards();
            // Seed traditional questions
            if (questionRepository.count() == 0) {
                System.out.println("Seeding predefined questions with competency tags...");
                List<Question> questions = Arrays.asList(
                    // Software Engineer
                    Question.builder().domain("Software Engineer").difficulty("Medium").questionText("Explain the difference between a process and a thread.").competencyTags(Arrays.asList("technicalAccuracy")).build(),
                    Question.builder().domain("Software Engineer").difficulty("Medium").questionText("What is a deadlock, and how can you prevent it?").competencyTags(Arrays.asList("technicalAccuracy", "confidenceDelivery")).build(),
                    Question.builder().domain("Software Engineer").difficulty("Medium").questionText("Describe the principles of Object-Oriented Programming (OOP) like polymorphism and encapsulation.").competencyTags(Arrays.asList("technicalAccuracy", "communicationClarity")).build(),
                    Question.builder().domain("Software Engineer").difficulty("Hard").questionText("How does garbage collection work in languages like Java or C#?").competencyTags(Arrays.asList("technicalAccuracy")).build(),
                    Question.builder().domain("Software Engineer").difficulty("Hard").questionText("Explain how hash tables work and how they handle collisions under the hood.").competencyTags(Arrays.asList("technicalAccuracy")).build(),
                    Question.builder().domain("Software Engineer").difficulty("Medium").questionText("Tell me about a time you faced a technical conflict in a team. How did you resolve it?").competencyTags(Arrays.asList("starStructure", "communicationClarity")).build(),
                    Question.builder().domain("Software Engineer").difficulty("Hard").questionText("Describe a complex software project you worked on. Walk me through the situation, task, actions, and results.").competencyTags(Arrays.asList("starStructure")).build(),
                    Question.builder().domain("Software Engineer").difficulty("Medium").questionText("How do you handle technical debt and prioritize code quality under tight deadlines?").competencyTags(Arrays.asList("communicationClarity", "confidenceDelivery")).build(),

                    // UI/UX Designer
                    Question.builder().domain("UI/UX Designer").difficulty("Medium").questionText("What is User-Centered Design (UCD) and how do you implement it in your design process?").competencyTags(Arrays.asList("technicalAccuracy", "communicationClarity")).build(),
                    Question.builder().domain("UI/UX Designer").difficulty("Medium").questionText("How do you conduct usability testing, and how do you handle negative feedback on your design choices?").competencyTags(Arrays.asList("starStructure", "confidenceDelivery")).build(),
                    Question.builder().domain("UI/UX Designer").difficulty("Medium").questionText("Explain the difference between wireframes, mockups, and interactive prototypes.").competencyTags(Arrays.asList("technicalAccuracy")).build(),
                    Question.builder().domain("UI/UX Designer").difficulty("Hard").questionText("Describe a time you had to defend a design choice to stakeholders who strongly disagreed. What actions did you take?").competencyTags(Arrays.asList("starStructure", "confidenceDelivery")).build(),

                    // Game Developer
                    Question.builder().domain("Game Developer").difficulty("Medium").questionText("Explain the update loop in game engines and how frame rate variance (delta time) is handled.").competencyTags(Arrays.asList("technicalAccuracy")).build(),
                    Question.builder().domain("Game Developer").difficulty("Medium").questionText("Describe the differences between Entity Component System (ECS) and traditional OOP architectures in games.").competencyTags(Arrays.asList("technicalAccuracy", "communicationClarity")).build(),
                    Question.builder().domain("Game Developer").difficulty("Hard").questionText("Tell me about a time you optimized a game's performance when frame rates dropped. What was your process?").competencyTags(Arrays.asList("starStructure", "technicalAccuracy")).build(),
                    Question.builder().domain("Game Developer").difficulty("Hard").questionText("How do you handle collision detection and physics calculations for fast-moving game objects?").competencyTags(Arrays.asList("technicalAccuracy", "confidenceDelivery")).build()
                );
                questionRepository.saveAll(questions);
            }

            // Seed Aptitude Questions (Round 1)
            if (aptitudeQuestionRepository.count() == 0) {
                System.out.println("Seeding Aptitude Questions...");
                List<AptitudeQuestion> aptitudeQuestions = Arrays.asList(
                    AptitudeQuestion.builder()
                        .category("QUANT")
                        .difficulty("Medium")
                        .questionText("If a train runs at 60 km/h, how many meters does it travel in 30 seconds?")
                        .options(Arrays.asList("300 meters", "500 meters", "600 meters", "400 meters"))
                        .correctAnswerIndex(1) // 500 meters
                        .build(),
                    AptitudeQuestion.builder()
                        .category("QUANT")
                        .difficulty("Medium")
                        .questionText("A shopkeeper sells a widget for $120, making a profit of 20% on the cost price. What was the cost price?")
                        .options(Arrays.asList("$100", "$96", "$110", "$80"))
                        .correctAnswerIndex(0) // $100
                        .build(),
                    AptitudeQuestion.builder()
                        .category("LOGICAL")
                        .difficulty("Medium")
                        .questionText("Identify the missing number in the sequence: 2, 6, 12, 20, 30, ?, 56")
                        .options(Arrays.asList("40", "42", "45", "48"))
                        .correctAnswerIndex(1) // 42
                        .build(),
                    AptitudeQuestion.builder()
                        .category("LOGICAL")
                        .difficulty("Medium")
                        .questionText("All dogs are loyal. Some loyal animals are cats. Which of the following is logically guaranteed?")
                        .options(Arrays.asList("Some dogs are cats", "All loyal animals are dogs", "No dogs are cats", "None of the above"))
                        .correctAnswerIndex(3) // None of the above
                        .build(),
                    AptitudeQuestion.builder()
                        .category("VERBAL")
                        .difficulty("Medium")
                        .questionText("Which of the following is a synonym of 'Meticulous'?")
                        .options(Arrays.asList("Careless", "Thorough/Precise", "Sluggish", "Aggressive"))
                        .correctAnswerIndex(1) // Thorough/Precise
                        .build()
                );
                aptitudeQuestionRepository.saveAll(aptitudeQuestions);
            }

            // Seed Communication Questions (Round 2)
            if (communicationQuestionRepository.count() == 0) {
                System.out.println("Seeding Communication Questions...");
                List<CommunicationQuestion> commQuestions = Arrays.asList(
                    CommunicationQuestion.builder()
                        .careerPath("Software Engineer")
                        .questionText("Tell me about a time you had to resolve a conflict within a development team. What was your approach?")
                        .expectedThemes(Arrays.asList("conflict resolution", "empathy", "communication", "compromise"))
                        .idealAnswerStructure("STAR")
                        .build(),
                    CommunicationQuestion.builder()
                        .careerPath("Software Engineer")
                        .questionText("Why do you want to join our organization as a Software Engineer, and what skills make you unique?")
                        .expectedThemes(Arrays.asList("motivation", "growth", "unique skills", "culture fit"))
                        .idealAnswerStructure("Foundational")
                        .build(),
                    CommunicationQuestion.builder()
                        .careerPath("Software Engineer")
                        .questionText("Describe a complex project where you had to learn a new technology stack quickly. How did you manage?")
                        .expectedThemes(Arrays.asList("self-learning", "adaptability", "problem solving", "curiosity"))
                        .idealAnswerStructure("STAR")
                        .build()
                );
                communicationQuestionRepository.saveAll(commQuestions);
            }

            // Seed Coding Problems (Round 3)
            if (codingProblemRepository.count() < 3) {
                codingProblemRepository.deleteAll();
                System.out.println("Seeding Coding Problems...");
                List<CodingProblem> codingProblems = Arrays.asList(
                    CodingProblem.builder()
                        .title("FizzBuzz")
                        .description("Given an integer n, return a string array answer (1-indexed) where:\n- answer[i] == \"FizzBuzz\" if i is divisible by 3 and 5.\n- answer[i] == \"Fizz\" if i is divisible by 3.\n- answer[i] == \"Buzz\" if i is divisible by 5.\n- answer[i] == i (as a string) if none of the above conditions are true.")
                        .difficulty("Easy")
                        .careerPath("Software Engineer")
                        .templateCode("function solution(n) {\n    // Write your code here\n    \n}")
                        .testCasesJson("[{\"input\":\"3\",\"expected\":\"[\\\"1\\\",\\\"2\\\",\\\"Fizz\\\"]\"},{\"input\":\"5\",\"expected\":\"[\\\"1\\\",\\\"2\\\",\\\"Fizz\\\",\\\"4\\\",\\\"Buzz\\\"]\"}]")
                        .build(),
                    CodingProblem.builder()
                        .title("Two Sum Problem")
                        .description("Given an array of integers 'nums' and an integer 'target', return indices of the two numbers such that they add up to target.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.")
                        .difficulty("Medium")
                        .careerPath("Software Engineer")
                        .templateCode("function solution(nums, target) {\n    // Write your code here\n    \n}")
                        .testCasesJson("[{\"input\":\"[[2,7,11,15], 9]\",\"expected\":\"[0,1]\"},{\"input\":\"[[3,2,4], 6]\",\"expected\":\"[1,2]\"}]")
                        .build(),
                    CodingProblem.builder()
                        .title("Longest Substring")
                        .description("Given a string s, find the length of the longest substring without repeating characters.")
                        .difficulty("Hard")
                        .careerPath("Software Engineer")
                        .templateCode("function solution(s) {\n    // Write your code here\n    \n}")
                        .testCasesJson("[{\"input\":\"\\\"abcabcbb\\\"\",\"expected\":\"3\"},{\"input\":\"\\\"bbbbb\\\"\",\"expected\":\"1\"}]")
                        .build()
                );
                codingProblemRepository.saveAll(codingProblems);
            }

            // Seed Round Configurations (configs)
            if (roundConfigRepository.count() == 0) {
                System.out.println("Seeding Default Round Configurations...");
                List<RoundConfig> configs = Arrays.asList(
                    RoundConfig.builder().careerPath("Software Engineer").roundType("APTITUDE").passThreshold(60).strictCutoff(false).build(),
                    RoundConfig.builder().careerPath("Software Engineer").roundType("COMMUNICATION").passThreshold(60).strictCutoff(false).build(),
                    RoundConfig.builder().careerPath("Software Engineer").roundType("CODING").passThreshold(60).strictCutoff(false).build(),
                    RoundConfig.builder().careerPath("Software Engineer").roundType("ADVANCED").passThreshold(60).strictCutoff(false).build()
                );
                roundConfigRepository.saveAll(configs);
            }

            // Seed comprehensive roles
            seedCuratedRoles();

            System.out.println("====== DATABASE INITIALIZATION COMPLETED ======");
        } catch (Exception e) {
            System.err.println("Error during DatabaseInitializer seeding:");
            e.printStackTrace();
        }
    }

    private void seedCuratedRoles() {
        if (roleRepository.count() >= 70) {
            return;
        }
        roleRepository.deleteAll();
        System.out.println("Seeding 70 curated job roles...");
        
        List<Role> curatedList = Arrays.asList(
            // Tech & Engineering (28)
            createCuratedRole("Software Engineer", "Tech & Engineering", "Develops high quality system components, designs core architectures, and manages debugging operations.", Arrays.asList("Java", "Spring Boot", "OOP", "DBMS", "System Design"), Arrays.asList("Java backend", "object-oriented design", "database indexing", "concurrency", "REST APIs")),
            createCuratedRole("Full Stack Developer", "Tech & Engineering", "Works across frontend and backend interfaces, building full features.", Arrays.asList("React", "Node.js", "Express", "MongoDB", "CSS"), Arrays.asList("API integration", "state management", "database design", "RESTful web services")),
            createCuratedRole("Frontend Developer", "Tech & Engineering", "Focuses on user interfaces, responsive visual components, and web layouts.", Arrays.asList("React", "Tailwind CSS", "HTML5", "JavaScript", "Vite"), Arrays.asList("DOM manipulation", "component lifecycle", "responsive web layouts", "browser storage APIs")),
            createCuratedRole("Backend Developer", "Tech & Engineering", "Manages server logic, APIs, database integrations, and caching systems.", Arrays.asList("Spring Boot", "Node.js", "Java", "PostgreSQL", "APIs"), Arrays.asList("REST API design", "concurrency control", "caching mechanisms", "database transactions")),
            createCuratedRole("Mobile App Developer", "Tech & Engineering", "Builds fluid application interfaces for iOS and Android platforms.", Arrays.asList("React Native", "Flutter", "Swift", "Kotlin", "APIs"), Arrays.asList("mobile lifecycle", "cross-platform frameworks", "local databases", "performance tuning")),
            createCuratedRole("Mobile App Developer (iOS)", "Tech & Engineering", "Specializes in building native applications for the iOS ecosystem.", Arrays.asList("Swift", "SwiftUI", "Xcode", "CocoaPods", "CoreData"), Arrays.asList("Swift runtime", "Memory management ARC", "UIKit vs SwiftUI", "App Store deployment")),
            createCuratedRole("Mobile App Developer (Android)", "Tech & Engineering", "Specializes in building native applications for the Android ecosystem.", Arrays.asList("Kotlin", "Java", "Android Studio", "Jetpack Compose", "Coroutines"), Arrays.asList("Kotlin coroutines", "Android activity lifecycle", "dependency injection", "Gradle configurations")),
            createCuratedRole("DevOps Engineer", "Tech & Engineering", "Automates deployment pipelines, manages cloud infrastructure, and configures container orchestration.", Arrays.asList("Docker", "Kubernetes", "CI/CD", "AWS", "Linux"), Arrays.asList("infrastructure as code", "deployment strategies", "CI/CD pipelines", "container networking")),
            createCuratedRole("Cloud Engineer", "Tech & Engineering", "Designs and supports scalable deployments inside public cloud environments.", Arrays.asList("AWS", "Azure", "GCP", "Terraform", "Cloud Security"), Arrays.asList("IAM policies", "cloud computing models", "virtual private clouds", "serverless scaling")),
            createCuratedRole("Site Reliability Engineer", "Tech & Engineering", "Focuses on system uptime, site performance, and automating operational procedures.", Arrays.asList("Kubernetes", "Prometheus", "Grafana", "Python", "Linux"), Arrays.asList("SLOs and SLAs", "blameless postmortems", "incident management", "distributed tracing")),
            createCuratedRole("Data Scientist", "Tech & Engineering", "Analyzes huge datasets to build predictive machine learning models.", Arrays.asList("Python", "Pandas", "Machine Learning", "SQL", "Scikit-Learn"), Arrays.asList("supervised learning", "data cleaning", "statistical modeling", "dimensionality reduction")),
            createCuratedRole("Data Analyst", "Tech & Engineering", "Examines metrics trends to build reporting charts and summarize business insight.", Arrays.asList("SQL", "Tableau", "Excel", "Python", "PowerBI"), Arrays.asList("aggregations and joins", "dashboard design", "data warehousing", "KPI definition")),
            createCuratedRole("Data Engineer", "Tech & Engineering", "Builds scalable batch and stream data pipelines to transport analytical workloads.", Arrays.asList("Spark", "Hadoop", "Python", "SQL", "Kafka"), Arrays.asList("ETL pipelines", "data warehouse schema design", "distributed computation", "stream processing")),
            createCuratedRole("Machine Learning Engineer", "Tech & Engineering", "Deploys scaled deep learning pipelines and trains cognitive intelligence models.", Arrays.asList("TensorFlow", "PyTorch", "Python", "MLOps", "Model Training"), Arrays.asList("gradient descent", "neural networks", "model optimization", "evaluation metrics")),
            createCuratedRole("Cybersecurity Analyst", "Tech & Engineering", "Monitors security alerts, audits access rules, and logs potential breaches.", Arrays.asList("Security Auditing", "Wireshark", "Linux", "Firewalls", "Incident Response"), Arrays.asList("threat modeling", "vulnerability scanning", "incident response", "cryptography protocols")),
            createCuratedRole("Network Engineer", "Tech & Engineering", "Designs, configures, and resolves issues within physical and software network infrastructures.", Arrays.asList("Cisco", "TCP/IP", "DNS", "VPN", "Routing"), Arrays.asList("OSI model layers", "routing protocols", "subnet masking", "DNS resolution")),
            createCuratedRole("Systems Administrator", "Tech & Engineering", "Maintains corporate operating system resources, directories, and local security configurations.", Arrays.asList("Linux", "Windows Server", "Active Directory", "Bash", "Virtualization"), Arrays.asList("user access policies", "shell scripting", "backup systems", "server virtualization")),
            createCuratedRole("QA Engineer", "Tech & Engineering", "Executes manual and automated validation sequences to prevent software regressions.", Arrays.asList("Selenium", "Cypress", "Postman", "Jest", "Manual Testing"), Arrays.asList("test case writing", "API automation", "defect lifecycle", "boundary value analysis")),
            createCuratedRole("Solution Architect", "Tech & Engineering", "Translates commercial requirements into secure, scalable, and resilient technical solution designs.", Arrays.asList("System Design", "Cloud Architecture", "Microservices", "Design Patterns"), Arrays.asList("microservices scaling", "database trade-offs", "high-availability designs", "system integration patterns")),
            createCuratedRole("Security Engineer", "Tech & Engineering", "Builds security controls, runs vulnerability testing, and audits application safety codes.", Arrays.asList("OWASP Top 10", "Cryptography", "Penetration Testing", "Security Operations"), Arrays.asList("SQL injection protection", "encryption schemes", "security headers", "threat mapping")),
            createCuratedRole("Data Architect", "Tech & Engineering", "Defines the blueprint mapping institutional data models, directories, and pipeline governance.", Arrays.asList("Data Modeling", "Database Design", "SQL", "Big Data", "Data Lakes"), Arrays.asList("normal forms", "data lake design", "master data management", "database replication")),
            createCuratedRole("BI Developer", "Tech & Engineering", "Translates database metrics into business intelligence reports, metrics warehouses, and cubes.", Arrays.asList("PowerBI", "Tableau", "SQL", "Data Warehousing", "ETL"), Arrays.asList("star schemas", "data warehouse ETL", "dashboard visualizations", "multi-dimensional modeling")),
            createCuratedRole("Database Administrator", "Tech & Engineering", "Manages scaled indexing strategies, keeps backup policies, and optimizes queries.", Arrays.asList("SQL", "PostgreSQL", "Database Optimization", "Backups", "Index Tuning"), Arrays.asList("index types", "transaction isolation levels", "database replication", "backup strategies")),
            createCuratedRole("Salesforce Developer", "Tech & Engineering", "Configures Salesforce instances, writes Apex custom triggers, and maps business flows.", Arrays.asList("Apex", "Salesforce DX", "LWC", "SOQL", "Triggers"), Arrays.asList("Apex governor limits", "Lightning Web Components", "SOQL queries", "Salesforce architecture")),
            createCuratedRole("Game Developer", "Tech & Engineering", "Develops interactive game logic, frame renders, physics collisions, and entity component behaviors.", Arrays.asList("Unity", "C#", "C++", "Unreal Engine", "Game Loops"), Arrays.asList("game loop optimization", "entity component system", "memory management", "rendering pipeline")),
            createCuratedRole("Blockchain Developer", "Tech & Engineering", "Develops custom decentralized smart contracts and audits distributed consensus chains.", Arrays.asList("Solidity", "Ethereum", "Smart Contracts", "Cryptography", "Web3"), Arrays.asList("smart contract security", "decentralized protocols", "consensus algorithms", "gas optimization")),
            createCuratedRole("Embedded Systems Engineer", "Tech & Engineering", "Writes low-level drivers, controls processor routines, and designs firmware integrations.", Arrays.asList("C", "C++", "Firmware", "RTOS", "Microcontrollers"), Arrays.asList("memory-mapped I/O", "RTOS task scheduling", "interrupt handling", "microcontrollers")),
            createCuratedRole("AI/Prompt Engineer", "Tech & Engineering", "Polishes prompt configurations, designs agent tool schemas, and manages LLM invocation routines.", Arrays.asList("Prompt Engineering", "LLMs", "RAG", "Python", "LangChain"), Arrays.asList("RAG architecture", "context window management", "few-shot formatting", "agent logic")),

            // Product & Design (10)
            createCuratedRole("Product Manager", "Product & Design", "Coordinates release roadmaps, synthesizes feature requests, and guides product iterations.", Arrays.asList("Agile", "Roadmapping", "Scrum", "Jira", "User Stories"), Arrays.asList("product discovery", "Agile sprint cycles", "KPI prioritization", "user research")),
            createCuratedRole("Associate Product Manager", "Product & Design", "Assists in product feature scoping, maps user journeys, and reports customer feedback.", Arrays.asList("Jira", "Market Research", "Agile", "User Journeys", "Documentation"), Arrays.asList("user story writing", "competitive analysis", "agile sprints", "collaboration")),
            createCuratedRole("UI/UX Designer", "Product & Design", "Designs wireframes, clickable high-fidelity Figma prototypes, and performs user validation studies.", Arrays.asList("Figma", "User Research", "Wireframing", "Prototyping", "Design Systems"), Arrays.asList("design systems", "information architecture", "wireframing", "usability testing")),
            createCuratedRole("Graphic Designer", "Product & Design", "Creates digital asset illustrations, defines corporate color systems, and templates visual prints.", Arrays.asList("Photoshop", "Illustrator", "Branding", "Vector Design", "Typography"), Arrays.asList("visual composition", "color theory", "vector alignment", "brand identity")),
            createCuratedRole("Motion Designer", "Product & Design", "Animates promotional marketing videos, video assets, and UI transitions.", Arrays.asList("After Effects", "Premiere Pro", "2D Animation", "Keyframing", "Storyboarding"), Arrays.asList("animation principles", "video composition", "visual timing", "storyboard planning")),
            createCuratedRole("Game Designer", "Product & Design", "Designs core game loops, defines weapon balances, and blueprints player retention progression levels.", Arrays.asList("Game Balance", "Level Design", "Progression Systems", "Playtesting", "System Design"), Arrays.asList("progression mechanics", "game economy", "playtesting loop", "level design")),
            createCuratedRole("Technical Artist", "Product & Design", "Bridges the gap between artists and programmers, writing custom shaders and mapping assets.", Arrays.asList("Shaders", "Unity/Unreal", "Blender/Maya", "Python", "Render Pipelines"), Arrays.asList("custom shader code", "asset optimization", "render pipelines", "modeling tooling")),
            createCuratedRole("Interaction Designer", "Product & Design", "Blueprints user task flows, UI transitions, and micro-interaction states.", Arrays.asList("Figma", "Interaction Design", "Prototyping", "User Flows", "User Validation"), Arrays.asList("heuristic evaluation", "user flow diagrams", "micro-animations", "interaction theory")),
            createCuratedRole("Visual Designer", "Product & Design", "Focuses on graphic alignment, aesthetic layouts, color schemes, and visual hierarchies.", Arrays.asList("Figma", "UI Design", "Visual Hierarchy", "Branding", "Aesthetics"), Arrays.asList("typography pairing", "visual grids", "color palettes", "brand alignment")),
            createCuratedRole("Creative Director", "Product & Design", "Directs creative design projects, leads art campaigns, and approves media styling.", Arrays.asList("Design Leadership", "Brand Strategy", "Art Direction", "Project Vision", "Creative Output"), Arrays.asList("creative execution", "brand development", "leadership", "design critique")),

            // Business & Analytics (11)
            createCuratedRole("Business Analyst", "Business & Analytics", "Extracts technical user requirements from client goals to write spec cards.", Arrays.asList("Requirement Gathering", "User Stories", "SQL", "Agile", "Excel"), Arrays.asList("requirement mapping", "agile sprints", "user stories", "business process flow")),
            createCuratedRole("Financial Analyst", "Business & Analytics", "Builds financial spreadsheets, monitors asset budgets, and drafts cost reports.", Arrays.asList("Financial Modeling", "Excel", "Data Analysis", "Accounting", "Valuation"), Arrays.asList("financial models", "data audits", "valuation theory", "variance analysis")),
            createCuratedRole("Operations Analyst", "Business & Analytics", "Evaluates operational processes, optimizes workflows, and audits inventory resource timelines.", Arrays.asList("Process Mapping", "SQL", "Excel", "Operations", "KPIs"), Arrays.asList("process optimization", "KPI metrics mapping", "capacity planning", "variance reporting")),
            createCuratedRole("Project Manager", "Business & Analytics", "Coordinates delivery timelines, manages cross-functional communication, and updates stakeholders.", Arrays.asList("Jira", "Gantt Charts", "Risk Management", "Agile", "Communication"), Arrays.asList("Gantt chart timelines", "agile ceremonies", "stakeholder syncs", "risk mitigation")),
            createCuratedRole("Program Manager", "Business & Analytics", "Coordinates programmatic sets of projects, maps alignment targets, and oversees budget lines.", Arrays.asList("Program Governance", "Roadmaps", "Budgeting", "Stakeholder Management", "Agile"), Arrays.asList("program delivery", "cross-project scaling", "change management", "budget allocation")),
            createCuratedRole("Scrum Master", "Business & Analytics", "Facilitates daily scrum syncs, clears blockers, and coaches team iterations.", Arrays.asList("Scrum", "Agile Coaching", "Jira", "Sprint Planning", "Facilitation"), Arrays.asList("agile metrics", "sprint velocity", "impediment resolution", "scrum framework")),
            createCuratedRole("Management Consultant", "Business & Analytics", "Audits structural workflows, recommends corporate strategies, and pitches stakeholder proposals.", Arrays.asList("Management Consulting", "Problem Solving", "Slide Deck Design", "Strategy", "B2B"), Arrays.asList("strategic frameworks", "problem structure MECE", "client presentation", "financial modeling")),
            createCuratedRole("Investment Analyst", "Business & Analytics", "Evaluates company investment deals, builds financial spreadsheets, and drafts recommendations.", Arrays.asList("Financial Modeling", "Valuation", "B2B Sales", "Asset Management", "Market Research"), Arrays.asList("DCF valuation models", "cap table calculations", "competitive benchmarking", "due diligence")),
            createCuratedRole("Data Governance Analyst", "Business & Analytics", "Defines access controls, checks catalog rules, and manages data classification guidelines.", Arrays.asList("Data Cataloging", "Access Control", "Compliance", "Security Policies", "GDPR"), Arrays.asList("metadata management", "GDPR standards", "data profiling", "access security")),
            createCuratedRole("Risk Analyst", "Business & Analytics", "Identifies commercial risks, audits financial portfolios, and updates safety checklists.", Arrays.asList("Risk Assessment", "Financial Modeling", "Data Analysis", "SQL", "Compliance"), Arrays.asList("quantitative risk modeling", "market risk volatility", "credit analysis", "compliance regulations")),
            createCuratedRole("Supply Chain Analyst", "Business & Analytics", "Optimizes logistics resources, coordinates vendor timelines, and handles shipment metrics.", Arrays.asList("Logistics", "Inventory Optimization", "Excel", "SQL", "Operations"), Arrays.asList("inventory turnover calculations", "supply chain mapping", "vendor negotiations", "KPI metrics")),

            // Marketing & Sales (11)
            createCuratedRole("Digital Marketing Specialist", "Marketing & Sales", "Implements targeted advertising funnels and drives client traffic.", Arrays.asList("SEO", "Google Ads", "Analytics", "Facebook Ads", "Email Marketing"), Arrays.asList("SEM campaigns", "targeted advertising", "funnel conversions", "Google Analytics")),
            createCuratedRole("Content Marketing Manager", "Marketing & Sales", "Coordinates digital writing pipelines, approves publication scripts, and budgets promotions.", Arrays.asList("Content Strategy", "SEO", "Copywriting", "Creative Writing", "Analytics"), Arrays.asList("content calendar mapping", "SEO optimization", "copywriting metrics", "brand positioning")),
            createCuratedRole("SEO Specialist", "Marketing & Sales", "Optimizes web content parameters, drives organic search volumes, and handles backlink profiles.", Arrays.asList("SEO", "Google Search Console", "Ahrefs/Semrush", "Keywords", "HTML"), Arrays.asList("crawling indexing structures", "on-page SEO elements", "keyword research", "link audits")),
            createCuratedRole("Social Media Manager", "Marketing & Sales", "Manages brand channel publications, monitors engagement metrics, and runs promotions.", Arrays.asList("Social Media", "Branding", "Content Calendars", "Engagement", "Analytics"), Arrays.asList("social media campaigns", "engagement analytics", "customer relations", "platform algorithms")),
            createCuratedRole("Sales Executive", "Marketing & Sales", "Maintains business development relationships, drafts client agreements, and drives sales targets.", Arrays.asList("CRM", "Negotiation", "B2B Sales", "Client Relations", "Lead Generation"), Arrays.asList("sales funnel velocity", "objection handling", "B2B client proposals", "contract negotiations")),
            createCuratedRole("Account Manager", "Marketing & Sales", "Maintains client account relations, supports product upsells, and negotiates contract renewals.", Arrays.asList("Account Management", "Client Relations", "Sales", "Negotiation", "Upselling"), Arrays.asList("client retention", "account relationship mapping", "upselling tactics", "contract negotiation")),
            createCuratedRole("Business Development Executive", "Marketing & Sales", "Establishes institutional alliances, sources commercial leads, and designs target pitches.", Arrays.asList("Lead Generation", "Cold Outreach", "B2B Partnership", "Pitches", "CRM"), Arrays.asList("outreach scripts", "deal structure options", "partner coordination", "sales funnel")),
            createCuratedRole("Growth Marketer", "Marketing & Sales", "Optimizes conversion funnels, executes paid promotion campaigns, and coordinates acquisition strategies.", Arrays.asList("Growth Marketing", "Funnel Optimization", "Google Ads", "A/B Testing", "Analytics"), Arrays.asList("funnel acquisition mapping", "conversion rate analysis", "A/B testing", "ROI scaling")),
            createCuratedRole("Growth Hacker", "Marketing & Sales", "Finds organic viral growth channels, runs high-velocity A/B tests, and designs loops.", Arrays.asList("A/B Testing", "Funnel Analysis", "Viral Loops", "Paid Acquisition", "SEO"), Arrays.asList("A/B testing rules", "viral loop modeling", "referral incentive setups", "attribution metrics")),
            createCuratedRole("Email Marketing Specialist", "Marketing & Sales", "Manages customer email campaigns, designs automation flows, and handles deliverability.", Arrays.asList("Email Marketing", "Klaviyo/Mailchimp", "Automation", "Copywriting", "A/B Testing"), Arrays.asList("email campaign deliverability", "A/B copy layouts", "segmentation models", "conversion tracking")),
            createCuratedRole("PR Manager", "Marketing & Sales", "Coordinates press releases, manages public relations, and handles media inquiries.", Arrays.asList("Public Relations", "Press Releases", "Media Relations", "Crisis Management", "Communications"), Arrays.asList("media outreach setups", "press release writing", "brand communication strategy", "crisis mapping")),

            // Customer-Facing (5)
            createCuratedRole("Customer Service Representative", "Customer-Facing", "Answers client requests, resolves tier-1 tickets, and routes escalations.", Arrays.asList("Customer Support", "Communication", "Ticketing", "Problem Solving", "Helpdesk"), Arrays.asList("ticket resolution metrics", "active listening techniques", "escalation procedures", "customer satisfaction")),
            createCuratedRole("Customer Success Manager", "Customer-Facing", "Guides post-sales support integrations, keeps account churn low, and handles inquiries.", Arrays.asList("CRM", "Customer Support", "Onboarding", "Troubleshooting", "Churn Reduction"), Arrays.asList("onboarding flow mapping", "churn evaluation metrics", "account mapping", "advocacy")),
            createCuratedRole("Technical Support Engineer", "Customer-Facing", "Resolves tier-2 system issues, inspects server connection logs, and templates bug reports.", Arrays.asList("Linux", "SQL", "Log Analysis", "Troubleshooting", "Networking"), Arrays.asList("log file auditing", "OS network diagnostic tools", "tier-2 triage", "database query debugging")),
            createCuratedRole("Sales Development Representative", "Customer-Facing", "Handles cold calls, qualifies leads, and schedules product demos.", Arrays.asList("Cold Outreach", "Qualifying Leads", "CRM", "Sales Pitch", "Objection Handling"), Arrays.asList("outreach scripts", "qualification methodologies", "objection handlers", "CRM hygiene")),
            createCuratedRole("Support Desk Specialist", "Customer-Facing", "Handles local workstation issues, configures hardware credentials, and resolves tier-1 tickets.", Arrays.asList("Windows/Mac", "Ticketing Systems", "Hardware Setup", "Active Directory", "ITIL"), Arrays.asList("ticketing workflow triage", "Active Directory setups", "OS troubleshooting", "ITIL practices")),

            // HR & Admin (6)
            createCuratedRole("HR Generalist", "HR & Admin", "Manages institutional HR policies, employee relations, and compliance catalogs.", Arrays.asList("HR Policies", "Employee Relations", "Compliance", "Recruiting", "Onboarding"), Arrays.asList("policy compliance", "employee conflict management", "onboarding layouts", "HR database management")),
            createCuratedRole("Talent Acquisition Specialist", "HR & Admin", "Sells company culture, coordinates interview selections, and sources potential candidates.", Arrays.asList("Recruiting", "Sourcing", "Interviews", "ATS", "Culture Fit"), Arrays.asList("candidate sourcing models", "structured interview sheets", "ATS tracking", "culture checks")),
            createCuratedRole("Office Administrator", "HR & Admin", "Coordinates local administrative support services, schedules schedules, and templates purchases.", Arrays.asList("Office Coordination", "Scheduling", "Documentation", "Procurement", "Communication"), Arrays.asList("procurement management", "vendor communications", "scheduling coordination", "document tracking")),
            createCuratedRole("Learning & Development Specialist", "HR & Admin", "Coordinates company training programs, evaluates growth indices, and coordinates lectures.", Arrays.asList("Training Programs", "Curriculum Design", "Skill Assessments", "Coaching", "HR"), Arrays.asList("curriculum development plans", "skills mapping frameworks", "employee training coordination", "feedback loops")),
            createCuratedRole("Recruiter", "HR & Admin", "Handles high-velocity candidate sourcing, coordinates pipelines, and issues contracts.", Arrays.asList("Sourcing", "LinkedIn Recruiter", "Outreach", "Interviews", "Negotiation"), Arrays.asList("outreach copy layouts", "interview scheduling configurations", "contract negotiations", "pipeline velocity")),
            createCuratedRole("HR Manager", "HR & Admin", "Directs institutional HR resources, coordinates annual performance audits, and aligns budgets.", Arrays.asList("HR Leadership", "Performance Audits", "Compliance", "Budgeting", "Policy Development"), Arrays.asList("annual evaluation frameworks", "department compliance rules", "team leadership", "budget structures"))
        );
        roleRepository.saveAll(curatedList);
        
        for (Role r : curatedList) {
            if (roundConfigRepository.findByCareerPathAndRoundType(r.getId(), "APTITUDE").isEmpty()) {
                roundConfigRepository.save(RoundConfig.builder().careerPath(r.getId()).roundType("APTITUDE").passThreshold(60).strictCutoff(false).build());
                roundConfigRepository.save(RoundConfig.builder().careerPath(r.getId()).roundType("COMMUNICATION").passThreshold(60).strictCutoff(false).build());
                roundConfigRepository.save(RoundConfig.builder().careerPath(r.getId()).roundType("CODING").passThreshold(60).strictCutoff(false).build());
                roundConfigRepository.save(RoundConfig.builder().careerPath(r.getId()).roundType("ADVANCED").passThreshold(60).strictCutoff(false).build());
            }
        }
    }

    private Role createCuratedRole(String title, String category, String description, List<String> keywords, List<String> questionThemes) {
        return Role.builder()
            .id(title.toLowerCase().replaceAll("[^a-z0-9]", "-"))
            .title(title)
            .category(category)
            .description(description)
            .keywords(keywords)
            .source("curated")
            .usageCount(0)
            .questionThemes(questionThemes)
            .build();
    }

    private void seedCodingQuestions() {
        if (codingQuestionRepository.count() > 0) return;
        System.out.println("Seeding 20 high-quality Coding Questions...");
        
        List<CodingQuestion> questions = Arrays.asList(
            CodingQuestion.builder()
                .title("Two Sum")
                .description("Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.")
                .difficulty("Easy")
                .topicTags(Arrays.asList("arrays"))
                .timeLimitMinutes(15)
                .starterCode(java.util.Map.of(
                    "javascript", "function twoSum(nums, target) {\n    // Write your code here\n    return [];\n}",
                    "python", "def twoSum(nums, target):\n    # Write your code here\n    return []",
                    "java", "public class Solution {\n    public int[] twoSum(int[] nums, int target) {\n        // Write your code here\n        return new int[0];\n    }\n}"
                ))
                .testCases(Arrays.asList(
                    CodingQuestion.TestCase.builder().input("[2,7,11,15], 9").expectedOutput("[0,1]").isHidden(false).build(),
                    CodingQuestion.TestCase.builder().input("[3,2,4], 6").expectedOutput("[1,2]").isHidden(false).build(),
                    CodingQuestion.TestCase.builder().input("[3,3], 6").expectedOutput("[0,1]").isHidden(true).build()
                ))
                .build(),

            CodingQuestion.builder()
                .title("Valid Parentheses")
                .description("Given a string s containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid.\nAn input string is valid if brackets close in the correct order.")
                .difficulty("Easy")
                .topicTags(Arrays.asList("strings"))
                .timeLimitMinutes(15)
                .starterCode(java.util.Map.of(
                    "javascript", "function isValid(s) {\n    // Write your code here\n    return false;\n}",
                    "python", "def isValid(s):\n    # Write your code here\n    return False",
                    "java", "public class Solution {\n    public boolean isValid(String s) {\n        // Write your code here\n        return false;\n    }\n}"
                ))
                .testCases(Arrays.asList(
                    CodingQuestion.TestCase.builder().input("\"()\"").expectedOutput("true").isHidden(false).build(),
                    CodingQuestion.TestCase.builder().input("\"()[]{}\"").expectedOutput("true").isHidden(false).build(),
                    CodingQuestion.TestCase.builder().input("\"(]\"").expectedOutput("false").isHidden(true).build()
                ))
                .build(),

            CodingQuestion.builder()
                .title("Reverse String")
                .description("Write a function that reverses a string. The input string is given as an array of characters s. You must do this by modifying the input array in-place with O(1) extra memory.")
                .difficulty("Easy")
                .topicTags(Arrays.asList("strings"))
                .timeLimitMinutes(10)
                .starterCode(java.util.Map.of(
                    "javascript", "function reverseString(s) {\n    // Write your code here\n}",
                    "python", "def reverseString(s):\n    # Write your code here\n    pass",
                    "java", "public class Solution {\n    public void reverseString(char[] s) {\n        // Write your code here\n    }\n}"
                ))
                .testCases(Arrays.asList(
                    CodingQuestion.TestCase.builder().input("['h','e','l','l','o']").expectedOutput("['o','l','l','e','h']").isHidden(false).build(),
                    CodingQuestion.TestCase.builder().input("['H','a','n','n','a','h']").expectedOutput("['h','a','n','n','a','H']").isHidden(true).build()
                ))
                .build(),

            CodingQuestion.builder()
                .title("Merge Sorted Array")
                .description("You are given two integer arrays nums1 and nums2, sorted in non-decreasing order, and two integers m and n. Merge nums2 into nums1 as one sorted array in-place.")
                .difficulty("Easy")
                .topicTags(Arrays.asList("arrays"))
                .timeLimitMinutes(15)
                .starterCode(java.util.Map.of(
                    "javascript", "function merge(nums1, m, nums2, n) {\n    // Write your code here\n}",
                    "python", "def merge(nums1, m, nums2, n):\n    # Write your code here\n    pass",
                    "java", "public class Solution {\n    public void merge(int[] nums1, int m, int[] nums2, int n) {\n        // Write your code here\n    }\n}"
                ))
                .testCases(Arrays.asList(
                    CodingQuestion.TestCase.builder().input("[1,2,3,0,0,0], 3, [2,5,6], 3").expectedOutput("[1,2,2,3,5,6]").isHidden(false).build(),
                    CodingQuestion.TestCase.builder().input("[1], 1, [], 0").expectedOutput("[1]").isHidden(true).build()
                ))
                .build(),

            CodingQuestion.builder()
                .title("Climbing Stairs")
                .description("You are climbing a staircase. It takes n steps to reach the top. Each time you can either climb 1 or 2 steps. In how many distinct ways can you climb to the top?")
                .difficulty("Easy")
                .topicTags(Arrays.asList("dp"))
                .timeLimitMinutes(15)
                .starterCode(java.util.Map.of(
                    "javascript", "function climbStairs(n) {\n    // Write your code here\n    return 0;\n}",
                    "python", "def climbStairs(n):\n    # Write your code here\n    return 0",
                    "java", "public class Solution {\n    public int climbStairs(int n) {\n        // Write your code here\n        return 0;\n    }\n}"
                ))
                .testCases(Arrays.asList(
                    CodingQuestion.TestCase.builder().input("2").expectedOutput("2").isHidden(false).build(),
                    CodingQuestion.TestCase.builder().input("3").expectedOutput("3").isHidden(false).build(),
                    CodingQuestion.TestCase.builder().input("4").expectedOutput("5").isHidden(true).build()
                ))
                .build(),

            CodingQuestion.builder()
                .title("Fibonacci Number")
                .description("The Fibonacci numbers, commonly denoted F(n) form a sequence, called the Fibonacci sequence, such that each number is the sum of the two preceding ones, starting from 0 and 1. Given n, calculate F(n).")
                .difficulty("Easy")
                .topicTags(Arrays.asList("recursion"))
                .timeLimitMinutes(10)
                .starterCode(java.util.Map.of(
                    "javascript", "function fib(n) {\n    // Write your code here\n    return 0;\n}",
                    "python", "def fib(n):\n    # Write your code here\n    return 0",
                    "java", "public class Solution {\n    public int fib(int n) {\n        // Write your code here\n        return 0;\n    }\n}"
                ))
                .testCases(Arrays.asList(
                    CodingQuestion.TestCase.builder().input("2").expectedOutput("1").isHidden(false).build(),
                    CodingQuestion.TestCase.builder().input("4").expectedOutput("3").isHidden(false).build(),
                    CodingQuestion.TestCase.builder().input("10").expectedOutput("55").isHidden(true).build()
                ))
                .build(),

            CodingQuestion.builder()
                .title("Maximum Subarray")
                .description("Given an integer array nums, find the subarray with the largest sum, and return its sum.")
                .difficulty("Medium")
                .topicTags(Arrays.asList("dp"))
                .timeLimitMinutes(20)
                .starterCode(java.util.Map.of(
                    "javascript", "function maxSubArray(nums) {\n    // Write your code here\n    return 0;\n}",
                    "python", "def maxSubArray(nums):\n    # Write your code here\n    return 0",
                    "java", "public class Solution {\n    public int maxSubArray(int[] nums) {\n        // Write your code here\n        return 0;\n    }\n}"
                ))
                .testCases(Arrays.asList(
                    CodingQuestion.TestCase.builder().input("[-2,1,-3,4,-1,2,1,-5,4]").expectedOutput("6").isHidden(false).build(),
                    CodingQuestion.TestCase.builder().input("[1]").expectedOutput("1").isHidden(false).build(),
                    CodingQuestion.TestCase.builder().input("[5,4,-1,7,8]").expectedOutput("23").isHidden(true).build()
                ))
                .build(),

            CodingQuestion.builder()
                .title("Longest Substring Without Repeating")
                .description("Given a string s, find the length of the longest substring without repeating characters.")
                .difficulty("Medium")
                .topicTags(Arrays.asList("strings"))
                .timeLimitMinutes(20)
                .starterCode(java.util.Map.of(
                    "javascript", "function lengthOfLongestSubstring(s) {\n    // Write your code here\n    return 0;\n}",
                    "python", "def lengthOfLongestSubstring(s):\n    # Write your code here\n    return 0",
                    "java", "public class Solution {\n    public int lengthOfLongestSubstring(String s) {\n        // Write your code here\n        return 0;\n    }\n}"
                ))
                .testCases(Arrays.asList(
                    CodingQuestion.TestCase.builder().input("\"abcabcbb\"").expectedOutput("3").isHidden(false).build(),
                    CodingQuestion.TestCase.builder().input("\"bbbbb\"").expectedOutput("1").isHidden(false).build(),
                    CodingQuestion.TestCase.builder().input("\"pwwkew\"").expectedOutput("3").isHidden(true).build()
                ))
                .build(),

            CodingQuestion.builder()
                .title("Path Sum")
                .description("Given the root of a binary tree and an integer targetSum, return true if the tree has a root-to-leaf path such that adding up all the values along the path equals targetSum.")
                .difficulty("Easy")
                .topicTags(Arrays.asList("trees"))
                .timeLimitMinutes(15)
                .starterCode(java.util.Map.of(
                    "javascript", "function hasPathSum(root, targetSum) {\n    // Write your code here\n    return false;\n}",
                    "python", "def hasPathSum(root, targetSum):\n    # Write your code here\n    return False",
                    "java", "public class Solution {\n    public boolean hasPathSum(TreeNode root, int targetSum) {\n        // Write your code here\n        return false;\n    }\n}"
                ))
                .testCases(Arrays.asList(
                    CodingQuestion.TestCase.builder().input("[1,2,3], 3").expectedOutput("true").isHidden(false).build(),
                    CodingQuestion.TestCase.builder().input("[1,2], 4").expectedOutput("false").isHidden(true).build()
                ))
                .build(),

            CodingQuestion.builder()
                .title("Container With Most Water")
                .description("You are given an integer array height of length n. Find two lines that together with the x-axis form a container, such that the container contains the most water. Return the maximum amount of water a container can store.")
                .difficulty("Medium")
                .topicTags(Arrays.asList("arrays"))
                .timeLimitMinutes(20)
                .starterCode(java.util.Map.of(
                    "javascript", "function maxArea(height) {\n    // Write your code here\n    return 0;\n}",
                    "python", "def maxArea(height):\n    # Write your code here\n    return 0",
                    "java", "public class Solution {\n    public int maxArea(int[] height) {\n        // Write your code here\n        return 0;\n    }\n}"
                ))
                .testCases(Arrays.asList(
                    CodingQuestion.TestCase.builder().input("[1,8,6,2,5,4,8,3,7]").expectedOutput("49").isHidden(false).build(),
                    CodingQuestion.TestCase.builder().input("[1,1]").expectedOutput("1").isHidden(true).build()
                ))
                .build(),

            CodingQuestion.builder()
                .title("Single Number")
                .description("Given a non-empty array of integers nums, every element appears twice except for one. Find that single one. You must implement a solution with a linear runtime complexity and use only constant extra space.")
                .difficulty("Easy")
                .topicTags(Arrays.asList("arrays"))
                .timeLimitMinutes(10)
                .starterCode(java.util.Map.of(
                    "javascript", "function singleNumber(nums) {\n    // Write your code here\n    return 0;\n}",
                    "python", "def singleNumber(nums):\n    # Write your code here\n    return 0",
                    "java", "public class Solution {\n    public int singleNumber(int[] nums) {\n        // Write your code here\n        return 0;\n    }\n}"
                ))
                .testCases(Arrays.asList(
                    CodingQuestion.TestCase.builder().input("[2,2,1]").expectedOutput("1").isHidden(false).build(),
                    CodingQuestion.TestCase.builder().input("[4,1,2,1,2]").expectedOutput("4").isHidden(false).build(),
                    CodingQuestion.TestCase.builder().input("[1]").expectedOutput("1").isHidden(true).build()
                ))
                .build(),

            CodingQuestion.builder()
                .title("House Robber")
                .description("You are a professional robber planning to rob houses along a street. Each house has a certain amount of money stashed. The only constraint stopping you from robbing each of them is that adjacent houses have security systems connected and it will automatically contact the police if two adjacent houses were broken into on the same night. Return the maximum amount of money you can rob tonight without alerting the police.")
                .difficulty("Medium")
                .topicTags(Arrays.asList("dp"))
                .timeLimitMinutes(20)
                .starterCode(java.util.Map.of(
                    "javascript", "function rob(nums) {\n    // Write your code here\n    return 0;\n}",
                    "python", "def rob(nums):\n    # Write your code here\n    return 0",
                    "java", "public class Solution {\n    public int rob(int[] nums) {\n        // Write your code here\n        return 0;\n    }\n}"
                ))
                .testCases(Arrays.asList(
                    CodingQuestion.TestCase.builder().input("[1,2,3,1]").expectedOutput("4").isHidden(false).build(),
                    CodingQuestion.TestCase.builder().input("[2,7,9,3,1]").expectedOutput("12").isHidden(true).build()
                ))
                .build(),

            CodingQuestion.builder()
                .title("Reverse Linked List")
                .description("Given the head of a singly linked list, reverse the list, and return the reversed list.")
                .difficulty("Easy")
                .topicTags(Arrays.asList("recursion"))
                .timeLimitMinutes(15)
                .starterCode(java.util.Map.of(
                    "javascript", "function reverseList(head) {\n    // Write your code here\n    return null;\n}",
                    "python", "def reverseList(head):\n    # Write your code here\n    return None",
                    "java", "public class Solution {\n    public ListNode reverseList(ListNode head) {\n        // Write your code here\n        return null;\n    }\n}"
                ))
                .testCases(Arrays.asList(
                    CodingQuestion.TestCase.builder().input("[1,2,3,4,5]").expectedOutput("[5,4,3,2,1]").isHidden(false).build(),
                    CodingQuestion.TestCase.builder().input("[]").expectedOutput("[]").isHidden(true).build()
                ))
                .build(),

            CodingQuestion.builder()
                .title("Clone Graph")
                .description("Given a reference of a node in a connected undirected graph, return a deep copy (clone) of the graph. Each node in the graph contains a value (int) and a list of its neighbors.")
                .difficulty("Medium")
                .topicTags(Arrays.asList("graphs"))
                .timeLimitMinutes(25)
                .starterCode(java.util.Map.of(
                    "javascript", "function cloneGraph(node) {\n    // Write your code here\n    return null;\n}",
                    "python", "def cloneGraph(node):\n    # Write your code here\n    return None",
                    "java", "public class Solution {\n    public Node cloneGraph(Node node) {\n        // Write your code here\n        return null;\n    }\n}"
                ))
                .testCases(Arrays.asList(
                    CodingQuestion.TestCase.builder().input("[[2,4],[1,3],[2,4],[1,3]]").expectedOutput("[[2,4],[1,3],[2,4],[1,3]]").isHidden(false).build(),
                    CodingQuestion.TestCase.builder().input("[]").expectedOutput("[]").isHidden(true).build()
                ))
                .build(),

            CodingQuestion.builder()
                .title("Number of Islands")
                .description("Given an m x n 2D binary grid grid which represents a map of '1's (land) and '0's (water), return the number of islands. An island is surrounded by water and is formed by connecting adjacent lands horizontally or vertically.")
                .difficulty("Medium")
                .topicTags(Arrays.asList("graphs"))
                .timeLimitMinutes(25)
                .starterCode(java.util.Map.of(
                    "javascript", "function numIslands(grid) {\n    // Write your code here\n    return 0;\n}",
                    "python", "def numIslands(grid):\n    # Write your code here\n    return 0",
                    "java", "public class Solution {\n    public int numIslands(char[][] grid) {\n        // Write your code here\n        return 0;\n    }\n}"
                ))
                .testCases(Arrays.asList(
                    CodingQuestion.TestCase.builder().input("[[\"1\",\"1\",\"1\",\"1\",\"0\"],[\"1\",\"1\",\"0\",\"1\",\"0\"],[\"1\",\"1\",\"0\",\"0\",\"0\"],[\"0\",\"0\",\"0\",\"0\",\"0\"]]").expectedOutput("1").isHidden(false).build(),
                    CodingQuestion.TestCase.builder().input("[[\"1\",\"1\",\"0\",\"0\",\"0\"],[\"1\",\"1\",\"0\",\"0\",\"0\"],[\"0\",\"0\",\"1\",\"0\",\"0\"],[\"0\",\"0\",\"0\",\"1\",\"1\"]]").expectedOutput("3").isHidden(true).build()
                ))
                .build(),

            CodingQuestion.builder()
                .title("Longest Common Subsequence")
                .description("Given two strings text1 and text2, return the length of their longest common subsequence. If there is no common subsequence, return 0.")
                .difficulty("Medium")
                .topicTags(Arrays.asList("dp"))
                .timeLimitMinutes(25)
                .starterCode(java.util.Map.of(
                    "javascript", "function longestCommonSubsequence(text1, text2) {\n    // Write your code here\n    return 0;\n}",
                    "python", "def longestCommonSubsequence(text1, text2):\n    # Write your code here\n    return 0",
                    "java", "public class Solution {\n    public int longestCommonSubsequence(String text1, String text2) {\n        // Write your code here\n        return 0;\n    }\n}"
                ))
                .testCases(Arrays.asList(
                    CodingQuestion.TestCase.builder().input("\"abcde\", \"ace\"").expectedOutput("3").isHidden(false).build(),
                    CodingQuestion.TestCase.builder().input("\"abc\", \"def\"").expectedOutput("0").isHidden(true).build()
                ))
                .build(),

            CodingQuestion.builder()
                .title("Edit Distance")
                .description("Given two strings word1 and word2, return the minimum number of operations required to convert word1 to word2. You have the following three operations permitted on a word: Insert, Delete, Replace.")
                .difficulty("Hard")
                .topicTags(Arrays.asList("dp"))
                .timeLimitMinutes(30)
                .starterCode(java.util.Map.of(
                    "javascript", "function minDistance(word1, word2) {\n    // Write your code here\n    return 0;\n}",
                    "python", "def minDistance(word1, word2):\n    # Write your code here\n    return 0",
                    "java", "public class Solution {\n    public int minDistance(String word1, String word2) {\n        // Write your code here\n        return 0;\n    }\n}"
                ))
                .testCases(Arrays.asList(
                    CodingQuestion.TestCase.builder().input("\"horse\", \"ros\"").expectedOutput("3").isHidden(false).build(),
                    CodingQuestion.TestCase.builder().input("\"intention\", \"execution\"").expectedOutput("5").isHidden(true).build()
                ))
                .build(),

            CodingQuestion.builder()
                .title("Merge k Sorted Lists")
                .description("You are given an array of k linked-lists lists, each linked-list is sorted in ascending order. Merge all the linked-lists into one sorted linked-list and return it.")
                .difficulty("Hard")
                .topicTags(Arrays.asList("arrays"))
                .timeLimitMinutes(30)
                .starterCode(java.util.Map.of(
                    "javascript", "function mergeKLists(lists) {\n    // Write your code here\n    return null;\n}",
                    "python", "def mergeKLists(lists):\n    # Write your code here\n    return None",
                    "java", "public class Solution {\n    public ListNode mergeKLists(ListNode[] lists) {\n        // Write your code here\n        return null;\n    }\n}"
                ))
                .testCases(Arrays.asList(
                    CodingQuestion.TestCase.builder().input("[[1,4,5],[1,3,4],[2,6]]").expectedOutput("[1,1,2,3,4,4,5,6]").isHidden(false).build(),
                    CodingQuestion.TestCase.builder().input("[]").expectedOutput("[]").isHidden(true).build()
                ))
                .build(),

            CodingQuestion.builder()
                .title("Binary Tree Inorder Traversal")
                .description("Given the root of a binary tree, return the inorder traversal of its nodes' values.")
                .difficulty("Easy")
                .topicTags(Arrays.asList("trees"))
                .timeLimitMinutes(10)
                .starterCode(java.util.Map.of(
                    "javascript", "function inorderTraversal(root) {\n    // Write your code here\n    return [];\n}",
                    "python", "def inorderTraversal(root):\n    # Write your code here\n    return []",
                    "java", "public class Solution {\n    public List<Integer> inorderTraversal(TreeNode root) {\n        // Write your code here\n        return new java.util.ArrayList<>();\n    }\n}"
                ))
                .testCases(Arrays.asList(
                    CodingQuestion.TestCase.builder().input("[1,null,2,3]").expectedOutput("[1,3,2]").isHidden(false).build(),
                    CodingQuestion.TestCase.builder().input("[]").expectedOutput("[]").isHidden(true).build()
                ))
                .build(),

            CodingQuestion.builder()
                .title("Search in Rotated Array")
                .description("There is an integer array nums sorted in ascending order (with distinct values). Prior to being passed to your function, nums is possibly rotated. Given the array nums after the possible rotation and an integer target, return the index of target if it is in nums, or -1 if it is not in nums.")
                .difficulty("Medium")
                .topicTags(Arrays.asList("arrays"))
                .timeLimitMinutes(20)
                .starterCode(java.util.Map.of(
                    "javascript", "function search(nums, target) {\n    // Write your code here\n    return -1;\n}",
                    "python", "def search(nums, target):\n    # Write your code here\n    return -1",
                    "java", "public class Solution {\n    public int search(int[] nums, int target) {\n        // Write your code here\n        return -1;\n    }\n}"
                ))
                .testCases(Arrays.asList(
                    CodingQuestion.TestCase.builder().input("[4,5,6,7,0,1,2], 0").expectedOutput("4").isHidden(false).build(),
                    CodingQuestion.TestCase.builder().input("[4,5,6,7,0,1,2], 3").expectedOutput("-1").isHidden(true).build()
                ))
                .build()
        );
        codingQuestionRepository.saveAll(questions);
    }

    private void seedFlashcards() {
        if (flashcardRepository.count() > 0) return;
        System.out.println("Seeding 10 core Flashcards...");
        
        List<Flashcard> cards = Arrays.asList(
            Flashcard.builder()
                .userId("default_seed")
                .category("System Design")
                .question("What is a CDN (Content Delivery Network)?")
                .answer("A CDN is a globally distributed network of proxy servers that cache static content (images, videos, HTML) closer to users, reducing latency and database load.")
                .easeFactor(2.5)
                .intervalDays(0)
                .repetitions(0)
                .nextReviewDate(java.time.LocalDateTime.now())
                .build(),
            Flashcard.builder()
                .userId("default_seed")
                .category("System Design")
                .question("What is the CAP Theorem?")
                .answer("CAP states that a distributed data store can simultaneously provide at most two of three guarantees: Consistency (every read receives most recent write), Availability (every request receives non-error response), and Partition tolerance (network dropouts do not crash database).")
                .easeFactor(2.5)
                .intervalDays(0)
                .repetitions(0)
                .nextReviewDate(java.time.LocalDateTime.now())
                .build(),
            Flashcard.builder()
                .userId("default_seed")
                .category("System Design")
                .question("Horizontal vs Vertical Scaling?")
                .answer("Horizontal scaling means adding more machines/nodes to the pool (scaling out), whereas Vertical scaling means adding more power (CPU, RAM) to an existing machine (scaling up).")
                .easeFactor(2.5)
                .intervalDays(0)
                .repetitions(0)
                .nextReviewDate(java.time.LocalDateTime.now())
                .build(),
            Flashcard.builder()
                .userId("default_seed")
                .category("Java & OOP")
                .question("Interface vs Abstract Class?")
                .answer("Interfaces define contracts (static behavior parameters) with only abstract methods (pre-Java 8), supporting multiple inheritance. Abstract classes can have state variables, constructors, and concrete methods, but Java classes can inherit only one.")
                .easeFactor(2.5)
                .intervalDays(0)
                .repetitions(0)
                .nextReviewDate(java.time.LocalDateTime.now())
                .build(),
            Flashcard.builder()
                .userId("default_seed")
                .category("Java & OOP")
                .question("What is Polymorphism?")
                .answer("Polymorphism allows objects to take on multiple forms. It manifests as Method Overloading (compile-time: same method name, different signatures) and Method Overriding (runtime: child class overrides parent class method).")
                .easeFactor(2.5)
                .intervalDays(0)
                .repetitions(0)
                .nextReviewDate(java.time.LocalDateTime.now())
                .build(),
            Flashcard.builder()
                .userId("default_seed")
                .category("Java & OOP")
                .question("What is Dependency Injection?")
                .answer("DI is a design pattern where an object receives its dependencies from an external assembler (e.g., Spring Container) rather than creating them itself, promoting loose coupling and testability.")
                .easeFactor(2.5)
                .intervalDays(0)
                .repetitions(0)
                .nextReviewDate(java.time.LocalDateTime.now())
                .build(),
            Flashcard.builder()
                .userId("default_seed")
                .category("Databases")
                .question("What are ACID properties?")
                .answer("ACID guarantees database transaction reliability: Atomicity (all or nothing), Consistency (preserves database rules), Isolation (concurrent transactions do not interfere), and Durability (committed data persists permanently).")
                .easeFactor(2.5)
                .intervalDays(0)
                .repetitions(0)
                .nextReviewDate(java.time.LocalDateTime.now())
                .build(),
            Flashcard.builder()
                .userId("default_seed")
                .category("Databases")
                .question("Why is Indexing helpful?")
                .answer("Indexing creates data structures (e.g., B-Trees) matching keys to physical storage blocks, accelerating query search lookup speeds from O(N) linear scans to O(log N).")
                .easeFactor(2.5)
                .intervalDays(0)
                .repetitions(0)
                .nextReviewDate(java.time.LocalDateTime.now())
                .build(),
            Flashcard.builder()
                .userId("default_seed")
                .category("Databases")
                .question("SQL vs NoSQL?")
                .answer("SQL databases are relational, schema-based, table-structured, and scale vertically (great for complex joins). NoSQL databases are non-relational, document/key-value based, schema-less, and scale horizontally.")
                .easeFactor(2.5)
                .intervalDays(0)
                .repetitions(0)
                .nextReviewDate(java.time.LocalDateTime.now())
                .build(),
            Flashcard.builder()
                .userId("default_seed")
                .category("Data Science")
                .question("Overfitting vs Underfitting?")
                .answer("Overfitting is when a model learns training data noise too well, failing to generalize to new data. Underfitting is when the model is too simple to capture the underlying data trend.")
                .easeFactor(2.5)
                .intervalDays(0)
                .repetitions(0)
                .nextReviewDate(java.time.LocalDateTime.now())
                .build()
        );
        flashcardRepository.saveAll(cards);
    }
}

