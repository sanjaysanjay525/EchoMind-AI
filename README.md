<<<<<<< HEAD
# EchoMind-AI
=======
# EchoMind AI: Intelligent Graded Multimodal Mock Interview Platform

EchoMind AI is an advanced, automated mock interview and skill diagnostics simulator designed to prepare candidates for modern corporate recruitment loops (FAANG, MNCs, and high-growth startups). 

By integrating multi-round pipelines (Aptitude, Behavioral, Coding, and System Design) with real-time video/audio analysis and AI-driven skill diagnostics, EchoMind AI provides a unified prep cockpit for job seekers.

---

## 🛠️ Technology Stack
- **Frontend:** React (Vite, Recharts, Monaco Editor, Lucide Icons)
- **Backend:** Spring Boot (Java 26, Spring Security, MongoDB Data Mappings)
- **Database:** MongoDB (Persistent streaks, session history, scheduled queues, study notes)
- **AI Engine:** Google Gemini API (Gateway via OmniRoute gateways for prompt evaluations)
- **Computer Vision:** MediaPipe (Face mesh tracking, head tilt, eye contact percentage, attention scores)

---

## 🚀 Currently Implemented Features (14 Core Modules)

1. **🏆 Global Leaderboard:** Ranks candidates by average mock score with gold/silver/bronze podiums, privacy-masked emails, and dynamic performance levels (Elite, Expert, Advanced).
2. **📊 Performance Analytics:** Dashboard displaying chronological score timelines (AreaChart), round breakdowns (RadarChart), and domain performance (BarChart) via Recharts.
3. **🤖 AI Prep Assistant Chatbot:** Floating prep bot active on all pages providing quick CV reviews and platform tips.
4. **⏱️ Timed Mock Test Mode:** Per-question pressure simulation with 30s/60s/90s timers and auto-advance triggers.
5. **🎯 AI Skill Gap Analysis:** Deep-dive cards detailing improvement areas, core strengths, next action steps, and curated external study resources.
6. **🔥 Practice Streaks:** Streaks counter with milestone chips (3-day, 7-day, 14-day trackers) in the navigation bar.
7. **📅 Interview Scheduler:** Queue planner featuring real-time countdown tickers until active interview slots.
8. **🎨 Premium Glassmorphism UI:** Redesigned dark-theme landing page with visual counters, gradient grids, and testimonial carousels.
9. **💼 Corporate Readiness Benchmarking:** Estimates hiring probability (High/Medium/Low) for target company tiers (FAANG, Mid-tier, Startup) with 7/30/90-day mastery plans.
10. **📝 Study Notes Sandbox:** Full CRUD playground supporting markdown note inputs for custom candidate review lists.
11. **🔍 AI Question Bank Directory Explorer:** Search catalog merging general Q&As and coding sandboxes, filterable by target role and difficulty.
12. **💡 STAR Method Answer Builder:** Behavioral workspace evaluating responses based on Situation, Task, Action, and Result coverage.
13. **🗣️ Speech & Pacing Feedback:** Scorecard metrics tracking speaking rate (WPM), pause incidents, filler words, and vocal delivery clarity.
14. **🎴 Interactive Revision Flashcards:** Flippable 3D card decks reviewing OOP, Databases, System Design, and Data Science.

---

## 🔮 Future Enhancements & Research Roadmap

Mapped against the Interactive Interview Assistant Assistant (IIAA) research frameworks, the following sections represent the scaling roadmap for EchoMind AI:

### 1. AI & Evaluation Intelligence
* **Multi-model Consensus Scoring:** Cross-validate Gemini's evaluations against secondary open-source LLMs (e.g., Llama/Mistral) and report agreement metrics (Cohen's Kappa) to mitigate cloud-based grading biases.
* **Human-Expert Calibration Loop:** Enable professional mentors and recruiters to score interview logs to calculate and publish an inter-rater reliability index.
* **Adaptive Difficulty Engine:** Dynamically escalate or de-escalate technical and coding question difficulties in real-time based on candidate speech confidence and answer accuracy.
* **Sentiment & Confidence Trajectory:** Plot tone and facial confidence variations as a graphical timeline across the session using speech acoustic cues and MediaPipe face meshes.

### 2. Realism & Interaction Layer
* **Speech-to-Animation Facial Sync:** Layer idle human-like behaviors (blinking, minor head tilting, speaking mouth movement) onto avatar interfaces to minimize the "static bot" feel of automated interviewers.
* **Code-Switching Robustness:** Implement mixed-language Speech-to-Text translation logic (e.g., mixing English with regional terminologies) to handle regional code-switching patterns during verbal rounds.
* **Latency-Aware Response Pacing:** Stream audio synthesizer outputs utilizing a 75-character chunking threshold to minimize audio generation pauses and latency.

