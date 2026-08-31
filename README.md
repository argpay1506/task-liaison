# Task-Liaison: AI-Orchestrated Command Center

**Task-Liaison** is a frontend-only React application built for the WebMCP Hackathon Challenge. It transforms an AI agent from a passive chatbot into an active operational partner that manages cloud infrastructure escalations directly on the UI canvas.

### 🚀 Live Demo
[Insert Your Vercel URL Here]

### 💡 The Problem
Managing severe cloud infrastructure escalations (like database CPU spikes or GKE node failures) is usually a chaotic mix of Slack negotiations, Jira routing, and manual UI clicks. 

### 🛠️ The WebMCP Solution
Using the `document.modelContext` API, Task-Liaison exposes strict, JSON-schema-validated React state mutations directly to the LLM's runtime environment. Instead of clicking through menus, infrastructure managers simply talk to the board. The AI interprets fuzzy natural language, extracts parameters, and triggers UI updates.

**Core Features:**
*   **The Priority Reward Exchange:** Tell the agent to calculate a bounty for a critical incident, and watch it dynamically move the ticket to a public market with a point reward.
*   **AI Ticket Negotiation:** Instruct the AI to swap a critical ticket for a low-priority one to prevent engineer burnout; the WebMCP tools handle the multi-variable state changes simultaneously.
*   **Blast Radius Mapping:** Ask the AI to map cascading failures, and it will dynamically render warning tags for downstream services onto the React ticket components.
*   **Human-in-the-Loop Remediation:** The AI stages mock Infrastructure-as-Code (IaC) patches (like Terraform node scaling) in a dark-mode terminal UI. The human manager retains absolute execution authority via physical click approvals.

### 💻 Tech Stack
*   **Framework:** Next.js / React
*   **Styling:** Tailwind CSS
*   **AI Integration:** WebMCP (`document.modelContext`)
*   **Deployment:** Vercel

### 🧪 How to Test
1. Open the [Live Vercel URL] inside a WebMCP-enabled wrapper (like the ChatGPT Desktop app).
2. Try this prompt: *"Analyze the blast radius for INC-102 and stage a mock Terraform script to increase the node pool minimum to 5 and maximum to 20."*
3. Watch the UI instantly render the cascading impact tags and the staged code block for your review.