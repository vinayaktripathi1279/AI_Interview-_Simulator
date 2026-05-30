# AI Interview Simulator - Platform MVP

An advanced, AI-powered mock interview preparation platform designed to help job seekers practice realistic technical and behavioral interviews. The system conducts turn-by-turn simulations, evaluates responses dynamically, supports natural voice input, provides real-time coaching, and graphs progression scores over time.

---

## 🛠️ Architecture & Tech Stack

The platform is built using a decoupled, modern multi-module architecture:

```
┌────────────────────────────────────────────────────────┐
│                      Client Browser                    │
│                 React SPA (localhost:3000)             │
└──────────────────────────┬─────────────────────────────┘
                           │ (API requests proxied)
                           ▼
┌────────────────────────────────────────────────────────┐
│                   Spring Boot API Backend              │
│                 Java 17+ (localhost:8080)              │
├──────────────────────────┬─────────────────────────────┤
│                          │                             │
│   (JPA / Hibernate)      ▼ (Spring AI Client)          ▼ (Outbound Diagnostic)
│ ┌──────────────────┐   ┌──────────────────┐          ┌──────────────────┐
│ │   H2 In-Memory   │   │ OpenAI API /     │          │  Outbound        │
│ │   Database       │   │ Gemini Models    │          │  Diagnostics     │
│ └──────────────────┘   └──────────────────┘          └──────────────────┘
└────────────────────────────────────────────────────────┘
```

*   **Frontend:** React (Vite, Axios, Lucide Icons, Recharts SVG diagrams, CSS Modules).
*   **Backend:** Java 17+, Spring Boot 3.x (Spring Web, Spring Security, Spring Data JPA, Spring AI).
*   **Database:** H2 Database (In-Memory fallback with H2 Console enabled at `/api/h2-console` for zero-install configuration).
*   **AI Models:** OpenAI API (`gpt-4o-mini`) via Spring AI with a robust simulated failover engine.

---

## 🚀 Key Features Built

1.  **System Diagnostic Latency Prober:**
    Exposes outbound latency connectivity tests to OpenAI, Gemini, and Google API servers, reporting overall connection metrics (`EXCELLENT`, `GOOD`, `DEGRADED`, or `OFFLINE`).
2.  **Contextual Resume Upload:**
    Candidates can optionally paste their resume text during configuration. The AI automatically adapts questioning to target their specific projects, skills, and background.
3.  **Conversational Chat Simulator:**
    A turn-by-turn interactive chat widget displaying AI interviewer questions, user response areas, progress indicators, and active submission blocks.
4.  **Speech-to-Text (STT Voice Mode):**
    Integrated browser-native Web Speech API enabling candidates to verbally speak their answers rather than typing.
5.  **Coaching Hints & STAR Guide:**
    Includes a slide-out STAR framework template panel alongside a **Get AI Hint** prober generating immediate coaching tips.
6.  **Granular AI Performance Report:**
    Evaluates submissions across Relevance, Clarity, and Structure metrics. Scores are visualized dynamically using interactive **Recharts Bar Graphs**.
7.  **History & Analytics Dashboard:**
    Tracks completed sessions and graphs average score progression curves using **Recharts LineCharts**.

---

## 💻 How to Run Locally

### 1. Run the Backend (Spring Boot)

#### Prerequisites:
*   Java JDK 17 or higher.

#### Running from your IDE:
1. Open the project folder in **IntelliJ IDEA** or **VS Code**.
2. Run the main method inside `backend/src/main/java/com/interview/simulator/SimulatorApplication.java`.

#### Running from Terminal:
```bash
cd backend
./mvnw spring-boot:run
```
The API server will launch at **`http://localhost:8080/api`**.

*(Note: Database tables are auto-generated on startup in H2. Access H2 Console at `http://localhost:8080/api/h2-console` with JDBC URL: `jdbc:h2:mem:ai_simulator` and username: `sa`)*

---

### 2. Run the Frontend (React)

#### Prerequisites:
*   Node.js (v18+ recommended) and npm.

#### Installation & Launch:
Navigate to the `frontend` directory, install packages, and run the developer dev-server:
```powershell
cd frontend
npm install
npm run dev
```
*(On Windows PowerShell, use `npm.cmd install` and `npm.cmd run dev` if execution policies restrict standard script triggers).*

The client browser app will open at **`http://localhost:3000`**.

---

## 📡 REST API Schema Reference

*   `GET /api/health` - Probes backend server and tests API connection latencies.
*   `POST /api/interviews` - Initializes a mock session (Accepts `roleType`, `experienceLevel`, and optional `resumeText`).
*   `POST /api/interviews/{sessionId}/answers` - Submits an answer, triggers AI evaluation, and returns the next question or completes the session.
*   `GET /api/interviews/{sessionId}/feedback` - Fetches overall scoring aggregates, strengths, weaknesses, and detailed Q&A feedback lists.
*   `GET /api/interviews` - Lists all completed mock interviews for dashboard reporting.
*   `GET /api/interviews/{sessionId}/questions/{questionId}/hint` - Generates a targeted coaching tip.