### 3. Architecture & Reliability
* **Hybrid Offline/Online Mode:** Cache core role question directories and lightweight local models to support mock sessions during API connectivity dropouts.
* **Cold-Start Mitigation:** Implement a pre-warm connection wake-up pattern for serverless STT/TTS containers to eliminate initial response delay spikes.
* **Horizontal Scaling Readiness:** Document and design MongoDB sharding keys and Spring Boot stateless execution pools to scale concurrently for institutional-level recruitment drives.

### 4. Data & Research Rigor
* **Pre-Test/Post-Test Learning-Gain Study:** Conduct structured evaluations measuring user competency gains before and after practicing on EchoMind AI to formally validate learning utility.
* **Anonymized, Privacy-First Logging:** Enforce strict privacy rules (transcribe spoken audio, run evaluation, then immediately discard raw audio records within 30 minutes).
* **Multi-Institution Validation:** Propose validation tests across multiple partner universities to benchmark mock reliability across diverse candidate groups.

### 5. Gamification & UX
* **Integrated DSA Roadmap Tracker:** Sync interview streaks directly with daily algorithm roadmaps for a consolidated readiness rating.
* **Automated PDF Scorecards:** Auto-generate downloadable one-page summaries containing core scores, gap listings, and AI learning tips.
* **Peer/Mentor Review Annotations:** Support manual code reviews and verbal annotations from peers, blending human expertise with automated AI metrics.

### 6. Expansion Tracks
* **Multi-Language Support (Tamil, Hindi):** Extend interfaces to support multi-lingual interview sessions, matching target campus placement demographics in India.
* **Granular Role Classifications:** Segment ESCO roles into hierarchical sub-tracks (e.g., SDE-1 vs. SDE-2, Machine Learning Specialist, Product Owner) with tailored grading rubrics.
* **Company-Specific Interview Mock Modes:** Provide targeted preparation formats mimicking known assessment loops of major tech employers (e.g., Amazon Leadership Principles, Google System Architecture deep dives).

---

## 📋 Appendix: Exploratory Features Under Consideration

These conceptual features are mapped out as high-priority research and product design initiatives to extend the core platform capabilities:

### 1. Engagement & Realism (Making it "Feel Alive")
* **Interviewer Personality Profiles:** Configurable personas (e.g., "Amazon Bar-Raiser" vs. "Startup Founder") leveraging specialized Gemini system prompts and pacing behaviors to simulate different interview dynamics.
* **Live Pushback/Objection Mode:** Real-time conversational challenges ("That sounds rehearsed, tell me about the failure case") triggered during responses rather than simple post-hoc evaluation.
* **Silence & Freeze Detection:** Integration of MediaPipe and audio gap analysis to flag hesitations (e.g., 8+ second pauses) and surface pacing anomalies in candidate reports.

### 2. Habit Loops & Retention (Making it "Sticky")
* **Daily "One-Question" Drills:** A lightweight 2-minute daily mock drill (Wordle-style) integrated into the platform's streak/leaderboard system to drive daily active engagement.
* **Competency-Targeted Micro-Sessions:** Dynamic generation of 5-question targeted drills based on the candidate's two lowest competency scores from historical logs.
* **Sports-style Interview Replays:** Recorded mock sessions featuring inline timeline annotations showing exact moments of stuttering, weak STAR structure, or pacing drops.

### 3. Rigor & Transparency (Defensibility in Viva/Evaluations)
* **Explainable Scoring Engine:** Deconstruction of evaluation scores into clear sub-rubrics (STAR alignment, communication clarity, accuracy, delivery) with transparent weighting parameters.
* **Consistency Self-Audits (Variance Testing):** A calibration feature that runs identical candidate responses through the AI engine multiple times to display evaluation consistency and variance.
* **Anonymized Peer Benchmarking:** Relative candidate ranking (e.g., "Your communication score was higher than 72% of software engineer candidates on this question") aggregated from database telemetry.

### 4. Direct Problem Solvers (Boring but Painful Realities)
* **Resume-Calibrated Answer Re-writer:** An automated builder that rewrites low-scoring answers into high-scoring model answers customized with details from the user's uploaded resume.
* **Pre-Interview Readiness Checklist:** A structured target-date checklist linking mock score thresholds, resume updates, and general review progress before candidate placement days.
* **Panel Interview Simulator:** Multi-bot conversational loops where two or more distinct AI interviewers (e.g., one behavioral, one technical) dynamically interject in the same session.
>>>>>>> 212b218 (feat: complete EchoMind AI features with live coding round, spaced repetition, explainable scoring breakdown, and weekly digest)
