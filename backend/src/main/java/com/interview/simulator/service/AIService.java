package com.interview.simulator.service;

import com.interview.simulator.entity.QuestionAnswer;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class AIService {

    @Value("${spring.ai.openai.api-key:mock-key-for-now}")
    private String apiKey;

    // We can interact with ChatModel if present, but define as optional so it doesn't crash on boot if configs are missing
    @Autowired(required = false)
    private org.springframework.ai.chat.model.ChatModel chatModel;

    /**
     * Generates the next question based on the role, difficulty, resume, and current conversation history.
     */
    public String generateNextQuestion(String role, String experience, String resumeText, List<QuestionAnswer> previousDialogues) {
        int nextSeq = previousDialogues.size() + 1;
        
        // If mock key or chatModel is absent, run in Mock mode
        if (isMockMode()) {
            return getMockQuestion(role, nextSeq);
        }

        try {
            StringBuilder promptBuilder = new StringBuilder();
            promptBuilder.append("You are an expert interviewer for the role: ").append(role)
                         .append(" at a ").append(experience).append(" level.\n");

            if (resumeText != null && !resumeText.trim().isEmpty()) {
                promptBuilder.append("The candidate has provided the following profile/resume details:\n")
                             .append(resumeText).append("\n")
                             .append("Tailor your questions to probe projects, tech stack, or skills listed in their resume where relevant.\n");
            }

            promptBuilder.append("Generate the next question. Question number: ").append(nextSeq).append(" out of 5.\n");

            if (previousDialogues.isEmpty()) {
                promptBuilder.append("This is the first question of the interview. Ask a relevant introductory question.");
            } else {
                promptBuilder.append("Here is the history of the conversation so far:\n");
                for (QuestionAnswer qa : previousDialogues) {
                    promptBuilder.append("Interviewer: ").append(qa.getQuestionText()).append("\n");
                    promptBuilder.append("Candidate: ").append(qa.getAnswerText()).append("\n");
                }
                promptBuilder.append("\nBased on the history, if the candidate's last answer was brief or incomplete, ask a follow-up question. Otherwise, transition to a new relevant interview topic.\n");
            }
            promptBuilder.append("Do not write any introductory or outro text (e.g., 'Sure, here is the next question:'). Output ONLY the question text.");

            return chatModel.call(promptBuilder.toString()).trim();
        } catch (Exception e) {
            System.err.println("Spring AI invocation failed, falling back to Mock Engine. Error: " + e.getMessage());
            return getMockQuestion(role, nextSeq);
        }
    }

    /**
     * Evaluates a single answer, returning scores and feedback.
     */
    public Map<String, Object> evaluateAnswer(String question, String answer) {
        if (isMockMode()) {
            return getMockEvaluation(question, answer);
        }

        try {
            String prompt = "You are an expert evaluator. Evaluate the candidate's response to the following interview question:\n" +
                    "Question: " + question + "\n" +
                    "Answer: " + answer + "\n\n" +
                    "Provide an evaluation in JSON format with precisely the following keys:\n" +
                    "- relevanceScore: integer (0 to 100)\n" +
                    "- clarityScore: integer (0 to 100)\n" +
                    "- structureScore: integer (0 to 100)\n" +
                    "- feedbackText: string containing detailed qualitative critique.\n" +
                    "Output ONLY valid JSON. Do not include markdown formatting like ```json ... ```";

            String jsonResponse = chatModel.call(prompt).trim();
            
            // Basic JSON cleaning if markdown tags were added
            if (jsonResponse.startsWith("```")) {
                jsonResponse = jsonResponse.replaceAll("^```json\\s*", "").replaceAll("```$", "").trim();
            }

            // Simple manual parser to avoid JSON library dependency issues
            return parseSimpleJson(jsonResponse);
        } catch (Exception e) {
            System.err.println("Spring AI evaluation failed, falling back to Mock Engine: " + e.getMessage());
            return getMockEvaluation(question, answer);
        }
    }

    /**
     * Generates a final summary report for the interview session.
     */
    public Map<String, String> generateSessionSummary(String role, String experience, List<QuestionAnswer> dialogues) {
        if (isMockMode()) {
            return getMockSummary(dialogues);
        }

        try {
            StringBuilder promptBuilder = new StringBuilder();
            promptBuilder.append("You are an expert HR coach. Analyze the following completed mock interview session for a ")
                         .append(experience).append(" ").append(role).append(":\n\n");

            for (QuestionAnswer qa : dialogues) {
                promptBuilder.append("Q: ").append(qa.getQuestionText()).append("\n");
                promptBuilder.append("A: ").append(qa.getAnswerText()).append("\n");
                promptBuilder.append("Scores - Relevance: ").append(qa.getRelevanceScore())
                             .append(", Clarity: ").append(qa.getClarityScore())
                             .append(", Structure: ").append(qa.getStructureScore()).append("\n\n");
            }

            promptBuilder.append("Provide a summary in JSON format with precisely the following keys:\n")
                         .append("- strengths: string summarizing key positive highlights\n")
                         .append("- weaknesses: string summarizing key areas that need improvement\n")
                         .append("- suggestions: string outlining actionable study tips or advice\n")
                         .append("Output ONLY valid JSON. Do not wrap in markdown tags.");

            String jsonResponse = chatModel.call(promptBuilder.toString()).trim();
            if (jsonResponse.startsWith("```")) {
                jsonResponse = jsonResponse.replaceAll("^```json\\s*", "").replaceAll("```$", "").trim();
            }

            Map<String, Object> parsed = parseSimpleJson(jsonResponse);
            Map<String, String> stringMap = new HashMap<>();
            stringMap.put("strengths", String.valueOf(parsed.getOrDefault("strengths", "Good responses overall.")));
            stringMap.put("weaknesses", String.valueOf(parsed.getOrDefault("weaknesses", "Could expand on technical details.")));
            stringMap.put("suggestions", String.valueOf(parsed.getOrDefault("suggestions", "Practice structuring answers with the STAR model.")));
            return stringMap;
        } catch (Exception e) {
            System.err.println("Spring AI summary failed, falling back to Mock Engine: " + e.getMessage());
            return getMockSummary(dialogues);
        }
    }

    /**
     * Generates a 1-sentence tip/hint on how to approach the question.
     */
    public String generateHint(String question) {
        if (isMockMode()) {
            return getMockHint(question);
        }

        try {
            String prompt = "You are a professional interview coach. Provide a concise, one-sentence suggestion/hint on what key skills or structural aspects the candidate should mention when answering the following question:\n" +
                    "Question: " + question + "\n" +
                    "Provide ONLY the one-sentence coaching tip. Do not use generic filler words.";
            return chatModel.call(prompt).trim();
        } catch (Exception e) {
            System.err.println("Spring AI hint failed, falling back to Mock Engine: " + e.getMessage());
            return getMockHint(question);
        }
    }

    private String getMockHint(String question) {
        String q = question.toLowerCase();
        if (q.contains("challenging technical project")) {
            return "Outline the tech stack briefly, focus on a concrete technical obstacle you overcame, and describe the quantitative impact.";
        } else if (q.contains("testing") || q.contains("debugging")) {
            return "Discuss different testing scopes (unit, integration, E2E) and list specific tools (JUnit, Jest, debugger logs) you use.";
        } else if (q.contains("sql") || q.contains("nosql")) {
            return "Focus on architectural trade-offs: structured schemas & ACID transactions (SQL) vs scalability & flexible document models (NoSQL).";
        } else if (q.contains("disagreement")) {
            return "Emphasize active listening, referencing data or benchmark metrics to make decisions objectively, and supporting a mutual target.";
        } else if (q.contains("updated")) {
            return "Name specific technical newsletters (e.g., InfoQ, Hacker News), tech podcasts, or active open-source repositories you track.";
        } else if (q.contains("prioritize")) {
            return "Reference a structured prioritization model like RICE (Reach, Impact, Confidence, Effort) or MoSCoW to show objective logic.";
        } else if (q.contains("define and measure success")) {
            return "Focus on user engagement metrics (daily active users, retention) and business outcomes rather than code commits or speed.";
        } else if (q.contains("poorly designed")) {
            return "Describe a real friction point in a product, offer a clear engineering or UX improvement, and explain why it solves the problem.";
        } else if (q.contains("conflicting feedback")) {
            return "Explain how you group feedback, map it against company strategy/KPIs, and build buy-in across engineering and business leaders.";
        } else if (q.contains("without sufficient data")) {
            return "Talk about how you gathered qualitative insights, ran a quick prototype or A/B experiment, and monitored telemetry post-launch.";
        }
        return "Apply the STAR technique: start with a quick context, outline the challenge, list your actions, and highlight the results.";
    }

    private boolean isMockMode() {
        return chatModel == null || apiKey == null || apiKey.equals("mock-key-for-now") || apiKey.trim().isEmpty();
    }

    // --- MOCK IMPLEMENTATIONS ---

    private String getMockQuestion(String role, int sequence) {
        String cleanRole = role.toLowerCase();
        if (cleanRole.contains("developer") || cleanRole.contains("engineer") || cleanRole.contains("coder") || cleanRole.contains("tech")) {
            switch (sequence) {
                case 1: return "Can you tell me about a challenging technical project you worked on recently and what your role was?";
                case 2: return "How do you handle testing and debugging in your code to ensure quality?";
                case 3: return "Explain the difference between a SQL and NoSQL database and when you would choose one over the other.";
                case 4: return "Describe a time when you had a disagreement with a team member about a technical decision. How did you resolve it?";
                case 5: return "How do you stay updated with the latest trends and technologies in software development?";
                default: return "What are your core engineering principles?";
            }
        } else if (cleanRole.contains("product") || cleanRole.contains("pm") || cleanRole.contains("manager")) {
            switch (sequence) {
                case 1: return "Can you describe a time when you had to prioritize features with limited resources?";
                case 2: return "How do you define and measure success for a new product feature?";
                case 3: return "Tell me about a product you use daily that is poorly designed. What would you change?";
                case 4: return "How do you handle conflicting feedback from users and internal stakeholders?";
                case 5: return "Describe a time when you had to make a product decision without sufficient data.";
                default: return "How do you align design and engineering targets?";
            }
        } else {
            switch (sequence) {
                case 1: return "Tell me about yourself and why you are interested in this position.";
                case 2: return "What is your greatest professional accomplishment and how did you achieve it?";
                case 3: return "Describe a time when you had to work under a tight deadline. How did you manage?";
                case 4: return "How do you handle constructive feedback or criticism from a supervisor?";
                case 5: return "Where do you see yourself in five years and how does this role fit into that vision?";
                default: return "What qualities make a great team member?";
            }
        }
    }

    private Map<String, Object> getMockEvaluation(String question, String answer) {
        Map<String, Object> result = new HashMap<>();
        int len = (answer != null) ? answer.trim().length() : 0;
        
        int relevance = Math.min(65 + (len / 15), 95);
        int clarity = Math.min(70 + (len / 20), 92);
        int structure = Math.min(60 + (len / 12), 94);

        if (len < 20) {
            relevance = 40;
            clarity = 50;
            structure = 35;
        }

        result.put("relevanceScore", relevance);
        result.put("clarityScore", clarity);
        result.put("structureScore", structure);

        String feedback;
        if (len < 20) {
            feedback = "The response was extremely brief. In an interview setting, expand on your answers with details and context.";
        } else if (answer.toLowerCase().contains("star") || answer.toLowerCase().contains("situation") || answer.toLowerCase().contains("result")) {
            feedback = "Excellent response structure! Incorporating the STAR framework helps separate the context, your task, actions, and results clearly.";
        } else {
            feedback = "Good, relevant answer. To make it even stronger, focus on adding quantitative results (numbers or percentages) to demonstrate the impact of your actions.";
        }
        result.put("feedbackText", feedback);
        return result;
    }

    private Map<String, String> getMockSummary(List<QuestionAnswer> dialogues) {
        Map<String, String> result = new HashMap<>();
        
        int avgScore = 0;
        if (!dialogues.isEmpty()) {
            int total = 0;
            for (QuestionAnswer qa : dialogues) {
                total += (qa.getRelevanceScore() + qa.getClarityScore() + qa.getStructureScore()) / 3;
            }
            avgScore = total / dialogues.size();
        }

        if (avgScore > 80) {
            result.put("strengths", "You structure your thoughts logically and explain complex topics with high verbal clarity. You display strong domain knowledge.");
            result.put("weaknesses", "Occasionally missed detailing the exact scale or specific quantitative performance metrics of the project outcomes.");
            result.put("suggestions", "Focus on articulating project metrics (e.g., 'reduced latency by 15%', 'increased clickthrough by 4%') to ground your claims.");
        } else if (avgScore > 60) {
            result.put("strengths", "You provide helpful context and answer the questions directly, demonstrating appropriate technical understanding.");
            result.put("weaknesses", "Responses can sometimes become conversational or unstructured. Some technical explanations lacked depth.");
            result.put("suggestions", "Use the STAR method actively (Situation, Task, Action, Result). Pause for 3 seconds before answering to map out your bullet points.");
        } else {
            result.put("strengths", "Basic concepts were addressed, and you attempted to speak directly to all questions.");
            result.put("weaknesses", "Answers were too brief or lacked concrete examples from past experiences. Communication clarity needs polish.");
            result.put("suggestions", "Prepare 3-4 detailed project scenarios beforehand. Practice speaking out loud to refine flow, pacing, and vocabulary.");
        }

        return result;
    }

    private Map<String, Object> parseSimpleJson(String jsonStr) {
        Map<String, Object> map = new HashMap<>();
        try {
            // Strip external curly brackets
            String clean = jsonStr.trim();
            if (clean.startsWith("{")) clean = clean.substring(1);
            if (clean.endsWith("}")) clean = clean.substring(0, clean.length() - 1);

            // Basic regex-free parsing for robust simple JSON
            String[] pairs = clean.split(",(?=(?:[^\"]*\"[^\"]*\")*[^\"]*$)");
            for (String pair : pairs) {
                String[] keyValue = pair.split(":(?=(?:[^\"]*\"[^\"]*\")*[^\"]*$)");
                if (keyValue.length == 2) {
                    String key = keyValue[0].replace("\"", "").trim();
                    String value = keyValue[1].trim();
                    if (value.startsWith("\"") && value.endsWith("\"")) {
                        map.put(key, value.substring(1, value.length() - 1));
                    } else {
                        try {
                            map.put(key, Integer.parseInt(value));
                        } catch (NumberFormatException nfe) {
                            map.put(key, value);
                        }
                    }
                }
            }
        } catch (Exception e) {
            System.err.println("Simple JSON parse failed: " + e.getMessage());
            // Put safe defaults
            map.put("relevanceScore", 75);
            map.put("clarityScore", 75);
            map.put("structureScore", 75);
            map.put("feedbackText", "Good response. Try to structure with more details.");
        }
        return map;
    }
}
