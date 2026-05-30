package com.interview.simulator.controller;

import com.interview.simulator.entity.InterviewSession;
import com.interview.simulator.entity.QuestionAnswer;
import com.interview.simulator.repository.InterviewSessionRepository;
import com.interview.simulator.repository.QuestionAnswerRepository;
import com.interview.simulator.service.AIService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/interviews")
@CrossOrigin(origins = "*") // Allow React proxy & dev requests
public class InterviewController {

    @Autowired
    private InterviewSessionRepository sessionRepository;

    @Autowired
    private QuestionAnswerRepository questionAnswerRepository;

    @Autowired
    private AIService aiService;

    /**
     * Get all completed interviews for the dashboard.
     */
    @GetMapping
    public ResponseEntity<List<InterviewSession>> getAllCompletedInterviews() {
        List<InterviewSession> all = sessionRepository.findAll();
        List<InterviewSession> completed = all.stream()
                .filter(s -> "COMPLETED".equals(s.getStatus()))
                .sorted(Comparator.comparing(InterviewSession::getCreatedAt).reversed())
                .toList();
        return ResponseEntity.ok(completed);
    }

    /**
     * Get a hint for a specific question.
     */
    @GetMapping("/{sessionId}/questions/{questionId}/hint")
    public ResponseEntity<Map<String, String>> getQuestionHint(
            @PathVariable UUID sessionId,
            @PathVariable UUID questionId) {
        Optional<QuestionAnswer> qaOpt = questionAnswerRepository.findById(questionId);
        if (qaOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        String hint = aiService.generateHint(qaOpt.get().getQuestionText());
        return ResponseEntity.ok(Map.of("hint", hint));
    }

    /**
     * Start a new mock interview session and generate the 1st question.
     */
    @PostMapping
    public ResponseEntity<Map<String, Object>> startInterview(@RequestBody Map<String, String> request) {
        String roleType = request.getOrDefault("roleType", "Software Engineer");
        String experienceLevel = request.getOrDefault("experienceLevel", "Mid-Level");
        String resumeText = request.get("resumeText");

        // 1. Save Session Entity
        InterviewSession session = new InterviewSession();
        session.setRoleType(roleType);
        session.setExperienceLevel(experienceLevel);
        session.setResumeText(resumeText);
        session = sessionRepository.save(session);

        // 2. Generate First Question
        String firstQuestionText = aiService.generateNextQuestion(roleType, experienceLevel, resumeText, new ArrayList<>());

        // 3. Save Question Entity
        QuestionAnswer firstQA = new QuestionAnswer();
        firstQA.setInterviewSession(session);
        firstQA.setQuestionText(firstQuestionText);
        firstQA.setSequenceNumber(1);
        questionAnswerRepository.save(firstQA);

        // 4. Return Session Information
        Map<String, Object> response = new HashMap<>();
        response.put("sessionId", session.getId());
        response.put("roleType", session.getRoleType());
        response.put("experienceLevel", session.getExperienceLevel());
        response.put("currentQuestion", Map.of(
            "id", firstQA.getId(),
            "questionText", firstQA.getQuestionText(),
            "sequenceNumber", 1
        ));

        return ResponseEntity.ok(response);
    }

    /**
     * Submit an answer, evaluate it, and generate the next question OR close the session.
     */
    @PostMapping("/{sessionId}/answers")
    public ResponseEntity<Map<String, Object>> submitAnswer(
            @PathVariable UUID sessionId,
            @RequestBody Map<String, Object> request) {

        Optional<InterviewSession> sessionOpt = sessionRepository.findById(sessionId);
        if (sessionOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        InterviewSession session = sessionOpt.get();

        String questionIdStr = (String) request.get("questionId");
        String answerText = (String) request.get("answerText");

        if (questionIdStr == null || answerText == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Missing questionId or answerText"));
        }

        UUID questionId = UUID.fromString(questionIdStr);
        Optional<QuestionAnswer> qaOpt = questionAnswerRepository.findById(questionId);
        if (qaOpt.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Question not found"));
        }
        QuestionAnswer currentQA = qaOpt.get();

        // 1. Evaluate user answer
        Map<String, Object> evaluation = aiService.evaluateAnswer(currentQA.getQuestionText(), answerText);

        // 2. Update QuestionAnswer Entity
        currentQA.setAnswerText(answerText);
        currentQA.setRelevanceScore((Integer) evaluation.getOrDefault("relevanceScore", 75));
        currentQA.setClarityScore((Integer) evaluation.getOrDefault("clarityScore", 75));
        currentQA.setStructureScore((Integer) evaluation.getOrDefault("structureScore", 75));
        currentQA.setFeedbackText((String) evaluation.getOrDefault("feedbackText", "Good attempt."));
        questionAnswerRepository.save(currentQA);

        // Fetch refreshed session questions list
        List<QuestionAnswer> allQA = session.getQuestionsAnswers();

        Map<String, Object> response = new HashMap<>();

        // Check if we have completed 5 questions
        if (currentQA.getSequenceNumber() >= 5) {
            // 3. Compile Final Review
            session.setStatus("COMPLETED");
            session.setCompletedAt(LocalDateTime.now());

            // Compute overall score average
            int totalScoreSum = 0;
            for (QuestionAnswer qa : allQA) {
                int qaAvg = (qa.getRelevanceScore() + qa.getClarityScore() + qa.getStructureScore()) / 3;
                totalScoreSum += qaAvg;
            }
            int overall = totalScoreSum / allQA.size();
            session.setOverallScore(overall);

            // Generate AI Strengths / Weaknesses / Summary
            Map<String, String> summary = aiService.generateSessionSummary(
                session.getRoleType(), 
                session.getExperienceLevel(), 
                allQA
            );
            session.setStrengths(summary.get("strengths"));
            session.setWeaknesses(summary.get("weaknesses"));
            session.setSuggestions(summary.get("suggestions"));

            sessionRepository.save(session);

            response.put("isFinished", true);
            response.put("sessionId", session.getId());
        } else {
            // 4. Generate next question
            String nextQuestionText = aiService.generateNextQuestion(
                session.getRoleType(),
                session.getExperienceLevel(),
                session.getResumeText(),
                allQA
            );

            QuestionAnswer nextQA = new QuestionAnswer();
            nextQA.setInterviewSession(session);
            nextQA.setQuestionText(nextQuestionText);
            nextQA.setSequenceNumber(currentQA.getSequenceNumber() + 1);
            questionAnswerRepository.save(nextQA);

            response.put("isFinished", false);
            response.put("nextQuestion", Map.of(
                "id", nextQA.getId(),
                "questionText", nextQA.getQuestionText(),
                "sequenceNumber", nextQA.getSequenceNumber()
            ));
        }

        return ResponseEntity.ok(response);
    }

    /**
     * Get the final feedback report.
     */
    @GetMapping("/{sessionId}/feedback")
    public ResponseEntity<Map<String, Object>> getFeedback(@PathVariable UUID sessionId) {
        Optional<InterviewSession> sessionOpt = sessionRepository.findById(sessionId);
        if (sessionOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        InterviewSession session = sessionOpt.get();

        Map<String, Object> response = new HashMap<>();
        response.put("sessionId", session.getId());
        response.put("roleType", session.getRoleType());
        response.put("experienceLevel", session.getExperienceLevel());
        response.put("status", session.getStatus());
        response.put("overallScore", session.getOverallScore());
        response.put("strengths", session.getStrengths());
        response.put("weaknesses", session.getWeaknesses());
        response.put("suggestions", session.getSuggestions());

        // Sort QA list by sequence number
        List<QuestionAnswer> list = new ArrayList<>(session.getQuestionsAnswers());
        list.sort(Comparator.comparingInt(QuestionAnswer::getSequenceNumber));
        response.put("questionsAnswers", list);

        return ResponseEntity.ok(response);
    }
}
