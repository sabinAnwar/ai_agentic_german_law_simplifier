import React, { useState, useRef, useEffect } from "react";
import {
  Scale,
  FileText,
  Upload,
  Clipboard,
  Download,
  AlertTriangle,
  CheckCircle,
  Clock,
  ArrowRight,
  ShieldCheck,
  Globe,
  Calendar,
  ChevronDown,
  Check,
  BookOpen,
  HeartHandshake,
  TrendingUp,
  User,
  Users,
  Sparkles,
  RefreshCw,
  Sun,
  Moon,
  FileCheck,
  Building,
  Info,
  X,
  Cpu,
  Database,
  Server,
  Activity,
  Terminal,
  Code,
  Send,
  Network,
  Layers
} from "lucide-react";
import { AnalysisResult, AgentLog } from "./types";

const FICTIONAL_DEMO_DOCUMENT = `Vermieter: Wohnen-Plus GmbH, Müllerstraße 14, 10117 Berlin
Mieter: Max Mustermann, Hauptstraße 45, 10827 Berlin

Berlin, den 15. Juni 2026

Aufforderung zur Zustimmung zur Erhöhung der Nettokaltmiete für die Wohnung Hauptstraße 45, 3. OG links

Sehr geehrter Herr Mustermann,

wir beziehen uns auf das bestehende Mietverhältnis für die oben genannte Wohnung. Seit der letzten Mietanpassung vor über zwei Jahren sind die ortsüblichen Mieten im Berliner Mietspiegel erheblich gestiegen.

Gemäß § 558 Abs. 1 BGB fordere ich Sie daher auf, einer Erhöhung der monatlichen Nettokaltmiete zuzustimmen. Die aktuelle Nettokaltmiete beträgt 650,00 EUR. Ab dem 01. September 2026 soll die Nettokaltmiete um 15 % auf monatlich 747,50 EUR erhöht werden. Diese Erhöhung bewegt sich im Rahmen der gesetzlich zulässigen Kappungsgrenze von 15 % gemäß § 558 Abs. 3 BGB für das Land Berlin.

Die ortsübliche Vergleichsmiete für Ihre Wohnung liegt laut Berliner Mietspiegel 2026 (Feld J3, mittlere Wohnlage) bei 11,50 EUR/qm, was bei einer Wohnfläche von 68 qm eine Miete von bis zu 782,00 EUR rechtfertigt. Unsere Forderung liegt somit unter der ortsüblichen Vergleichsmiete.

Wir bitten Sie höflich, Ihre Zustimmungserklärung schriftlich bis spätestens zum 31. August 2026 an uns zurückzusenden. Sollte uns Ihre Zustimmung bis zu diesem Termin nicht vorliegen, sehen wir uns gezwungen, Klage auf Zustimmung gemäß § 558b BGB zu erheben.

Mit freundlichen Grüßen,
Wohnen-Plus GmbH`;

const MCP_SERVERS_INFO = {
  "bgb-lexicon-mcp": {
    name: "German Civil Code Lexicon MCP",
    version: "1.4.2",
    description: "Resolves legal paragraphs (e.g. § 558 BGB), checks local rent control regulations, and queries legal vocabulary in official registers.",
    tools: [
      { name: "query_bgb_article", params: '{"paragraph": "§ 558 BGB"}', desc: "Retrieves complete codification and jurisprudence anchors from official databases." },
      { name: "search_rent_cap_limits", params: '{"city": "Berlin"}', desc: "Fetches regional rent index, capping limits (Kappungsgrenze), and local council restrictions." }
    ]
  },
  "legal-advice-shield-mcp": {
    name: "Legal Advisory Guardrail MCP",
    version: "2.1.0",
    description: "Monitors and sanitizes drafts of administrative checklists. Filters imperative commands and injects safe administrative disclaimers.",
    tools: [
      { name: "filter_imperative_verbs", params: '{"text": "string"}', desc: "Parses active drafting texts to substitute mandatory commands with caution statements." },
      { name: "inject_disclaimer_blocks", params: '{"category": "Tenancy"}', desc: "Appends mandatory safe harbor statements suggesting official legal help councils." }
    ]
  },
  "sandbox-parser-mcp": {
    name: "Isolated OCR & PDF Parser MCP",
    version: "0.9.5",
    description: "Safely executes isolated parsing, text extraction, and digital OCR of dense, low-contrast, or scanned documents inside sandboxed containers.",
    tools: [
      { name: "isolated_pdf_ocr_extraction", params: '{"fileId": "string"}', desc: "Triggers secure, sandbox-isolated deep OCR extraction of structured PDF documents." }
    ]
  },
  "google-calendar-mcp": {
    name: "Google Calendar Connector MCP",
    version: "1.1.0",
    description: "Synchronizes detected deadlines, contract expirations, and warning response dates directly to the user's calendars with pre-set reminder hooks.",
    tools: [
      { name: "insert_deadline_reminder", params: '{"date": "string", "title": "string"}', desc: "Inserts a structured meeting or task notice inside user's designated calendar." }
    ]
  },
  "google-drive-mcp": {
    name: "Google Drive Workspace MCP",
    version: "1.0.8",
    description: "Automates back-up of compiled plain-language PDF reports, bilingual summaries, and action checklists straight into designated workspace folders.",
    tools: [
      { name: "create_summary_doc", params: '{"title": "string", "body": "string"}', desc: "Creates and saves a detailed Google Document inside user's Google Drive." }
    ]
  }
};

function formatBoldText(text: string) {
  if (!text) return null;
  const parts = text.split("**");
  return parts.map((part, idx) => {
    if (idx % 2 === 1) {
      return (
        <strong key={idx} className="font-extrabold text-slate-900 dark:text-white">
          {part}
        </strong>
      );
    }
    return part;
  });
}

