# LexiSimplify: AI-Agentic German Law Simplifier

[![Kaggle + Google Capstone](https://img.shields.io/badge/Kaggle%20%2B%20Google-AI%20Agents%20Capstone-blue.svg)](https://ai.studio/build)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Built with Gemini](https://img.shields.io/badge/Model-Gemini%203.5%20Flash-indigo.svg)](https://ai.google.dev/)

LexiSimplify is a professional Legal-Tech web application developed for the **Kaggle + Google 5-Day AI Agents: Intensive Vibe Coding Capstone Project**. 

The application demonstrates **Agentic AI Engineering** by utilizing a collaborative, multi-stage workflow where four specialized AI agents analyze, simplify, translate, plan, and verify complex German legal documents (such as rental agreements, government notices, or tax letters) into clear, safe, plain language.

---

## 📖 Table of Contents
1. [Problem Statement](#-problem-statement)
2. [Multi-Agent Architecture](#-multi-agent-architecture)
3. [Why This Is Agentic](#-why-this-is-agentic)
4. [AI Workflow Diagram](#-ai-workflow-diagram)
5. [Safety & Guardrails](#-safety--guardrails)
6. [Technology Stack](#-technology-stack)
7. [Installation & Setup](#-installation--setup)
8. [Future Improvements](#-future-improvements)
9. [Disclaimer](#-disclaimer)

---

## ⚠️ Disclaimer
> **This application explains legal documents for educational purposes only. It does not provide legal advice and does not replace a lawyer, official authority, or qualified legal professional.**

---

## 🚨 Problem Statement
Living and working in Germany involves navigating highly structured official and legal documentation written in a specialized, complex dialect of administrative German colloquially known as **"Amtsdeutsch"** or **"Juristendeutsch"**. 

For expats, non-native speakers, and even many native citizens, understanding rental increases, tax assessments, employment clauses, or immigration warnings can be stressful. Misunderstanding these documents can lead to missed deadlines, loss of legal claims, or unintended financial penalties.

**LexiSimplify** solves this problem by using a sequential multi-agent orchestration pipeline to break down and demystify complex legal texts safely, preserving structural facts and values without ever providing unauthorized legal advice.

---

## 🤝 Multi-Agent Architecture
Rather than relying on a single, monolithic chatbot prompt, LexiSimplify splits duties across a cooperative team of **four distinct agents**:

| Agent | Name | Primary Responsibility | Target Output |
|---|---|---|---|
| **Agent 1** | **Document Analyzer** | Structural decomposition & objective parameter extraction. | Identifies sender, recipient, document type, dates, deadlines, and paragraph citations (§). |
| **Agent 2** | **Legal Simplifier** | Jargon-to-plain-language mapping & English summarization. | Rewrites text into simple German (A2, B1, or B2 levels) and provides an English context overview. |
| **Agent 3** | **Action Planner** | Operational guide & safe action checklist construction. | Identifies obligations, rights, and checklists with non-committal guidance. |
| **Agent 4** | **Safety & Verification** | Quality assurance & LLM-as-a-judge validation audit. | Evaluates meaning preservation, scans for hallucinations, checks disclaimers, and calculates a confidence score. |

---

## 🤖 Why This Is Agentic
Traditional LLM integrations function as passive conversational interfaces (i.e. simple single-prompt chatbots). LexiSimplify implements a structured **Agentic Workflow** inspired by Google's state-of-the-art AI Agents course:

* **Separation of Concerns:** Each agent has a custom system prompt, specialized JSON response schema, and specific behavioral goals.
* **Sequential Hand-off:** The output of Agent 1 is passed to Agent 2, which then forwards the cumulative knowledge to Agent 3, culminating in a final review by Agent 4.
* **Self-Evaluation & Reflection (LLM-as-a-judge):** Agent 4 serves as an automated quality inspector. It compares the simplified drafts against the original source document, auditing the accuracy of financial figures, ensuring no legal assertions are made, and outputting an objective **Confidence Score** and **Evaluation Audit Log**.
* **Safety Integration:** Cautious language boundaries are enforced at the agent system-instruction level rather than via client-side filters.

---

## 📊 AI Workflow Diagram

```
User Input (Paste Text / PDF)
  │
  ▼
[Ingestion Engine] ──► Extracts text content
  │
  ▼
[Agent 1: Document Analyzer] ──► Extracts sender, recipient, laws, deadlines
  │
  ▼
[Agent 2: Legal Simplifier] ──► Drafts Simple German & English Summaries
  │
  ▼
[Agent 3: Action Planner] ──► Identifies duties/rights & drafts next steps
  │
  ▼
[Agent 4: Safety & Verification] ──► Validates draft against source, rates confidence (0-100)
  │
  ▼
Rendered Output Dashboard (8-Card Layout + Copy/Download)
```

---

## 🛡️ Safety & Guardrails
To adhere to legal services acts (such as Germany's *Rechtsdienstleistungsgesetz*), LexiSimplify enforces strict safety guidelines:
1. **No Legal Advice:** The system never issues direct legal instructions. Suggestions are meticulously framed as alternatives (e.g. *"The document appears to request..."*, *"You may wish to..."*).
2. **Strict Citation Rules:** The model is forbidden from fabricating legal paragraphs, codes, or court numbers.
3. **Explicit Counsel Recommendation:** Every checklist encourages contacting local tenant associations (*Mieterverein*), consumer rights centers (*Verbraucherzentrale*), or licensed attorneys.

---

## 💻 Technology Stack
* **Frontend:** React 19, Tailwind CSS v4, Lucide Icons, HTML5 file API
* **Backend:** Node.js Express server with type safety via TypeScript
* **Compiler/Bundler:** Vite 6, tsx (runtime), esbuild (for container deployment)
* **AI Integration:** Google Gen AI SDK (`@google/genai`)
* **AI Model:** `gemini-3.5-flash`

---

## 🚀 Installation & Setup

### Prerequisites
* [Node.js](https://nodejs.org/) (v18+ recommended)
* A [Google AI Studio Gemini API Key](https://aistudio.google.com/)

### Step-by-Step Installation
1. **Clone the repository:**
   ```bash
   git/clone <your-repo-link> lexisimplify
   cd lexisimplify
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env` file in the root directory and add your Gemini API Key:
   ```env
   GEMINI_API_KEY="your_actual_gemini_api_key"
   APP_URL="http://localhost:3000"
   ```

4. **Run in Development Mode:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

5. **Build and Deploy for Production:**
   ```bash
   npm run build
   npm start
   ```

---

## 🔮 Future Improvements
* **OCR Support:** Add automatic optical character recognition (OCR) for scanned PDFs and smartphone photos of letters.
* **Comprehensive RAG:** Integrate Retrieval-Augmented Generation (RAG) with official German legal databases (e.g., *gesetze-im-internet.de*) to fetch complete statutory texts.
* **Multi-Language Explanations:** Expand the Output language to include Spanish, Arabic, Turkish, Ukrainian, and more.
* **User Accounts & History:** Safe cloud storage (via Firebase Firestore) allowing users to track active letters and ongoing deadlines.

---

## 📄 License
Distributed under the MIT License. See `LICENSE` for more information.