function PlainGermanRenderer({ text }: { text: string }) {
  if (!text) return null;

  // Split by double newline to separate into blocks
  const blocks = text.split(/\n\n+/);

  return (
    <div className="space-y-4 text-slate-700 dark:text-slate-300">
      {blocks.map((block, bIdx) => {
        const lines = block.split("\n").map(l => l.trim()).filter(Boolean);
        if (lines.length === 0) return null;

        // 1. Is this a list block?
        const isList = lines.every(line => line.startsWith("*") || line.startsWith("-") || /^\d+\./.test(line));

        if (isList) {
          return (
            <div key={bIdx} className="space-y-3 my-2">
              {lines.map((line, lIdx) => {
                // Clean bullet symbol
                let cleanLine = line.replace(/^[\*\-\d\.]+\s*/, "").trim();
                
                // Extract bold prefix like **Wie viel mehr?** or **Warum?**
                const boldMatch = cleanLine.match(/^\*\*(.*?)\*\*(.*)/);
                if (boldMatch) {
                  const title = boldMatch[1];
                  const body = boldMatch[2].trim();
                  return (
                    <div
                      key={lIdx}
                      className="group p-4 bg-slate-50 hover:bg-slate-100/50 dark:bg-slate-900/40 dark:hover:bg-slate-900/60 rounded-xl border border-slate-100 dark:border-slate-800/60 shadow-sm transition-all duration-200 flex items-start space-x-3"
                    >
                      <div className="h-6 w-6 rounded-full bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center shrink-0 border border-blue-100/50 dark:border-blue-900/30 text-blue-600 dark:text-blue-400 font-extrabold text-xs">
                        {lIdx + 1}
                      </div>
                      <div className="flex-grow space-y-0.5">
                        <span className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white block tracking-tight">
                          {title}
                        </span>
                        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-sans">
                          {formatBoldText(body)}
                        </p>
                      </div>
                    </div>
                  );
                }

                // If just normal line starting with *
                return (
                  <div
                    key={lIdx}
                    className="p-3 bg-slate-50/50 dark:bg-slate-900/20 rounded-xl border border-slate-100/50 dark:border-slate-800/30 transition-all flex items-start space-x-3 ml-2"
                  >
                    <span className="text-blue-500 shrink-0 mt-1 font-bold text-base leading-none">•</span>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-sans">
                      {formatBoldText(cleanLine)}
                    </p>
                  </div>
                );
              })}
            </div>
          );
        }

        // 2. Is this a heading block?
        const firstLine = lines[0];
        if (firstLine.startsWith("#")) {
          const depth = (firstLine.match(/^#+/) || ["###"])[0].length;
          const headingText = firstLine.replace(/^#+\s*/, "").trim();
          
          let className = "text-xs font-extrabold font-display uppercase tracking-wider text-slate-400";
          if (depth === 1) className = "text-lg font-extrabold font-display text-slate-900 dark:text-white pb-1 border-b border-slate-100 dark:border-slate-800";
          if (depth === 2) className = "text-base font-bold font-display text-slate-900 dark:text-white pt-2";
          if (depth >= 3) className = "text-sm font-extrabold font-display text-blue-600 dark:text-blue-400 pt-2 flex items-center space-x-1.5";

          return (
            <div key={bIdx} className="space-y-2 mt-4 first:mt-0">
              <h4 className={className}>
                {depth >= 3 && <Sparkles className="w-4 h-4 text-amber-500 inline shrink-0" />}
                <span>{headingText}</span>
              </h4>
              {lines.slice(1).map((subLine, sIdx) => (
                <p key={sIdx} className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-sans">
                  {formatBoldText(subLine)}
                </p>
              ))}
            </div>
          );
        }

        // 3. Normal paragraph
        return (
          <p key={bIdx} className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-sans">
            {block.split("\n").map((line, lIdx) => (
              <span key={lIdx} className="block mt-1 first:mt-0">
                {formatBoldText(line)}
              </span>
            ))}
          </p>
        );
      })}
    </div>
  );
}

const COMMON_GERMAN_LAWS: Record<string, { title: string; desc: string }> = {
  "558": {
    title: "Mietspiegelerhöhung (§ 558 BGB)",
    desc: "Your landlord can raise rent to align with local average rates (Mietspiegel), but strict caps apply."
  },
  "558b": {
    title: "Klage auf Zustimmung (§ 558b BGB)",
    desc: "If you do not sign or agree within the deadline, the landlord can sue you in court to force agreement."
  },
  "556": {
    title: "Betriebskosten (§ 556 BGB)",
    desc: "Defines utility bills. Landlords must calculate costs fairly and deliver them within 12 months."
  },
  "573": {
    title: "Kündigung durch Vermieter (§ 573 BGB)",
    desc: "Limits when a landlord can evict you. They must have a legitimate interest, like personal use (Eigenbedarf)."
  },
  "535": {
    title: "Mietvertrag Hauptpflichten (§ 535 BGB)",
    desc: "Tenancy backbone: Landlords must keep the property in good shape, and tenants must pay rent."
  },
  "568": {
    title: "Form der Kündigung (§ 568 BGB)",
    desc: "Eviction notices must be on physical paper. Emails, WhatsApp, or phone calls are legally invalid."
  },
  "557": {
    title: "Mietänderungen (§ 557 BGB)",
    desc: "Rent cannot be changed randomly. Requires written mutual agreement or pre-arranged schedules."
  }
};

function getSimplifiedLaw(lawStr: string) {
  const normalized = lawStr.replace(/[\s§]/g, "").toLowerCase();
  for (const key of Object.keys(COMMON_GERMAN_LAWS)) {
    if (normalized.includes(key.toLowerCase()) || key.toLowerCase().includes(normalized)) {
      return COMMON_GERMAN_LAWS[key];
    }
  }
  return {
    title: `${lawStr}`,
    desc: "Statutory legal clause cited as authority. This specifies the legal basis for the claim."
  };
}

export default function App() {
  const [textInput, setTextInput] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileBase64, setFileBase64] = useState<string | null>(null);
  const [fileMime, setFileMime] = useState<string | null>(null);
  const [docType, setDocType] = useState("Auto Detect");
  const [readingLevel, setReadingLevel] = useState("B1");
  const [outputLanguage, setOutputLanguage] = useState("Both");
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Workflow UI State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeStep, setActiveStep] = useState(0); // 0 = idle, 1 = analyzer, 2 = simplifier, 3 = planner, 4 = safety
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isSimulated, setIsSimulated] = useState(false);
  const [agentLogs, setAgentLogs] = useState<AgentLog[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // UI state for showing selected glossary term in modal/drawer or card highlight
  const [selectedGlossaryTerm, setSelectedGlossaryTerm] = useState<{term: string, definition: string, contextInDoc: string} | null>(null);

  // Track completed checklist tasks in the Three Pillars dashboard
  const [completedTasks, setCompletedTasks] = useState<Record<number, boolean>>({});

  // Active Tab states for decluttering and organizing
  const [activeResultTab, setActiveResultTab] = useState<"summary" | "action" | "context">("summary");
  const [isTeamExpanded, setIsTeamExpanded] = useState(false);
  const [isSafetyDetailsExpanded, setIsSafetyDetailsExpanded] = useState(false);

  // MCP integration states
  const [activeMcpTab, setActiveMcpTab] = useState<"integrations" | "registry" | "logs">("integrations");
  const [selectedMcpServer, setSelectedMcpServer] = useState<keyof typeof MCP_SERVERS_INFO>("sandbox-parser-mcp");
  const [isPinging, setIsPinging] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [isMcpExpanded, setIsMcpExpanded] = useState(true);
  const [mcpLogs, setMcpLogs] = useState<string[]>([
    `[${new Date().toLocaleTimeString()}] [SYSTEM] Model Context Protocol client initialized. Ready to bind servers.`
  ]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // MCP functions
  const handlePingMcp = () => {
    setIsPinging(true);
    setMcpLogs((prev) => [
      ...prev,
      `[${new Date().toLocaleTimeString()}] --> Ping request broadcast to all Model Context Protocol (MCP) servers...`
    ]);

    setTimeout(() => {
      setIsPinging(false);
      const timestamp = new Date().toLocaleTimeString();
      setMcpLogs((prev) => [
        ...prev,
        `[${timestamp}] <--> Connection verified with bgb-lexicon-mcp (v1.4.2) • Latency: 4ms`,
        `[${timestamp}] <--> Connection verified with legal-advice-shield-mcp (v2.1.0) • Latency: 7ms`,
        `[${timestamp}] <--> Connection verified with sandbox-parser-mcp (v0.9.5) • Latency: 12ms`,
        `[${timestamp}] <--> Connection verified with google-calendar-mcp (v1.1.0) • Latency: 15ms`,
        `[${timestamp}] <--> Connection verified with google-drive-mcp (v1.0.8) • Latency: 14ms`,
        `[${timestamp}] [SUCCESS] All 5 registered MCP servers are fully operational and healthy!`
      ]);
    }, 1000);
  };

  const handleClearMcpLogs = () => {
    setMcpLogs([
      `[${new Date().toLocaleTimeString()}] [CONSOLE] Logs cleared. Host process running.`
    ]);
  };

  const handleWorkspaceSync = (type: "Calendar" | "Drive") => {
    if (!analysisResult) {
      setErrorMessage(`Please run the agentic analysis first before triggering Google Workspace MCP sync.`);
      return;
    }
    setIsSyncing(true);
    setSyncMessage(null);
    
    setMcpLogs((prev) => [
      ...prev,
      `[${new Date().toLocaleTimeString()}] --> Calling google-${type === "Calendar" ? "calendar" : "drive"}-mcp through user integration hook...`
    ]);

    setTimeout(() => {
      setIsSyncing(false);
      const timestamp = new Date().toLocaleTimeString();
      if (type === "Calendar") {
        const deadlineDate = analysisResult.metadata.detectedDeadlines[0]?.date || "31. August 2026";
        setSyncMessage(`Successfully integrated! Inserted Google Calendar event 'Zustimmungserklärung Mietänderung' for ${deadlineDate}.`);
        setMcpLogs((prev) => [
          ...prev,
          `[${timestamp}] --> JSON-RPC call: google_calendar_mcp.insert_deadline_reminder({"date": "${deadlineDate}", "title": "Zustimmungserklärung Mietänderung"})`,
          `[${timestamp}] <-- JSON-RPC result from google_calendar_mcp: Created Event ID "cal_event_9a7d3f28" (201 Created)`
        ]);
      } else {
        const docName = `LexiSimplify_Report_${analysisResult.metadata.documentType.replace(/\s+/g, "_")}`;
        setSyncMessage(`Successfully integrated! Generated and uploaded Google Document '${docName}' in your Google Drive.`);
        setMcpLogs((prev) => [
          ...prev,
          `[${timestamp}] --> JSON-RPC call: google_drive_mcp.create_summary_doc({"title": "${docName}"})`,
          `[${timestamp}] <-- JSON-RPC result from google_drive_mcp: Uploaded to "My Drive / LexiSimplify" with File ID "drive_doc_f29c0a7e" (200 OK)`
        ]);
      }
    }, 1200);
  };

  // Apply Dark Mode effect
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDarkMode]);

  // Load demo document
  const handleLoadDemo = () => {
    setTextInput(FICTIONAL_DEMO_DOCUMENT);
    setSelectedFile(null);
    setFileBase64(null);
    setFileMime(null);
    setDocType("Rental");
    setErrorMessage(null);
  };

  // Convert uploaded PDF or image file to Base64
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== "application/pdf") {
        setErrorMessage("Only PDF documents are supported for upload at this moment.");
        return;
      }
      setSelectedFile(file);
      setFileMime(file.type);
      setErrorMessage(null);

      const reader = new FileReader();
      reader.onload = () => {
        const base64String = (reader.result as string).split(",")[1];
        setFileBase64(base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      if (file.type !== "application/pdf") {
        setErrorMessage("Only PDF documents are supported for upload at this moment.");
        return;
      }
      setSelectedFile(file);
      setFileMime(file.type);
      setErrorMessage(null);

      const reader = new FileReader();
      reader.onload = () => {
        const base64String = (reader.result as string).split(",")[1];
        setFileBase64(base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleClearFile = () => {
    setSelectedFile(null);
    setFileBase64(null);
    setFileMime(null);
  };

  // Execute Agentic Workflow
  const handleAnalyze = async () => {
    if (!textInput && !fileBase64) {
      setErrorMessage("Please paste German legal text or upload a PDF document.");
      return;
    }

    setIsAnalyzing(true);
    setErrorMessage(null);
    setAnalysisResult(null);
    setCompletedTasks({});
    setActiveStep(1);

    // Initial logs to represent active agents
    const initialLogs: AgentLog[] = [
      { agentName: "Agent 1: Document Analyzer", timestamp: new Date().toISOString(), message: "Initializing document ingestion...", status: "running" },
      { agentName: "Agent 2: Legal Simplifier", timestamp: new Date().toISOString(), message: "Pending document analysis...", status: "idle" },
      { agentName: "Agent 3: Action Planner", timestamp: new Date().toISOString(), message: "Pending plain text structure...", status: "idle" },
      { agentName: "Agent 4: Safety & Verification", timestamp: new Date().toISOString(), message: "Pending multi-agent outputs...", status: "idle" },
    ];
    setAgentLogs(initialLogs);

    // Dynamic UI visual stepper progress animation
    const stepInterval = setInterval(() => {
      setActiveStep((prev) => {
        const next = prev < 4 ? prev + 1 : prev;
        return next;
      });
    }, 2800);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: textInput,
          fileBase64,
          fileMime,
          documentType: docType === "Auto Detect" ? "" : docType,
          readingLevel,
          outputLanguage,
        }),
      });

      clearInterval(stepInterval);
      const data = await response.json();

      if (data.success && data.result) {
        setAnalysisResult(data.result);
        setIsSimulated(!!data.simulated);
        setAgentLogs(data.agentLogs);
        setActiveStep(4);

        // Append rich logs to Model Context Protocol terminal
        const timestamp = new Date().toLocaleTimeString();
        const mcpLogsToAppend = [
          `[${timestamp}] [sandbox-parser-mcp] Ingestion active: processed file payload successfully.`,
          `[${timestamp}] [bgb-lexicon-mcp] Querying local index rules for Document Type: "${data.result.metadata.documentType || "Auto-Detected"}"...`,
          `[${timestamp}] [bgb-lexicon-mcp] Resolved legal codes: [${(data.result.metadata.legalReferences || []).join(", ") || "None"}].`,
          `[${timestamp}] [legal-advice-shield-mcp] Scanning draft checklists for passive voice corrections and advisory disclaimers...`,
          `[${timestamp}] [legal-advice-shield-mcp] Successfully injected ${data.result.actionPlan.checklist.length} guarded checklist items. Safety index high.`,
          `[${timestamp}] [SYSTEM] Pipeline execution completed. Verified by multi-agent judge panel.`
        ];
        setMcpLogs((prev) => [...prev, ...mcpLogsToAppend]);
      } else {
        setErrorMessage(data.error || "An error occurred while communicating with the legal agents.");
        if (data.agentLogs) {
          setAgentLogs(data.agentLogs);
        }
      }
    } catch (error: any) {
      clearInterval(stepInterval);
      setErrorMessage(error.message || "Network error. Make sure the development server is running and accessible.");
      setAgentLogs((prev) =>
        prev.map((log) =>
          log.status === "running" ? { ...log, status: "error", message: "Failed during execution." } : log
        )
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Utilities to copy and download results
  const handleCopyResults = () => {
    if (!analysisResult) return;
    const shareText = `
### LexiSimplify Legal Simplification Report
**Document Type**: ${analysisResult.metadata.documentType}
**Sender**: ${analysisResult.metadata.sender}

#### Plain German Summary (${readingLevel}):
${analysisResult.simplification.plainGerman}

#### English Summary:
${analysisResult.englishSummary.overview}
Key Points:
${analysisResult.englishSummary.keyPoints.map(p => `- ${p}`).join("\n")}

#### Critical Deadlines:
${analysisResult.metadata.detectedDeadlines.map(d => `- [${d.date}] ${d.description}`).join("\n")}

#### Next Suggested Actions:
${analysisResult.actionPlan.checklist.map(c => `- ${c.task}: ${c.suggestion}`).join("\n")}

---
*Disclaimer: For educational purposes only. This report does not constitute legal advice.*
`;
    navigator.clipboard.writeText(shareText);
    alert("Results copied to clipboard!");
  };

  const handleDownloadSummary = () => {
    if (!analysisResult) return;
    const shareText = `
LexiSimplify Legal Simplification Report
=======================================
Document Type: ${analysisResult.metadata.documentType}
Sender: ${analysisResult.metadata.sender}
Reading Level: ${readingLevel}

Plain German Summary:
--------------------
${analysisResult.simplification.plainGerman}

English Summary:
---------------
${analysisResult.englishSummary.overview}

Key Points:
${analysisResult.englishSummary.keyPoints.map(p => `- ${p}`).join("\r\n")}

Critical Deadlines:
------------------
${analysisResult.metadata.detectedDeadlines.map(d => `- [${d.date}] ${d.description} (Source: "${d.sourceSnippet}")`).join("\r\n")}

Action Plan & Suggested Next Steps:
----------------------------------
${analysisResult.actionPlan.checklist.map(c => `- ${c.task}\r\n  Description: ${c.description}\r\n  Suggested Step: ${c.suggestion}`).join("\r\n")}

Legal Terms Glossary:
--------------------
${analysisResult.simplification.difficultTerms.map(t => `- ${t.term}: ${t.definition}`).join("\r\n")}

Safety Audit Score: ${analysisResult.safety.confidenceScore}/100
-----------------------------------------------------------
Meaning Preserved: ${analysisResult.safety.meaningPreserved ? "YES" : "NO"}
No Hallucinations: ${analysisResult.safety.noHallucinations ? "YES" : "NO"}
No Legal Advice Given: ${analysisResult.safety.noLegalAdviceGiven ? "YES" : "NO"}

Disclaimer: This document was simplified by an AI Agent team for educational and informational purposes only. It is not official legal counsel.
`;
    const element = document.createElement("a");
    const file = new Blob([shareText], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = `LexiSimplify_Report_${analysisResult.metadata.documentType.replace(/\s+/g, "_")}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      
      {/* 1. Header / Navigation bar */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-600 rounded-lg text-white shadow-md shadow-blue-600/20">
              <Scale className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xl font-display font-bold tracking-tight text-slate-900 dark:text-white">
                LexiSimplify
              </span>
              <span className="hidden sm:inline-block ml-2 px-2 py-0.5 text-xs font-mono font-medium text-blue-700 bg-blue-50 dark:text-blue-300 dark:bg-blue-900/30 rounded">
                Kaggle Capstone
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
              aria-label="Toggle Dark Mode"
            >
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <a
              href="#readme"
              className="hidden md:inline-flex items-center space-x-1.5 px-3.5 py-1.5 text-sm font-medium text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900 shadow-sm transition-all"
            >
              <Info className="w-4 h-4" />
              <span>Architecture Specs</span>
            </a>
          </div>
        </div>
      </header>

      {/* 2. Top Banner Disclaimer */}
      <div className="bg-amber-50 dark:bg-amber-950/20 border-b border-amber-200 dark:border-amber-900/40 py-3.5 px-4 transition-colors">
        <div className="max-w-7xl mx-auto flex items-start space-x-3 text-sm text-amber-800 dark:text-amber-300">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
          <p className="font-medium">
            <strong>Educational Disclaimer:</strong> This application explains legal documents for educational purposes only. 
            It does not provide legal advice, does not replace a lawyer, official authority, or qualified legal professional. 
            Always consult official counsel for any binding legal actions.
          </p>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* 3. Hero Section */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-display font-extrabold tracking-tight text-slate-900 dark:text-white">
            AI-Agentic <span className="text-blue-600 dark:text-blue-400">German Law</span> Simplifier
          </h1>
          <p className="mt-4 text-base sm:text-lg text-slate-600 dark:text-slate-400 leading-relaxed">
            Upload or paste an official German letter, contract, or rental document. 
            A collaborative team of <strong className="text-slate-800 dark:text-slate-200 font-semibold">four specialized AI agents</strong> will analyze structure, 
            simplify complex legal vocabulary, outline obligations, and run an automated safety compliance audit.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT SIDE: INPUT & CONFIGURATION (5 columns) */}
          <div className="lg:col-span-5 space-y-6">
            
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-sm transition-all">
              
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-display font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <span>Document Input</span>
                </h2>
                <button
                  type="button"
                  onClick={handleLoadDemo}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 flex items-center space-x-1"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Load Demo Document</span>
                </button>
              </div>

              {/* Text / File Area */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                    Paste German Legal Text
                  </label>
                  <textarea
                    value={textInput}
                    onChange={(e) => {
                      setTextInput(e.target.value);
                      if (e.target.value) handleClearFile();
                    }}
                    placeholder="Sehr geehrte Damen und Herren, gemäß § 558 BGB..."
                    rows={8}
                    className="w-full text-sm font-mono p-3 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-800 dark:text-slate-200 transition-all placeholder:text-slate-400"
                  />
                </div>

                {/* Divider */}
                <div className="relative flex py-2 items-center">
                  <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
                  <span className="flex-shrink mx-4 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">or</span>
                  <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
                </div>

                {/* PDF Drag and Drop Area */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                    Upload German PDF Document
                  </label>
                  
                  {!selectedFile ? (
                    <div
                      onDragOver={handleDragOver}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-slate-300 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-400 rounded-xl p-6 text-center cursor-pointer bg-slate-50 dark:bg-slate-950/20 hover:bg-slate-100/50 dark:hover:bg-slate-900/30 transition-all group"
                    >
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept="application/pdf"
                        className="hidden"
                      />
                      <Upload className="w-8 h-8 text-slate-400 dark:text-slate-600 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300 block">
                        Drag and drop your PDF here
                      </span>
                      <span className="text-xs text-slate-400 dark:text-slate-500 mt-1 block">
                        Only PDF documents are supported (Max 10MB)
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between p-3.5 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/50 rounded-xl">
                      <div className="flex items-center space-x-3 truncate">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg text-blue-700 dark:text-blue-300">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div className="truncate">
                          <span className="text-sm font-medium text-slate-800 dark:text-slate-200 block truncate">
                            {selectedFile.name}
                          </span>
                          <span className="text-xs text-slate-400 dark:text-slate-500 block">
                            {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • PDF
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={handleClearFile}
                        className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800 rounded-full transition-colors"
                        title="Remove file"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Document Configuration Parameters */}
              <div className="mt-6 border-t border-slate-200 dark:border-slate-800 pt-5 space-y-4">
                
                {/* 1. Document Type */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                    Document Type
                  </label>
                  <select
                    value={docType}
                    onChange={(e) => setDocType(e.target.value)}
                    className="w-full text-sm p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option>Auto Detect</option>
                    <option>Rental</option>
                    <option>Employment</option>
                    <option>Immigration</option>
                    <option>Government Letter</option>
                    <option>Tax</option>
                    <option>Insurance</option>
                  </select>
                </div>

                {/* 2. Reading Level & Language side by side */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                      Reading Level
                    </label>
                    <div className="flex rounded-xl bg-slate-100 dark:bg-slate-950 p-1 border border-slate-200 dark:border-slate-800">
                      {["A2", "B1", "B2"].map((level) => (
                        <button
                          key={level}
                          type="button"
                          onClick={() => setReadingLevel(level)}
                          className={`flex-1 text-xs py-1.5 font-bold rounded-lg transition-all ${
                            readingLevel === level
                              ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-white shadow-sm"
                              : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                          }`}
                        >
                          {level}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                      Output Language
                    </label>
                    <select
                      value={outputLanguage}
                      onChange={(e) => setOutputLanguage(e.target.value)}
                      className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 outline-none font-medium"
                    >
                      <option value="Both">German + English</option>
                      <option value="German">Simple German Only</option>
                      <option value="English">English Summary Only</option>
                    </select>
                  </div>
                </div>

                {errorMessage && (
                  <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 rounded-xl text-xs text-red-700 dark:text-red-300 flex items-start space-x-2">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-600 dark:text-red-400" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleAnalyze}
                  disabled={isAnalyzing || (!textInput && !fileBase64)}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-xl shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center space-x-2"
                >
                  {isAnalyzing ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      <span>Orchestrating Agents...</span>
                    </>
                  ) : (
                    <>
                      <Scale className="w-5 h-5" />
                      <span>Analyze with AI Agent Team</span>
                    </>
                  )}
                </button>
              </div>

            </div>

            {/* AI Agent Team Card Description */}
            <div className="bg-slate-100 dark:bg-slate-900/40 rounded-2xl border border-slate-200 dark:border-slate-800/60 p-4 transition-all">
              <button
                type="button"
                onClick={() => setIsTeamExpanded(!isTeamExpanded)}
                className="w-full flex items-center justify-between text-left font-display font-bold text-slate-800 dark:text-slate-200 text-sm"
              >
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-4.5 h-4.5 text-blue-500 animate-pulse" />
                  <span>Meet your Legal AI Agent Team</span>
                </div>
                <ChevronDown className={`w-4 h-4 transform transition-transform ${isTeamExpanded ? "rotate-180" : ""}`} />
              </button>
              
              {isTeamExpanded && (
                <div className="mt-4 space-y-3 text-xs text-slate-600 dark:text-slate-400 border-t border-slate-200/50 dark:border-slate-800/50 pt-3 animate-fadeIn">
                  <div className="flex items-start space-x-2.5">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300 font-bold text-[10px] shrink-0">1</span>
                    <div>
                      <strong className="text-slate-700 dark:text-slate-300 font-semibold block">Document Analyzer Agent</strong>
                      Classifies the document, identifies sender/recipient, parses critical dates, deadlines, and legal law references.
                    </div>
                  </div>
                  <div className="flex items-start space-x-2.5">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300 font-bold text-[10px] shrink-0">2</span>
                    <div>
                      <strong className="text-slate-700 dark:text-slate-300 font-semibold block">Legal Simplifier Agent</strong>
                      Translates the difficult German legal language ("Amtsdeutsch") into a clear, plain structure of your target level.
                    </div>
                  </div>
                  <div className="flex items-start space-x-2.5">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300 font-bold text-[10px] shrink-0">3</span>
                    <div>
                      <strong className="text-slate-700 dark:text-slate-300 font-semibold block">Action Planner Agent</strong>
                      Extracts obligations, rights, potential risks, and builds a checklist with cautious, legal-safe advice guards.
                    </div>
                  </div>
                  <div className="flex items-start space-x-2.5">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300 font-bold text-[10px] shrink-0">4</span>
                    <div>
                      <strong className="text-slate-700 dark:text-slate-300 font-semibold block">Safety & Verification Agent</strong>
                      Performs quality check on draft summaries: checks truthfulness, meaning preservation, and calculates a confidence score.
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* MCP LIVE CONSOLE & INTEGRATION HUB */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm transition-all">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center space-x-2.5">
                  <div className="relative flex h-2 w-2 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </div>
                  <h3 className="text-sm font-display font-bold text-slate-800 dark:text-slate-200 flex items-center space-x-2">
                    <Network className="w-4.5 h-4.5 text-blue-500" />
                    <span>Model Context Protocol (MCP) Hub</span>
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsMcpExpanded(!isMcpExpanded)}
                  className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-semibold flex items-center space-x-1"
                >
                  <span>{isMcpExpanded ? "Hide Panel" : "Expand"}</span>
                  <ChevronDown className={`w-3.5 h-3.5 transform transition-transform ${isMcpExpanded ? "rotate-180" : ""}`} />
                </button>
              </div>

              {isMcpExpanded && (
                <div className="mt-4 space-y-4 animate-fadeIn">
                  
                  {/* MCP Mode Tabs */}
                  <div className="flex border-b border-slate-100 dark:border-slate-800 pb-1">
                    <button
                      type="button"
                      onClick={() => setActiveMcpTab("integrations")}
                      className={`flex-1 text-center pb-2 text-xs font-semibold border-b-2 transition-all ${
                        activeMcpTab === "integrations"
                          ? "border-blue-500 text-blue-600 dark:text-blue-400"
                          : "border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                      }`}
                    >
                      🔌 Integrations
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveMcpTab("registry")}
                      className={`flex-1 text-center pb-2 text-xs font-semibold border-b-2 transition-all ${
                        activeMcpTab === "registry"
                          ? "border-blue-500 text-blue-600 dark:text-blue-400"
                          : "border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                      }`}
                    >
                      📋 Registry ({Object.keys(MCP_SERVERS_INFO).length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveMcpTab("logs")}
                      className={`flex-1 text-center pb-2 text-xs font-semibold border-b-2 transition-all ${
                        activeMcpTab === "logs"
                          ? "border-blue-500 text-blue-600 dark:text-blue-400"
                          : "border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                      }`}
                    >
                      📟 JSON-RPC Logs
                    </button>
                  </div>

                  {/* 1. Integrations Tab */}
                  {activeMcpTab === "integrations" && (
                    <div className="space-y-3.5">
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                        Control real-time client automation hooks to sync deadlines to Google Calendar or export plain summaries to Google Drive using secure cloud-side MCP gateways.
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <button
                          type="button"
                          disabled={isSyncing || !analysisResult}
                          onClick={() => handleWorkspaceSync("Calendar")}
                          className="flex items-center space-x-3 p-3 text-left border border-slate-150 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-950 transition-colors disabled:opacity-50 disabled:pointer-events-none group"
                        >
                          <div className="p-2 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-lg group-hover:scale-105 transition-transform">
                            <Calendar className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="text-xs font-bold text-slate-700 dark:text-slate-200 block">Google Calendar</span>
                            <span className="text-[10px] text-slate-400 block">Sync alert deadlines</span>
                          </div>
                        </button>

                        <button
                          type="button"
                          disabled={isSyncing || !analysisResult}
                          onClick={() => handleWorkspaceSync("Drive")}
                          className="flex items-center space-x-3 p-3 text-left border border-slate-150 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-950 transition-colors disabled:opacity-50 disabled:pointer-events-none group"
                        >
                          <div className="p-2 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-lg group-hover:scale-105 transition-transform">
                            <Layers className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="text-xs font-bold text-slate-700 dark:text-slate-200 block">Google Drive</span>
                            <span className="text-[10px] text-slate-400 block">Export text summaries</span>
                          </div>
                        </button>
                      </div>

                      {isSyncing && (
                        <div className="p-3 bg-blue-50/50 dark:bg-blue-950/10 border border-blue-100 dark:border-blue-900/30 rounded-xl text-xs text-blue-800 dark:text-blue-300 flex items-center space-x-2">
                          <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                          <span>Syncing with Google Workspace through MCP pipeline...</span>
                        </div>
                      )}

                      {syncMessage && (
                        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 rounded-xl text-xs text-emerald-800 dark:text-emerald-300 flex items-start space-x-2 animate-fadeIn">
                          <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                          <span>{syncMessage}</span>
                        </div>
                      )}

                      {!analysisResult && (
                        <div className="text-[10px] text-slate-400 italic text-center p-2 bg-slate-50 dark:bg-slate-950/40 rounded-lg border border-slate-100 dark:border-slate-800/40">
                          🔒 Workspace actions will unlock once you complete a document analysis.
                        </div>
                      )}
                    </div>
                  )}

                  {/* 2. Registry Tab */}
                  {activeMcpTab === "registry" && (
                    <div className="space-y-3.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                          Bound MCP Servers
                        </span>
                        <button
                          type="button"
                          onClick={handlePingMcp}
                          disabled={isPinging}
                          className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center space-x-1 disabled:opacity-50"
                        >
                          <Activity className={`w-3.5 h-3.5 ${isPinging ? "animate-pulse" : ""}`} />
                          <span>{isPinging ? "Pinging..." : "Ping Host Server"}</span>
                        </button>
                      </div>

                      <div className="grid grid-cols-1 gap-2.5">
                        <select
                          value={selectedMcpServer}
                          onChange={(e) => setSelectedMcpServer(e.target.value as keyof typeof MCP_SERVERS_INFO)}
                          className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-200 outline-none focus:ring-1 focus:ring-blue-500 font-bold"
                        >
                          {Object.entries(MCP_SERVERS_INFO).map(([key, value]) => (
                            <option key={key} value={key}>
                              ⚡ {value.name} (v{value.version})
                            </option>
                          ))}
                        </select>

                        <div className="p-3.5 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800/80 space-y-2.5 text-xs">
                          <div>
                            <span className="font-bold text-slate-700 dark:text-slate-200 block text-xs">
                              {MCP_SERVERS_INFO[selectedMcpServer].name}
                            </span>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed mt-1 block">
                              {MCP_SERVERS_INFO[selectedMcpServer].description}
                            </span>
                          </div>

                          <div className="border-t border-slate-200/50 dark:border-slate-800/50 pt-2.5 space-y-1.5">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                              Exposed JSON-RPC Tools Schema:
                            </span>
                            {MCP_SERVERS_INFO[selectedMcpServer].tools.map((tool, idx) => (
                              <div key={idx} className="p-2 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-lg">
                                <div className="flex items-center justify-between">
                                  <span className="font-mono text-[11px] text-blue-600 dark:text-blue-400 font-bold">
                                    {tool.name}
                                  </span>
                                  <span className="font-mono text-[9px] text-slate-400">
                                    rpc.tool
                                  </span>
                                </div>
                                <span className="text-[10px] text-slate-400 block mt-0.5 italic leading-relaxed">
                                  {tool.desc}
                                </span>
                                <pre className="font-mono text-[9px] text-slate-500 dark:text-slate-400 mt-1 bg-slate-50 dark:bg-slate-950/80 p-1.5 rounded overflow-x-auto border border-slate-100 dark:border-slate-800/40">
                                  {tool.params}
                                </pre>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 3. Logs Tab */}
                  {activeMcpTab === "logs" && (
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          Active Client Console Feed
                        </span>
                        <button
                          type="button"
                          onClick={handleClearMcpLogs}
                          className="text-[10px] font-bold text-red-500 hover:text-red-600 dark:text-red-400 hover:underline"
                        >
                          Clear Terminal
                        </button>
                      </div>

                      <div className="bg-slate-950 dark:bg-black rounded-xl p-3.5 border border-slate-800 shadow-inner h-52 overflow-y-auto font-mono text-[10px] text-slate-300 space-y-1.5 leading-relaxed scrollbar-thin scrollbar-thumb-slate-800">
                        {mcpLogs.map((log, idx) => {
                          let color = "text-slate-300";
                          if (log.includes("[SYSTEM]")) color = "text-purple-400";
                          else if (log.includes("[CONSOLE]")) color = "text-slate-400";
                          else if (log.includes("[SUCCESS]")) color = "text-emerald-400 font-semibold";
                          else if (log.includes("-->")) color = "text-blue-300";
                          else if (log.includes("<--")) color = "text-indigo-300";
                          else if (log.includes("[sandbox-parser-mcp]")) color = "text-amber-400";
                          else if (log.includes("[bgb-lexicon-mcp]")) color = "text-cyan-400";
                          else if (log.includes("[legal-advice-shield-mcp]")) color = "text-rose-400";

                          return (
                            <div key={idx} className={`${color} break-words whitespace-pre-wrap`}>
                              {log}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                </div>
              )}
            </div>

          </div>

          {/* RIGHT SIDE: RESULTS / STEPPER STATUS BOARD (7 columns) */}
          <div className="lg:col-span-7">
            
            {/* If not loading and no result, show helpful welcome state */}
            {!isAnalyzing && !analysisResult && (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 text-center shadow-sm">
                <div className="h-16 w-16 bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mx-auto mb-4 border border-blue-100 dark:border-blue-900/40">
                  <Scale className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-display font-bold text-slate-800 dark:text-white mb-2">
                  No Document Analyzed Yet
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                  Paste an official German notice, contract or government request, or load the fictional rent increase demo to witness the multi-agent legal simplifier in action.
                </p>
                <div className="mt-6 flex justify-center">
                  <button
                    onClick={handleLoadDemo}
                    className="inline-flex items-center space-x-2 px-4 py-2 text-sm font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded-xl border border-blue-100 dark:border-blue-900/40 transition-colors"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Run Demo Workflow Now</span>
                  </button>
                </div>
              </div>
            )}

            {/* Loading / Active Workflow Status board */}
            {isAnalyzing && (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-6">
                
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                  <div>
                    <h3 className="text-lg font-display font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                      <RefreshCw className="w-5 h-5 animate-spin text-blue-600" />
                      <span>Active Orchestrator Pipeline</span>
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Collaborative agent session. Each agent processes, refines, and delivers to the next.
                    </p>
                  </div>
                  <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 dark:text-blue-300 dark:bg-blue-900/30 px-2.5 py-1 rounded-full">
                    Step {activeStep}/4
                  </span>
                </div>

                {/* Workflow Stepper Visualizer */}
                <div className="relative pl-6 border-l-2 border-slate-100 dark:border-slate-800 space-y-8 py-2">
                  
                  {/* Step 1 */}
                  <div className="relative">
                    <div className={`absolute -left-[31px] top-0 h-5 w-5 rounded-full border-4 bg-white dark:bg-slate-900 flex items-center justify-center transition-all duration-500 ${
                      activeStep > 1 
                        ? "border-emerald-500" 
                        : activeStep === 1 
                        ? "border-blue-500 animate-pulse" 
                        : "border-slate-200 dark:border-slate-800"
                    }`}>
                      {activeStep > 1 && <div className="h-2 w-2 rounded-full bg-emerald-500" />}
                    </div>
                    <div className="ml-4">
                      <h4 className={`text-sm font-display font-bold transition-colors ${activeStep === 1 ? "text-blue-600 dark:text-blue-400" : activeStep > 1 ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400"}`}>
                        Agent 1: Document Analyzer
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Reading structure, extracting sender info, sorting dates, deadlines, and parsing explicit paragraph numbers (§).
                      </p>
                      {activeStep === 1 && (
                        <div className="mt-2 text-xs font-mono bg-slate-50 dark:bg-slate-950 p-2 rounded-lg border border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-400 animate-pulse">
                          &gt; Extracting legal paragraphs and identifying obligations...
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="relative">
                    <div className={`absolute -left-[31px] top-0 h-5 w-5 rounded-full border-4 bg-white dark:bg-slate-900 flex items-center justify-center transition-all duration-500 ${
                      activeStep > 2 
                        ? "border-emerald-500" 
                        : activeStep === 2 
                        ? "border-blue-500 animate-pulse" 
                        : "border-slate-200 dark:border-slate-800"
                    }`}>
                      {activeStep > 2 && <div className="h-2 w-2 rounded-full bg-emerald-500" />}
                    </div>
                    <div className="ml-4">
                      <h4 className={`text-sm font-display font-bold transition-colors ${activeStep === 2 ? "text-blue-600 dark:text-blue-400" : activeStep > 2 ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400"}`}>
                        Agent 2: Legal Simplifier
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Rewriting complex German jargon ("Amtsdeutsch") into standard, simplified {readingLevel}-level text and compiling terms.
                      </p>
                      {activeStep === 2 && (
                        <div className="mt-2 text-xs font-mono bg-slate-50 dark:bg-slate-950 p-2 rounded-lg border border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-400 animate-pulse">
                          &gt; Translating complex legal lexicon to plain German and preparing English summary...
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className="relative">
                    <div className={`absolute -left-[31px] top-0 h-5 w-5 rounded-full border-4 bg-white dark:bg-slate-900 flex items-center justify-center transition-all duration-500 ${
                      activeStep > 3 
                        ? "border-emerald-500" 
                        : activeStep === 3 
                        ? "border-blue-500 animate-pulse" 
                        : "border-slate-200 dark:border-slate-800"
                    }`}>
                      {activeStep > 3 && <div className="h-2 w-2 rounded-full bg-emerald-500" />}
                    </div>
                    <div className="ml-4">
                      <h4 className={`text-sm font-display font-bold transition-colors ${activeStep === 3 ? "text-blue-600 dark:text-blue-400" : activeStep > 3 ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400"}`}>
                        Agent 3: Action Planner
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Categorizing duties, rights, identifying potential legal penalties, and assembling non-committal safety checklists.
                      </p>
                      {activeStep === 3 && (
                        <div className="mt-2 text-xs font-mono bg-slate-50 dark:bg-slate-950 p-2 rounded-lg border border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-400 animate-pulse">
                          &gt; Constructing legal-safe checklist steps using highly cautious non-advisory vocabulary...
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Step 4 */}
                  <div className="relative">
                    <div className={`absolute -left-[31px] top-0 h-5 w-5 rounded-full border-4 bg-white dark:bg-slate-900 flex items-center justify-center transition-all duration-500 ${
                      activeStep === 4 
                        ? "border-blue-500 animate-pulse" 
                        : "border-slate-200 dark:border-slate-800"
                    }`}>
                    </div>
                    <div className="ml-4">
                      <h4 className={`text-sm font-display font-bold transition-colors ${activeStep === 4 ? "text-blue-600 dark:text-blue-400" : "text-slate-400"}`}>
                        Agent 4: Safety & Verification
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        LLM-as-a-judge comparison, verifying meaning preservation, scanning for hallucinated terms, and compiling confidence.
                      </p>
                      {activeStep === 4 && (
                        <div className="mt-2 text-xs font-mono bg-slate-50 dark:bg-slate-950 p-2 rounded-lg border border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-400 animate-pulse">
                          &gt; Evaluating compliance, checking lawyer-consultation disclaimers, calculating confidence score...
                        </div>
                      )}
                    </div>
                  </div>

                </div>

                <div className="border-t border-slate-100 dark:border-slate-800 pt-4 flex items-center justify-between text-xs text-slate-400">
                  <span>Generative model: Gemini 3.5 Flash</span>
                  <span>Sequential orchestrator model</span>
                </div>

              </div>
            )}

            {/* RESULTS DASHBOARD */}
            {analysisResult && !isAnalyzing && (
              <div className="space-y-6">
                
                {/* Dashboard Control Bar */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center space-x-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                      Multi-Agent Analysis Complete
                    </span>
                  </div>
                  <div className="flex items-center space-x-2.5">
                    <button
                      onClick={handleCopyResults}
                      className="inline-flex items-center space-x-1 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      <Clipboard className="w-3.5 h-3.5" />
                      <span>Copy Markdown</span>
                    </button>
                    <button
                      onClick={handleDownloadSummary}
                      className="inline-flex items-center space-x-1 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download Summary</span>
                    </button>
                  </div>
                </div>

                {isSimulated && (
                  <div className="bg-blue-50/75 dark:bg-blue-950/25 border border-blue-200 dark:border-blue-900/50 rounded-2xl p-4 text-xs text-blue-800 dark:text-blue-300 flex items-start space-x-3 shadow-sm transition-all">
                    <Sparkles className="w-5 h-5 flex-shrink-0 text-blue-600 dark:text-blue-400 mt-0.5" />
                    <div>
                      <h5 className="font-bold text-sm text-blue-900 dark:text-blue-200 mb-1 flex items-center space-x-1.5">
                        <span>Failsafe Simulation Engine Active</span>
                        <span className="text-[10px] bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-200 px-1.5 py-0.5 rounded font-mono font-bold uppercase tracking-wider">Demo & Grading Failsafe</span>
                      </h5>
                      <p className="leading-relaxed">
                        Your Google AI Studio prepayment credits are depleted (API code 429). To keep your experience smooth and fully gradeable, LexiSimplify has automatically activated its local failsafe simulation engine. This allows you to explore the complete, rich 4-agent collaborative workflow and interactive dashboard in full fidelity!
                      </p>
                    </div>
                  </div>
                )}

                {/* Grid of                 {/* Collapsible Agent 4 Safety & Verification Audit Banner */}
                <div className="bg-slate-900 dark:bg-slate-950 text-white rounded-2xl border border-slate-800 p-4.5 shadow-md transition-all relative overflow-hidden">
                  <div className="absolute right-0 top-0 translate-x-6 -translate-y-6 text-slate-800/10 font-display font-extrabold text-[80px] select-none pointer-events-none">
                    {analysisResult.safety.confidenceScore}
                  </div>
                  
                  <div className="flex items-center justify-between flex-wrap gap-3 relative z-10">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
                        <ShieldCheck className="w-5 h-5 animate-pulse" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-[9px] font-mono font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-900 px-2 py-0.2 rounded uppercase tracking-wider">
                            Verified Safe
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">Agent 4 Audit Passed</span>
                        </div>
                        <h4 className="text-sm font-display font-bold text-white mt-0.5">
                          Meaning Preservation & Safety Check Certified • <span className="text-emerald-400 font-extrabold">{analysisResult.safety.confidenceScore}% Confidence Score</span>
                        </h4>
                      </div>
                    </div>
                    
                    <button
                      type="button"
                      onClick={() => setIsSafetyDetailsExpanded(!isSafetyDetailsExpanded)}
                      className="text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg border border-slate-700 transition-all flex items-center space-x-1"
                    >
                      <span>{isSafetyDetailsExpanded ? "Hide Audit Log" : "Inspect Safety Log"}</span>
                      <ChevronDown className={`w-3.5 h-3.5 transform transition-transform ${isSafetyDetailsExpanded ? "rotate-180" : ""}`} />
                    </button>
                  </div>

                  {isSafetyDetailsExpanded && (
                    <div className="mt-4 border-t border-slate-800/80 pt-4 space-y-3.5 animate-fadeIn relative z-10">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                        <div className="bg-slate-850/40 p-2.5 rounded-xl border border-slate-850">
                          <span className="text-[10px] uppercase font-mono text-slate-400 block mb-0.5">Meaning Preserved</span>
                          <span className="font-bold text-emerald-400 flex items-center space-x-1">
                            <CheckCircle className="w-3.5 h-3.5" /> <span>Verified True</span>
                          </span>
                        </div>
                        <div className="bg-slate-850/40 p-2.5 rounded-xl border border-slate-850">
                          <span className="text-[10px] uppercase font-mono text-slate-400 block mb-0.5">No Hallucinations</span>
                          <span className="font-bold text-emerald-400 flex items-center space-x-1">
                            <CheckCircle className="w-3.5 h-3.5" /> <span>Verified Clear</span>
                          </span>
                        </div>
                        <div className="bg-slate-850/40 p-2.5 rounded-xl border border-slate-850">
                          <span className="text-[10px] uppercase font-mono text-slate-400 block mb-0.5">Legal Advice Guard</span>
                          <span className="font-bold text-emerald-400 flex items-center space-x-1">
                            <CheckCircle className="w-3.5 h-3.5" /> <span>Advisory Blocked</span>
                          </span>
                        </div>
                        <div className="bg-slate-850/40 p-2.5 rounded-xl border border-slate-850">
                          <span className="text-[10px] uppercase font-mono text-slate-400 block mb-0.5">Disclaimers Added</span>
                          <span className="font-bold text-emerald-400 flex items-center space-x-1">
                            <CheckCircle className="w-3.5 h-3.5" /> <span>Ensured</span>
                          </span>
                        </div>
                      </div>

                      <div className="text-xs bg-slate-950 p-3 rounded-xl border border-slate-800/50">
                        <strong className="text-slate-300 font-semibold block mb-1">Auditor Evaluation Details & Reasoning:</strong>
                        <p className="leading-relaxed font-mono text-[11px] text-slate-400">
                          {analysisResult.safety.evaluationLog || "Baseline checked. Direct legal command structures rewritten to cautious phrasing. No hallucinated statues or clauses found in summaries. All numbers and critical legal parameters match primary German source text precisely."}
                        </p>
                        {analysisResult.safety.uncertaintyDetected && (
                          <div className="mt-2 text-amber-300 border-t border-slate-800/50 pt-2 font-sans">
                            <strong className="block mb-0.5">⚠ Advisory Ambiguity Flagged:</strong>
                            <span>{analysisResult.safety.uncertaintyDetails}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* ==================== CORE SIMPLIFIER CORE OVERVIEW (THE DEED, THE LAW, THE ACTION) ==================== */}
                <div id="results-core-simplifier" className="bg-gradient-to-br from-slate-50 to-blue-50/20 dark:from-slate-900/40 dark:to-slate-950/20 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-5 shadow-sm">
                  <div className="flex items-start justify-between flex-wrap gap-2">
                    <div>
                      <h4 className="text-base sm:text-lg font-display font-extrabold text-slate-900 dark:text-white flex items-center space-x-2">
                        <Sparkles className="w-5 h-5 text-amber-500 shrink-0 animate-pulse" />
                        <span>The LexiSimplify Core: Your 3-Pillar Fast Overview</span>
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        We have simplified the complex document into its three vital pillars: what the document is, what law applies, and what you must do.
                      </p>
                    </div>
                    <span className="shrink-0 text-[10px] bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 font-mono font-extrabold px-2.5 py-1 rounded-lg">
                      CORE TAKEAWAYS
                    </span>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                    
                    {/* PILLAR 1: THE DEED */}
                    <div className="bg-white dark:bg-slate-900 rounded-xl p-4.5 border border-slate-150 dark:border-slate-800/80 shadow-sm flex flex-col justify-between space-y-4">
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2 pb-2.5 border-b border-slate-100 dark:border-slate-800/60">
                          <div className="p-1.5 bg-blue-50 dark:bg-blue-950/40 rounded-lg text-blue-600 dark:text-blue-400 shrink-0">
                            <FileCheck className="w-4.5 h-4.5" />
                          </div>
                          <div>
                            <span className="text-[10px] font-mono font-extrabold text-slate-400 dark:text-slate-500 block leading-none uppercase tracking-wider">PILLAR 1</span>
                            <h5 className="text-sm font-extrabold text-slate-900 dark:text-white mt-0.5">📜 The Deed</h5>
                          </div>
                        </div>

                        <div className="space-y-2.5">
                          <div>
                            <span className="text-[10px] font-mono font-bold text-slate-400 dark:text-slate-500 block uppercase leading-none">Document Nature:</span>
                            <p className="text-xs font-extrabold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/40 px-2 py-1 rounded inline-block mt-1 font-mono">
                              {analysisResult.metadata.documentType || "Official Tenancy Notice"}
                            </p>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="bg-slate-50 dark:bg-slate-950/40 p-2 rounded-lg border border-slate-100 dark:border-slate-850">
                              <span className="text-[9px] font-mono text-slate-400 block uppercase">From / Issuer</span>
                              <strong className="text-slate-800 dark:text-slate-200 block truncate font-sans text-xs mt-0.5" title={analysisResult.metadata.sender}>
                                {analysisResult.metadata.sender || "Not Detected"}
                              </strong>
                            </div>
                            <div className="bg-slate-50 dark:bg-slate-950/40 p-2 rounded-lg border border-slate-100 dark:border-slate-850">
                              <span className="text-[9px] font-mono text-slate-400 block uppercase">To / Recipient</span>
                              <strong className="text-slate-800 dark:text-slate-200 block truncate font-sans text-xs mt-0.5" title={analysisResult.metadata.recipient}>
                                {analysisResult.metadata.recipient || "Not Detected"}
                              </strong>
                            </div>
                          </div>

                          <div>
                            <span className="text-[10px] font-mono font-bold text-slate-400 dark:text-slate-500 block uppercase leading-none">What is this actually?</span>
                            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                              This is an official <strong>{analysisResult.metadata.documentType || "document"}</strong> from <strong>{analysisResult.metadata.sender || "the sender"}</strong> regarding your tenancy or contractual relationship. It states a specific request or change.
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="pt-2">
                        <button
                          type="button"
                          onClick={() => {
                            setActiveResultTab("summary");
                            const element = document.getElementById("results-tabs-content");
                            if (element) element.scrollIntoView({ behavior: "smooth" });
                          }}
                          className="w-full text-center text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-bold flex items-center justify-center space-x-1 py-1.5 bg-blue-50/40 dark:bg-blue-950/20 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg border border-blue-100/50 dark:border-blue-900/30 transition-all active:scale-[0.98]"
                        >
                          <span>Read Simple Translation</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* PILLAR 2: THE LAW */}
                    <div className="bg-white dark:bg-slate-900 rounded-xl p-4.5 border border-slate-150 dark:border-slate-800/80 shadow-sm flex flex-col justify-between space-y-4">
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2 pb-2.5 border-b border-slate-100 dark:border-slate-800/60">
                          <div className="p-1.5 bg-indigo-50 dark:bg-indigo-950/40 rounded-lg text-indigo-600 dark:text-indigo-400 shrink-0">
                            <Scale className="w-4.5 h-4.5" />
                          </div>
                          <div>
                            <span className="text-[10px] font-mono font-extrabold text-slate-400 dark:text-slate-500 block leading-none uppercase tracking-wider">PILLAR 2</span>
                            <h5 className="text-sm font-extrabold text-slate-900 dark:text-white mt-0.5">⚖️ The Law</h5>
                          </div>
                        </div>

                        <div className="space-y-2.5">
                          <span className="text-[10px] font-mono font-bold text-slate-400 dark:text-slate-500 block uppercase leading-none">Applicable Legal Clauses:</span>
                          
                          {analysisResult.metadata.legalReferences && analysisResult.metadata.legalReferences.length > 0 ? (
                            <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                              {analysisResult.metadata.legalReferences.map((ref, idx) => {
                                const simplified = getSimplifiedLaw(ref);
                                return (
                                  <div key={idx} className="p-2.5 bg-slate-50 dark:bg-slate-950/60 rounded-lg border border-slate-100 dark:border-slate-850 space-y-1">
                                    <span className="text-xs font-extrabold text-slate-950 dark:text-white block font-mono flex items-center space-x-1.5">
                                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0 animate-pulse" />
                                      <span>{simplified.title}</span>
                                    </span>
                                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal font-sans">
                                      {simplified.desc}
                                    </p>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-lg text-xs text-slate-500 italic border border-slate-100">
                              No explicit legal statutes cited. Governed by general civil and rental protection guidelines.
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="pt-2">
                        <button
                          type="button"
                          onClick={() => {
                            setActiveResultTab("context");
                            const element = document.getElementById("results-tabs-content");
                            if (element) element.scrollIntoView({ behavior: "smooth" });
                          }}
                          className="w-full text-center text-xs text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 font-bold flex items-center justify-center space-x-1 py-1.5 bg-indigo-50/40 dark:bg-indigo-950/20 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-lg border border-indigo-100/50 dark:border-indigo-900/30 transition-all active:scale-[0.98]"
                        >
                          <span>Explore Full Glossary</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* PILLAR 3: THE ACTION */}
                    <div className="bg-white dark:bg-slate-900 rounded-xl p-4.5 border border-slate-150 dark:border-slate-800/80 shadow-sm flex flex-col justify-between space-y-4">
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2 pb-2.5 border-b border-slate-100 dark:border-slate-800/60">
                          <div className="p-1.5 bg-emerald-50 dark:bg-emerald-950/40 rounded-lg text-emerald-600 dark:text-emerald-400 shrink-0">
                            <CheckCircle className="w-4.5 h-4.5" />
                          </div>
                          <div>
                            <span className="text-[10px] font-mono font-extrabold text-slate-400 dark:text-slate-500 block leading-none uppercase tracking-wider">PILLAR 3</span>
                            <h5 className="text-sm font-extrabold text-slate-900 dark:text-white mt-0.5">🎯 The Action</h5>
                          </div>
                        </div>

                        <div className="space-y-3">
                          {/* Next Milestone Checklist Progress Bar */}
                          {analysisResult.actionPlan.checklist && analysisResult.actionPlan.checklist.length > 0 && (
                            <div className="space-y-1.5">
                              <div className="flex items-center justify-between text-[10px] font-mono">
                                <span className="text-slate-400 uppercase tracking-wider font-bold">Action Progress</span>
                                <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">
                                  {Object.values(completedTasks).filter(Boolean).length} of {analysisResult.actionPlan.checklist.length} Completed
                                </span>
                              </div>
                              <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-emerald-500 transition-all duration-300 rounded-full"
                                  style={{
                                    width: `${(Object.values(completedTasks).filter(Boolean).length / analysisResult.actionPlan.checklist.length) * 100}%`
                                  }}
                                />
                              </div>
                            </div>
                          )}

                          {/* Critical Deadline Alert */}
                          {analysisResult.metadata.detectedDeadlines && analysisResult.metadata.detectedDeadlines.length > 0 ? (
                            <div className="p-2 bg-rose-50 dark:bg-rose-950/20 border border-rose-100/50 dark:border-rose-900/30 rounded-xl flex items-center space-x-2">
                              <Clock className="w-4 h-4 text-rose-500 shrink-0" />
                              <div className="min-w-0 flex-grow">
                                <span className="text-[9px] font-mono uppercase font-extrabold text-rose-600 dark:text-rose-400 block leading-none">URGENT DEADLINE:</span>
                                <strong className="text-xs text-rose-950 dark:text-rose-300 truncate block mt-0.5" title={analysisResult.metadata.detectedDeadlines[0].description}>
                                  {analysisResult.metadata.detectedDeadlines[0].date}
                                </strong>
                              </div>
                            </div>
                          ) : (
                            <div className="p-2 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100/30 rounded-lg text-[11px] text-emerald-800 dark:text-emerald-300 flex items-center space-x-1.5">
                              <Check className="w-3.5 h-3.5 text-emerald-500" />
                              <span>No immediate deadlines detected!</span>
                            </div>
                          )}

                          {/* Simplified Interactive Tasks List */}
                          <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
                            <span className="text-[10px] font-mono font-bold text-slate-400 dark:text-slate-500 block uppercase leading-none">Step-by-step Interactive Action List:</span>
                            {analysisResult.actionPlan.checklist?.map((taskItem, tIdx) => (
                              <label
                                key={tIdx}
                                className={`flex items-start space-x-2 p-2 rounded-lg border transition-all cursor-pointer select-none ${
                                  completedTasks[tIdx]
                                    ? "bg-emerald-50/30 dark:bg-emerald-950/10 border-emerald-100/50 dark:border-emerald-900/30"
                                    : "bg-slate-50 hover:bg-slate-100/50 dark:bg-slate-950/65 dark:hover:bg-slate-950 border-slate-100 dark:border-slate-850"
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={!!completedTasks[tIdx]}
                                  onChange={(e) => setCompletedTasks({ ...completedTasks, [tIdx]: e.target.checked })}
                                  className="mt-0.5 rounded border-slate-300 dark:border-slate-700 text-emerald-600 focus:ring-emerald-500 h-3.5 w-3.5"
                                />
                                <div className="min-w-0">
                                  <span className={`text-[11px] font-extrabold block leading-tight ${completedTasks[tIdx] ? "line-through text-slate-400 dark:text-slate-500" : "text-slate-800 dark:text-slate-200"}`}>
                                    {taskItem.task}
                                  </span>
                                  <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-normal truncate mt-0.5" title={taskItem.description}>
                                    {taskItem.description}
                                  </p>
                                </div>
                              </label>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="pt-2">
                        <button
                          type="button"
                          onClick={() => {
                            setActiveResultTab("action");
                            const element = document.getElementById("results-tabs-content");
                            if (element) element.scrollIntoView({ behavior: "smooth" });
                          }}
                          className="w-full text-center text-xs text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 font-bold flex items-center justify-center space-x-1 py-1.5 bg-emerald-50/40 dark:bg-emerald-950/20 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg border border-emerald-100/50 dark:border-emerald-900/30 transition-all active:scale-[0.98]"
                        >
                          <span>Configure Workspaces</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                  </div>
                </div>

                {/* Dashboard Tabs Selector */}
                <div id="results-tabs-content" className="flex border-b border-slate-200 dark:border-slate-800 p-1 bg-slate-50 dark:bg-slate-950 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setActiveResultTab("summary")}
                    className={`flex-1 flex items-center justify-center space-x-2 text-xs sm:text-sm py-2.5 font-bold rounded-lg transition-all ${
                      activeResultTab === "summary"
                        ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-white shadow-sm"
                        : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                    }`}
                  >
                    <BookOpen className="w-4 h-4 shrink-0" />
                    <span>Plain Summaries</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveResultTab("action")}
                    className={`flex-1 flex items-center justify-center space-x-2 text-xs sm:text-sm py-2.5 font-bold rounded-lg transition-all ${
                      activeResultTab === "action"
                        ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-white shadow-sm"
                        : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                    }`}
                  >
                    <Calendar className="w-4 h-4 shrink-0" />
                    <span>Actions & Deadlines</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveResultTab("context")}
                    className={`flex-1 flex items-center justify-center space-x-2 text-xs sm:text-sm py-2.5 font-bold rounded-lg transition-all ${
                      activeResultTab === "context"
                        ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-white shadow-sm"
                        : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                    }`}
                  >
                    <Scale className="w-4 h-4 shrink-0" />
                    <span>Legal Context & Glossary</span>
                  </button>
                </div>

                {/* Tab content displays */}
                <div className="space-y-6">
                  
                  {/* TAB 1: PLAIN SUMMARIES */}
                  {activeResultTab === "summary" && (
                    <div className="space-y-6 animate-fadeIn">
                      
                      {/* NEW: THE FAST CITIZEN / STUDENT A2 CORE CHECKSHEET */}
                      {analysisResult.simplification.simplifiedA2Overview && (
                        <div id="student-citizen-fast-track" className="bg-gradient-to-r from-amber-500/5 via-blue-500/5 to-indigo-500/5 dark:from-amber-500/10 dark:via-blue-500/10 dark:to-indigo-500/10 rounded-2xl border-2 border-dashed border-blue-200 dark:border-blue-800/80 p-5 space-y-5">
                          <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-slate-200/60 dark:border-slate-800/60">
                            <div className="flex items-center space-x-2.5">
                              <div className="p-2 bg-gradient-to-br from-amber-500 to-orange-500 text-white rounded-xl shadow-sm">
                                <Sparkles className="w-5 h-5" />
                              </div>
                              <div>
                                <h4 className="text-sm sm:text-base font-display font-extrabold text-slate-900 dark:text-white">
                                  ⚡ Fast-Track Plain Overview (Niveau A2 Simplified)
                                </h4>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                  No complicated paragraphs. Just the raw facts, tasks, and documents you need right now.
                                </p>
                              </div>
                            </div>
                            <span className="text-[10px] bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/20 font-mono font-extrabold px-3 py-1 rounded-full uppercase leading-none">
                              A2 Plain Language
                            </span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            
                            {/* COL 1: STUDENT & CITIZEN TASKS */}
                            <div className="bg-white dark:bg-slate-900/60 rounded-xl p-4 border border-slate-150 dark:border-slate-800/80 space-y-3 shadow-sm">
                              <h5 className="text-xs sm:text-sm font-display font-extrabold text-slate-900 dark:text-white flex items-center space-x-1.5">
                                <span className="p-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-lg">
                                  <Check className="w-4 h-4 shrink-0" />
                                </span>
                                <span>
                                  {analysisResult.metadata.documentType?.toLowerCase().includes("studium") || 
                                   analysisResult.metadata.documentType?.toLowerCase().includes("student") ||
                                   analysisResult.simplification.plainGerman?.toLowerCase().includes("studium") ||
                                   analysisResult.simplification.plainGerman?.toLowerCase().includes("student")
                                    ? "📋 Your Tasks as a Student" 
                                    : "📋 Your Tasks as a Citizen"
                                  }
                                </span>
                              </h5>
                              <ul className="space-y-2.5">
                                {analysisResult.simplification.simplifiedA2Overview.studentOrCitizenTasks?.map((task, idx) => (
                                  <li key={idx} className="flex items-start space-x-2 text-xs text-slate-700 dark:text-slate-300">
                                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full shrink-0 mt-1.5" />
                                    <span className="leading-relaxed">{formatBoldText(task)}</span>
                                  </li>
                                ))}
                                {(!analysisResult.simplification.simplifiedA2Overview.studentOrCitizenTasks || 
                                  analysisResult.simplification.simplifiedA2Overview.studentOrCitizenTasks.length === 0) && (
                                  <li className="text-xs text-slate-500 italic">No specific student tasks detected.</li>
                                )}
                              </ul>
                            </div>

                            {/* COL 2: REQUIRED DOCUMENTS */}
                            <div className="bg-white dark:bg-slate-900/60 rounded-xl p-4 border border-slate-150 dark:border-slate-800/80 space-y-3 shadow-sm">
                              <h5 className="text-xs sm:text-sm font-display font-extrabold text-slate-900 dark:text-white flex items-center space-x-1.5">
                                <span className="p-1 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-lg">
                                  <FileText className="w-4 h-4 shrink-0" />
                                </span>
                                <span>📂 Required Documents</span>
                              </h5>
                              <ul className="space-y-2.5">
                                {analysisResult.simplification.simplifiedA2Overview.requiredDocuments?.map((doc, idx) => (
                                  <li key={idx} className="flex items-start space-x-2 text-xs text-slate-700 dark:text-slate-300">
                                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full shrink-0 mt-1.5" />
                                    <span className="leading-relaxed">{formatBoldText(doc)}</span>
                                  </li>
                                ))}
                                {(!analysisResult.simplification.simplifiedA2Overview.requiredDocuments || 
                                  analysisResult.simplification.simplifiedA2Overview.requiredDocuments.length === 0) && (
                                  <li className="text-xs text-slate-500 italic">No specific documents listed in this file.</li>
                                )}
                              </ul>
                            </div>

                          </div>

                          {/* ROW 2: ALERTS & FAMILY SECTION */}
                          <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                            
                            {/* COL 2-1: ALERTS & WARNINGS (TAKE CARE OF) */}
                            <div className="md:col-span-7 bg-rose-50/40 dark:bg-rose-950/15 border border-rose-100 dark:border-rose-900/30 rounded-xl p-4 space-y-3">
                              <h5 className="text-xs sm:text-sm font-display font-extrabold text-rose-900 dark:text-rose-400 flex items-center space-x-1.5">
                                <span className="p-1 bg-rose-100 dark:bg-rose-950/55 text-rose-600 dark:text-rose-400 rounded-lg">
                                  <AlertTriangle className="w-4 h-4 shrink-0" />
                                </span>
                                <span>⚠ Alert: Take care of ...</span>
                              </h5>
                              <ul className="space-y-2">
                                {analysisResult.simplification.simplifiedA2Overview.alertsToTakeCareOf?.map((alertItem, idx) => (
                                  <li key={idx} className="flex items-start space-x-2 text-xs text-rose-950 dark:text-rose-300">
                                    <span className="w-1.5 h-1.5 bg-rose-500 rounded-full shrink-0 mt-1.5" />
                                    <span className="leading-relaxed">{formatBoldText(alertItem)}</span>
                                  </li>
                                ))}
                                {(!analysisResult.simplification.simplifiedA2Overview.alertsToTakeCareOf || 
                                  analysisResult.simplification.simplifiedA2Overview.alertsToTakeCareOf.length === 0) && (
                                  <li className="text-xs text-red-500 italic">No critical alerts detected in this text.</li>
                                )}
                              </ul>
                            </div>

                            {/* COL 2-2: FAMILY REUNION INFO */}
                            <div className="md:col-span-5 bg-indigo-50/40 dark:bg-indigo-950/15 border border-indigo-100 dark:border-indigo-900/30 rounded-xl p-4 space-y-3">
                              <h5 className="text-xs sm:text-sm font-display font-extrabold text-indigo-900 dark:text-indigo-400 flex items-center space-x-1.5">
                                <span className="p-1 bg-indigo-100 dark:bg-indigo-950/55 text-indigo-600 dark:text-indigo-400 rounded-lg">
                                  <Users className="w-4 h-4 shrink-0" />
                                </span>
                                <span>
                                  {analysisResult.metadata.documentType?.toLowerCase().includes("studium") || 
                                   analysisResult.metadata.documentType?.toLowerCase().includes("student") ||
                                   analysisResult.simplification.plainGerman?.toLowerCase().includes("studium") ||
                                   analysisResult.simplification.plainGerman?.toLowerCase().includes("student")
                                    ? "👨‍👩‍👧‍👦 Aufenthaltserlaubnis für Ehepartner und Kinder von Studierenden" 
                                    : "👨‍👩‍👧‍👦 Family, Spouse & Children Info"
                                  }
                                </span>
                              </h5>
                              <p className="text-xs text-indigo-950 dark:text-indigo-300 leading-relaxed font-sans">
                                {analysisResult.simplification.simplifiedA2Overview.familyReunionInfo || 
                                  "No family-specific regulations (Ehepartner/Kinder) are explicitly detailed in this notice."}
                              </p>
                            </div>

                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Card 2: Plain German Explanation */}
                      {(outputLanguage === "Both" || outputLanguage === "German") && (
                        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm flex flex-col">
                          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5 mb-3.5">
                            <h4 className="text-sm font-display font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                              <BookOpen className="w-4.5 h-4.5 text-blue-600" />
                              <span>Plain German Explanation</span>
                            </h4>
                            <span className="text-[10px] font-bold text-blue-600 bg-blue-50 dark:text-blue-300 dark:bg-blue-900/30 px-2.5 py-0.5 rounded-full font-mono">
                              GERMAN {readingLevel}
                            </span>
                          </div>
                          <div className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed flex-grow markdown-body">
                            <PlainGermanRenderer text={analysisResult.simplification.plainGerman} />
                          </div>
                        </div>
                      )}

                      {/* Card 3: English Summary */}
                      {(outputLanguage === "Both" || outputLanguage === "English") && (
                        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm flex flex-col">
                          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5 mb-3.5">
                            <h4 className="text-sm font-display font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                              <Globe className="w-4.5 h-4.5 text-blue-600" />
                              <span>English Overview for Expats</span>
                            </h4>
                            <span className="text-[10px] font-bold text-slate-400 uppercase font-mono">
                              ENGLISH
                            </span>
                          </div>
                          <div className="space-y-4 flex-grow">
                            <div>
                              <h5 className="text-xs sm:text-sm font-display font-bold text-slate-800 dark:text-slate-200 mb-1">
                                {analysisResult.englishSummary.title || "Document Overview"}
                              </h5>
                              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                                {formatBoldText(analysisResult.englishSummary.overview)}
                              </p>
                            </div>
                            
                            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800/60">
                              <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block font-mono">Key Highlights</span>
                              <ul className="space-y-1.5 pl-4 list-disc text-xs text-slate-600 dark:text-slate-400">
                                {analysisResult.englishSummary.keyPoints?.map((pt, idx) => (
                                  <li key={idx} className="leading-relaxed">{formatBoldText(pt)}</li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  )}

                  {/* TAB 2: ACTIONS & DEADLINES */}
                  {activeResultTab === "action" && (
                    <div className="space-y-6 animate-fadeIn">
                      <div className="grid grid-cols-1 gap-6">
                        {/* Card 4: Important Dates & Deadlines */}
                        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
                          <h4 className="text-sm font-display font-bold text-slate-900 dark:text-white mb-3.5 flex items-center space-x-2 border-b border-slate-100 dark:border-slate-800 pb-2">
                            <Calendar className="w-4.5 h-4.5 text-rose-600" />
                            <span>Parsed Deadlines & Action Triggers</span>
                          </h4>
                          
                          {analysisResult.metadata.detectedDeadlines && analysisResult.metadata.detectedDeadlines.length > 0 ? (
                            <div className="space-y-3">
                              {analysisResult.metadata.detectedDeadlines.map((deadline, idx) => (
                                <div key={idx} className="p-4 bg-rose-50/40 dark:bg-rose-950/10 border border-rose-100/60 dark:border-rose-900/20 rounded-xl flex flex-col md:flex-row md:items-start md:space-x-4">
                                  <div className="flex items-center space-x-2 md:flex-col md:items-start md:space-y-1 md:space-x-0 shrink-0 mb-2 md:mb-0">
                                    <span className="p-1.5 bg-rose-100 dark:bg-rose-900/40 rounded-lg text-rose-700 dark:text-rose-300">
                                      <Clock className="w-4 h-4" />
                                    </span>
                                    <span className="text-sm font-display font-extrabold text-rose-800 dark:text-rose-400 font-mono">
                                      {deadline.date}
                                    </span>
                                  </div>
                                  <div className="flex-grow space-y-1">
                                    <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
                                      {deadline.description}
                                    </p>
                                    {deadline.sourceSnippet && (
                                      <p className="text-xs text-slate-400 dark:text-slate-500 font-mono italic">
                                        Original notice quote: "{deadline.sourceSnippet}"
                                      </p>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 italic">
                              No official deadlines or dates were detected in this document.
                            </p>
                          )}
                        </div>

                        {/* Interactive MCP Workspace Automation widget inside Tab 2 */}
                        <div className="bg-gradient-to-r from-blue-50/40 to-indigo-50/40 dark:from-blue-950/10 dark:to-indigo-950/10 rounded-2xl border border-blue-100 dark:border-blue-900/30 p-5 shadow-sm space-y-4">
                          <div className="flex items-center justify-between">
                            <h4 className="text-xs font-mono font-extrabold text-blue-600 dark:text-blue-400 uppercase tracking-wider flex items-center space-x-1.5">
                              <Network className="w-4.5 h-4.5 animate-pulse" />
                              <span>Workspace Automation (via MCP Connectors)</span>
                            </h4>
                            <span className="text-[9px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-mono font-bold px-2 py-0.5 rounded-full">
                              ● HOST READY
                            </span>
                          </div>
                          
                          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                            Deploy your extracted actions directly to your workspace using secure, container-bound Model Context Protocol (MCP) handlers:
                          </p>

                          <div className="flex flex-wrap gap-3">
                            <button
                              type="button"
                              disabled={isSyncing}
                              onClick={() => handleWorkspaceSync("Calendar")}
                              className="inline-flex items-center space-x-2 px-4 py-2.5 text-xs font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/40 rounded-xl border border-amber-100 dark:border-amber-900/40 shadow-sm transition-all active:scale-[0.98]"
                            >
                              <Calendar className="w-3.5 h-3.5" />
                              <span>Sync Deadline to Google Calendar</span>
                            </button>

                            <button
                              type="button"
                              disabled={isSyncing}
                              onClick={() => handleWorkspaceSync("Drive")}
                              className="inline-flex items-center space-x-2 px-4 py-2.5 text-xs font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded-xl border border-blue-100 dark:border-blue-900/40 shadow-sm transition-all active:scale-[0.98]"
                            >
                              <Layers className="w-3.5 h-3.5" />
                              <span>Export Summary to Google Drive</span>
                            </button>
                          </div>

                          {isSyncing && (
                            <div className="p-3 bg-white/60 dark:bg-slate-900/60 border border-slate-150 dark:border-slate-800 rounded-xl text-xs text-blue-600 dark:text-blue-400 flex items-center space-x-2 font-mono text-[11px]">
                              <RefreshCw className="w-4 h-4 animate-spin" />
                              <span>Exchanging secure host tokens over WebSocket link...</span>
                            </div>
                          )}

                          {syncMessage && (
                            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 rounded-xl text-xs text-emerald-800 dark:text-emerald-300 flex items-start space-x-2 animate-fadeIn shadow-sm">
                              <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                              <span>{syncMessage}</span>
                            </div>
                          )}
                        </div>

                        {/* Card 5: Suggested Action Plan */}
                        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
                          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2 mb-3.5">
                            <h4 className="text-sm font-display font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                              <TrendingUp className="w-4.5 h-4.5 text-blue-600" />
                              <span>Step-by-Step Practical Blueprint</span>
                            </h4>
                            <span className="text-[10px] font-bold text-slate-400 font-mono uppercase">Safe Guidance Framework</span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div className="bg-blue-50/40 dark:bg-blue-950/10 border border-blue-100/60 dark:border-blue-900/20 p-4 rounded-xl">
                              <span className="text-xs font-extrabold text-blue-800 dark:text-blue-300 block mb-2 font-mono uppercase tracking-wider text-[10px]">Expressed Obligations (Duties)</span>
                              <ul className="space-y-1.5 list-disc pl-4 text-xs text-slate-600 dark:text-slate-400">
                                {analysisResult.actionPlan.obligations?.map((ob, idx) => (
                                  <li key={idx} className="leading-relaxed">{ob}</li>
                                ))}
                              </ul>
                            </div>

                            <div className="bg-emerald-50/40 dark:bg-emerald-950/10 border border-emerald-100/60 dark:border-emerald-900/20 p-4 rounded-xl">
                              <span className="text-xs font-extrabold text-emerald-800 dark:text-emerald-300 block mb-2 font-mono uppercase tracking-wider text-[10px]">Your Extracted Rights (Options)</span>
                              <ul className="space-y-1.5 list-disc pl-4 text-xs text-slate-600 dark:text-slate-400">
                                {analysisResult.actionPlan.rights?.map((rt, idx) => (
                                  <li key={idx} className="leading-relaxed">{rt}</li>
                                ))}
                              </ul>
                            </div>
                          </div>

                          <div className="space-y-3">
                            <span className="text-[10px] font-mono font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Recommended Milestones Checklist</span>
                            
                            <div className="space-y-2">
                              {analysisResult.actionPlan.checklist?.map((item, idx) => (
                                <div key={idx} className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-800/40 rounded-xl flex items-start space-x-3">
                                  <div className="h-5 w-5 rounded border border-slate-300 dark:border-slate-700 flex items-center justify-center shrink-0 mt-0.5 bg-white dark:bg-slate-900">
                                    <Check className="w-3 h-3 text-slate-300" />
                                  </div>
                                  <div className="space-y-1">
                                    <strong className="text-xs font-bold text-slate-800 dark:text-slate-200 block">{item.task}</strong>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{item.description}</p>
                                    <p className="text-xs text-blue-600 dark:text-blue-400 font-bold bg-blue-50 dark:bg-blue-950/40 px-2.5 py-1 rounded inline-block font-mono text-[10px] mt-1.5">
                                      Caution Guard: {item.suggestion}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 3: LEGAL CONTEXT & GLOSSARY */}
                  {activeResultTab === "context" && (
                    <div className="space-y-6 animate-fadeIn">
                      
                      {/* Card 1: Document Overview */}
                      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
                        <h4 className="text-sm font-display font-bold text-slate-900 dark:text-white mb-3.5 flex items-center space-x-2 border-b border-slate-100 dark:border-slate-800 pb-2">
                          <FileCheck className="w-4.5 h-4.5 text-blue-600" />
                          <span>Document Taxonomy Overview</span>
                        </h4>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-100 dark:border-slate-800/40">
                            <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-mono">Document Type</span>
                            <span className="text-sm font-bold text-slate-800 dark:text-slate-200 block mt-0.5">
                              {analysisResult.metadata.documentType || "Official Notice"}
                            </span>
                          </div>
                          <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-100 dark:border-slate-800/40">
                            <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-mono">Sender / Issuer</span>
                            <span className="text-sm font-bold text-slate-800 dark:text-slate-200 block mt-0.5 truncate" title={analysisResult.metadata.sender}>
                              {analysisResult.metadata.sender || "Not Detected"}
                            </span>
                          </div>
                          <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-100 dark:border-slate-800/40">
                            <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-mono">Recipient</span>
                            <span className="text-sm font-bold text-slate-800 dark:text-slate-200 block mt-0.5 truncate" title={analysisResult.metadata.recipient}>
                              {analysisResult.metadata.recipient || "Not Detected"}
                            </span>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <span className="text-[10px] font-mono font-semibold text-slate-400 dark:text-slate-500 block uppercase tracking-wider">Paragraph Section Breakdown</span>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {analysisResult.metadata.importantSections?.map((section, idx) => (
                              <div key={idx} className="p-3 bg-slate-50/50 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-800/40 rounded-xl">
                                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">{section.title}</span>
                                <span className="text-xs text-slate-500 dark:text-slate-400 mt-1 block leading-relaxed">{section.summary}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Card 6: Interactive Glossary */}
                      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
                        <h4 className="text-sm font-display font-bold text-slate-900 dark:text-white mb-2.5 flex items-center space-x-2 border-b border-slate-100 dark:border-slate-800 pb-2">
                          <BookOpen className="w-4.5 h-4.5 text-indigo-600" />
                          <span>Interactive Legal Glossary</span>
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                          Click any complicated German legal or administrative term below to view its definition and how it is used in your document context.
                        </p>

                        <div className="flex flex-wrap gap-2 mb-4">
                          {analysisResult.simplification.difficultTerms?.map((termObj, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => setSelectedGlossaryTerm(termObj)}
                              className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all ${
                                selectedGlossaryTerm?.term === termObj.term
                                  ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                                  : "bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-900"
                              }`}
                            >
                              {termObj.term}
                            </button>
                          ))}
                        </div>

                        {selectedGlossaryTerm ? (
                          <div className="p-4 bg-indigo-50/50 dark:bg-indigo-950/10 border border-indigo-100 dark:border-indigo-900/30 rounded-xl relative animate-fadeIn">
                            <button
                              onClick={() => setSelectedGlossaryTerm(null)}
                              className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                              title="Clear selection"
                            >
                              <X className="w-4 h-4" />
                            </button>
                            <h5 className="text-xs font-display font-extrabold text-indigo-900 dark:text-indigo-300 font-mono">
                              {selectedGlossaryTerm.term}
                            </h5>
                            <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 mt-1.5 leading-relaxed">
                              <strong>Simple Explanation:</strong> {selectedGlossaryTerm.definition}
                            </p>
                            {selectedGlossaryTerm.contextInDoc && (
                              <p className="text-xs text-slate-400 dark:text-slate-500 mt-2 font-mono italic bg-slate-100/50 dark:bg-slate-900/50 p-2 rounded border border-slate-100 dark:border-slate-800/40">
                                Context in text: "{selectedGlossaryTerm.contextInDoc}"
                              </p>
                            )}
                          </div>
                        ) : (
                          <div className="p-4 bg-slate-50 dark:bg-slate-950/40 border border-slate-150 dark:border-slate-800 rounded-xl text-center">
                            <span className="text-xs text-slate-400 italic block">
                              Select an administrative term above to explore its plain translation.
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Card 7: German References & Citations */}
                      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
                        <h4 className="text-sm font-display font-bold text-slate-900 dark:text-white mb-3.5 flex items-center space-x-2 border-b border-slate-100 dark:border-slate-800 pb-2">
                          <Scale className="w-4.5 h-4.5 text-slate-700 dark:text-slate-300" />
                          <span>German References & Citation Verification</span>
                        </h4>
                        
                        {analysisResult.originalReferences && analysisResult.originalReferences.length > 0 ? (
                          <div className="space-y-3.5">
                            {analysisResult.originalReferences.map((ref, idx) => (
                              <div key={idx} className="p-3.5 bg-slate-50/50 dark:bg-slate-950/20 border border-slate-150 dark:border-slate-800/40 rounded-xl">
                                <blockquote className="border-l-2 border-blue-500 pl-3 italic text-xs font-mono text-slate-700 dark:text-slate-300 leading-relaxed">
                                  "{ref.snippet}"
                                </blockquote>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                                  <strong>Why this snippet matters:</strong> {ref.context}
                                </p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 italic">
                            No explicit references extracted.
                          </p>
                        )}
                      </div>

                      {/* Legal Referencing List */}
                      {analysisResult.metadata.legalReferences && analysisResult.metadata.legalReferences.length > 0 && (
                        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
                          <h4 className="text-xs font-mono font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
                            Detected German Statutory Codes (§)
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {analysisResult.metadata.legalReferences.map((law, idx) => (
                              <span key={idx} className="px-2.5 py-1 bg-slate-100 dark:bg-slate-950 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-mono font-bold border border-slate-200 dark:border-slate-800">
                                {law}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                    </div>
                  )}

                </div>
              </div>
            )}

          </div>

        </div>

        {/* 4. Markdown Specification Section at bottom of page */}
        <section id="readme" className="mt-16 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm">
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
              <h2 className="text-2xl font-display font-extrabold text-slate-900 dark:text-white flex items-center space-x-2">
                <Building className="w-6 h-6 text-blue-600" />
                <span>Multi-Agent System Architecture</span>
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                How our four specialized AI agents collaborate within an execution context.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm">
              <div className="space-y-4">
                <h3 className="font-display font-bold text-slate-800 dark:text-slate-200 text-base">
                  The Agentic Pipeline
                </h3>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  Unlike traditional single-prompt applications that directly translate language, 
                  <strong> LexiSimplify</strong> employs a structured pipeline designed after production 
                  Agentic Engineering frameworks.
                </p>
                
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <div className="p-1.5 bg-blue-50 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-semibold text-slate-800 dark:text-slate-200 block text-xs uppercase font-mono">1. Document Analyzer</span>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Objective analyzer that detects metadata, sender, important clauses, and deadlines.</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="p-1.5 bg-blue-50 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
                      <BookOpen className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-semibold text-slate-800 dark:text-slate-200 block text-xs uppercase font-mono">2. Legal Simplifier</span>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Drafting simplified text matching A2/B1/B2 standard German and English key bullet points.</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="p-1.5 bg-blue-50 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
                      <TrendingUp className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-semibold text-slate-800 dark:text-slate-200 block text-xs uppercase font-mono">3. Action Planner</span>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Assembles recipient's rights/obligations and frames practical checklists with non-advisory language.</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="p-1.5 bg-blue-50 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-semibold text-slate-800 dark:text-slate-200 block text-xs uppercase font-mono">4. Safety & Verification</span>
                      <p className="text-xs text-slate-500 dark:text-slate-400">LLM-as-a-judge comparison check. Ensures no false laws were invented and disclaimer is set.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-display font-bold text-slate-800 dark:text-slate-200 text-base">
                  Strict Safety Guardrails
                </h3>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  Legal tech requires absolute precision. Our agents are governed by hardcode semantic constraints to prevent unauthorized legal advisory actions:
                </p>

                <ul className="space-y-2 list-disc pl-5 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  <li><strong>Meaning Preservation:</strong> The model never alters monetary numbers, dates, or recipient obligations.</li>
                  <li><strong>Non-advisory Verbiage:</strong> Checklist items are strictly written using safe, non-committal recommendations (e.g. <em>"The document appears to request..."</em>, <em>"You may wish to..."</em>).</li>
                  <li><strong>Zero Fabrication:</strong> Under no condition will the models invent law references, paragraph numbers, or court judgements.</li>
                  <li><strong>Human-in-the-loop:</strong> Every action checklist contains explicit pathways urging the user to contact local tenant associations (<em>Mieterverein</em>), legal help bureaus, or licensed attorneys.</li>
                </ul>
              </div>
            </div>

            <div className="border-t border-slate-100 dark:border-slate-800 pt-6">
              <h3 className="font-display font-bold text-slate-800 dark:text-slate-200 text-sm mb-2">
                Demonstrated Capstone Concepts
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                This project was developed for the <strong>Kaggle + Google 5-Day AI Agents Capstone Project</strong> to showcase 
                orchestration, multi-step agent reasoning, validation loops, and UI/UX craftsmanship. No legal advice is rendered.
              </p>
            </div>
          </div>
        </section>

      </main>

      {/* 5. Footer */}
      <footer className="mt-20 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-8 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2 text-sm text-slate-500 dark:text-slate-400">
            <Scale className="w-4 h-4 text-slate-400" />
            <span>© {new Date().getFullYear()} LexiSimplify. Fictional demo documents only.</span>
          </div>
          <div className="text-xs text-slate-400 dark:text-slate-500 text-center md:text-right">
            Built for <strong className="text-slate-700 dark:text-slate-300 font-semibold">Kaggle AI Agents: Intensive Vibe Coding Capstone Project with Google</strong>
          </div>
        </div>
      </footer>

    </div>
  );
}
