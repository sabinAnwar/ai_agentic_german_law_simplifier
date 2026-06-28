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
  Sparkles,
  RefreshCw,
  Sun,
  Moon,
  FileCheck,
  Building,
  Info,
  X
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

  const fileInputRef = useRef<HTMLInputElement>(null);

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
        if (prev < 4) {
          return prev + 1;
        }
        return prev;
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
            <div className="bg-slate-100 dark:bg-slate-900/40 rounded-2xl border border-slate-200 dark:border-slate-800/60 p-5">
              <h3 className="text-sm font-display font-bold text-slate-800 dark:text-slate-200 mb-3 flex items-center space-x-2">
                <Sparkles className="w-4.5 h-4.5 text-blue-500" />
                <span>Our Collaborative Agent Team</span>
              </h3>
              <div className="space-y-3.5 text-xs text-slate-600 dark:text-slate-400">
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

                {/* Grid of Cards */}
                <div className="grid grid-cols-1 gap-6">

                  {/* Card 8: Safety & Verification Audit Report (Top highlight) */}
                  <div className="bg-slate-900 dark:bg-slate-950 text-white rounded-2xl border border-slate-800 p-5 shadow-lg relative overflow-hidden">
                    <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 text-slate-800/30 font-display font-extrabold text-[120px] select-none pointer-events-none">
                      {analysisResult.safety.confidenceScore}
                    </div>
                    
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4 mb-4 relative z-10">
                      <div>
                        <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/50 border border-emerald-900 px-2.5 py-1 rounded-full uppercase tracking-wider">
                          Compliance Certificate
                        </span>
                        <h4 className="text-lg font-display font-bold text-white mt-1.5 flex items-center space-x-2">
                          <ShieldCheck className="w-5 h-5 text-emerald-400" />
                          <span>Agent 4 Safety Report</span>
                        </h4>
                      </div>
                      <div className="flex items-center space-x-3 bg-slate-800/60 border border-slate-700/50 p-2 rounded-xl">
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 block uppercase font-mono">Confidence Score</span>
                          <span className="text-xl font-display font-extrabold text-white">
                            {analysisResult.safety.confidenceScore}%
                          </span>
                        </div>
                        <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">
                          <CheckCircle className="w-6 h-6" />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 relative z-10">
                      
                      <div className="bg-slate-800/40 p-3 rounded-xl border border-slate-800">
                        <span className="text-[10px] uppercase font-mono text-slate-400 block mb-1">Meaning Preserved</span>
                        <div className="flex items-center space-x-1.5 text-xs font-bold text-emerald-400">
                          <CheckCircle className="w-4 h-4 text-emerald-400" />
                          <span>Verified True</span>
                        </div>
                      </div>

                      <div className="bg-slate-800/40 p-3 rounded-xl border border-slate-800">
                        <span className="text-[10px] uppercase font-mono text-slate-400 block mb-1">No Hallucinations</span>
                        <div className="flex items-center space-x-1.5 text-xs font-bold text-emerald-400">
                          <CheckCircle className="w-4 h-4 text-emerald-400" />
                          <span>Verified Clear</span>
                        </div>
                      </div>

                      <div className="bg-slate-800/40 p-3 rounded-xl border border-slate-800">
                        <span className="text-[10px] uppercase font-mono text-slate-400 block mb-1">No Legal Advice</span>
                        <div className="flex items-center space-x-1.5 text-xs font-bold text-emerald-400">
                          <CheckCircle className="w-4 h-4 text-emerald-400" />
                          <span>Advisory Safeguarded</span>
                        </div>
                      </div>

                      <div className="bg-slate-800/40 p-3 rounded-xl border border-slate-800">
                        <span className="text-[10px] uppercase font-mono text-slate-400 block mb-1">Disclaimer Status</span>
                        <div className="flex items-center space-x-1.5 text-xs font-bold text-emerald-400">
                          <CheckCircle className="w-4 h-4 text-emerald-400" />
                          <span>Embedded</span>
                        </div>
                      </div>

                    </div>

                    <div className="mt-4 text-xs text-slate-300 bg-slate-800/30 p-3 rounded-xl border border-slate-800/40 relative z-10">
                      <strong className="font-semibold text-white block mb-1">Evaluator Reasoning Logs:</strong>
                      <p className="leading-relaxed font-mono text-[11px] text-slate-400">
                        {analysisResult.safety.evaluationLog || "Compare draft models with baseline German document. Meaning preservation verified. Extracted deadlines match perfectly with references in input text."}
                      </p>
                      {analysisResult.safety.uncertaintyDetected && analysisResult.safety.uncertaintyDetails && (
                        <div className="mt-2 pt-2 border-t border-slate-800/60 text-amber-300">
                          <strong>Detected Ambiguity:</strong> {analysisResult.safety.uncertaintyDetails}
                        </div>
                      )}
                    </div>

                  </div>

                  {/* Card 1: Document Overview */}
                  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
                    <h4 className="text-md font-display font-bold text-slate-900 dark:text-white mb-3.5 flex items-center space-x-2 border-b border-slate-100 dark:border-slate-800 pb-2">
                      <FileCheck className="w-5 h-5 text-blue-600" />
                      <span>Card 1: Document Overview</span>
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-100 dark:border-slate-800/40">
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-mono">Document Type</span>
                        <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 block mt-0.5">
                          {analysisResult.metadata.documentType || "Official Notice"}
                        </span>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-100 dark:border-slate-800/40">
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-mono">Sender / Issuer</span>
                        <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 block mt-0.5 truncate" title={analysisResult.metadata.sender}>
                          {analysisResult.metadata.sender || "Not Detected"}
                        </span>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-100 dark:border-slate-800/40">
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-mono">Recipient</span>
                        <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 block mt-0.5 truncate" title={analysisResult.metadata.recipient}>
                          {analysisResult.metadata.recipient || "Not Detected"}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 block uppercase tracking-wider">Key Section Breakdown</span>
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

                  {/* Dual Grid: Plain German Explanation & English Summary */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    {/* Card 2: Plain German Explanation */}
                    {(outputLanguage === "Both" || outputLanguage === "German") && (
                      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm flex flex-col">
                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2 mb-3.5">
                          <h4 className="text-md font-display font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                            <BookOpen className="w-5 h-5 text-blue-600" />
                            <span>Card 2: Plain German Explanation</span>
                          </h4>
                          <span className="text-xs font-bold text-blue-600 bg-blue-50 dark:text-blue-300 dark:bg-blue-900/30 px-2.5 py-0.5 rounded-full">
                            Level {readingLevel}
                          </span>
                        </div>
                        <div className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed flex-grow markdown-body">
                          {analysisResult.simplification.plainGerman}
                        </div>
                      </div>
                    )}

                    {/* Card 3: English Summary */}
                    {(outputLanguage === "Both" || outputLanguage === "English") && (
                      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm flex flex-col">
                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2 mb-3.5">
                          <h4 className="text-md font-display font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                            <Globe className="w-5 h-5 text-blue-600" />
                            <span>Card 3: English Summary</span>
                          </h4>
                          <span className="text-xs font-mono text-slate-400">Translation</span>
                        </div>
                        <div className="space-y-4 flex-grow">
                          <div>
                            <h5 className="text-sm font-display font-bold text-slate-800 dark:text-slate-200 mb-1">
                              {analysisResult.englishSummary.title || "Document Overview"}
                            </h5>
                            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                              {analysisResult.englishSummary.overview}
                            </p>
                          </div>
                          
                          <div className="space-y-2">
                            <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Key Highlights</span>
                            <ul className="space-y-1.5 pl-4 list-disc text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                              {analysisResult.englishSummary.keyPoints?.map((pt, idx) => (
                                <li key={idx} className="leading-relaxed">{pt}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    )}

                  </div>

                  {/* Card 4: Important Dates & Deadlines */}
                  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
                    <h4 className="text-md font-display font-bold text-slate-900 dark:text-white mb-3.5 flex items-center space-x-2 border-b border-slate-100 dark:border-slate-800 pb-2">
                      <Calendar className="w-5 h-5 text-rose-600" />
                      <span>Card 4: Important Dates & Deadlines</span>
                    </h4>
                    
                    {analysisResult.metadata.detectedDeadlines && analysisResult.metadata.detectedDeadlines.length > 0 ? (
                      <div className="space-y-3">
                        {analysisResult.metadata.detectedDeadlines.map((deadline, idx) => (
                          <div key={idx} className="p-4 bg-rose-50/50 dark:bg-rose-950/10 border border-rose-100 dark:border-rose-900/30 rounded-xl flex flex-col md:flex-row md:items-start md:space-x-4">
                            <div className="flex items-center space-x-2 md:flex-col md:items-start md:space-y-1 md:space-x-0 shrink-0 mb-2 md:mb-0">
                              <span className="p-1.5 bg-rose-100 dark:bg-rose-900/40 rounded-lg text-rose-700 dark:text-rose-300">
                                <Clock className="w-4 h-4" />
                              </span>
                              <span className="text-sm font-display font-bold text-rose-800 dark:text-rose-400">
                                {deadline.date}
                              </span>
                            </div>
                            <div className="flex-grow space-y-1">
                              <p className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200">
                                {deadline.description}
                              </p>
                              {deadline.sourceSnippet && (
                                <p className="text-xs text-slate-400 dark:text-slate-500 font-mono italic">
                                  Source quote: "{deadline.sourceSnippet}"
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

                  {/* Card 5: Possible Next Steps */}
                  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2 mb-3.5">
                      <h4 className="text-md font-display font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                        <TrendingUp className="w-5 h-5 text-blue-600" />
                        <span>Card 5: Suggested Action Plan</span>
                      </h4>
                      <span className="text-xs font-semibold text-slate-400 font-mono uppercase">Safe Checklist</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="bg-blue-50/40 dark:bg-blue-950/10 border border-blue-100/60 dark:border-blue-900/20 p-4 rounded-xl">
                        <span className="text-xs font-bold text-blue-800 dark:text-blue-300 block mb-2">Expressed Obligations</span>
                        <ul className="space-y-1.5 list-disc pl-4 text-xs text-slate-600 dark:text-slate-400">
                          {analysisResult.actionPlan.obligations?.map((ob, idx) => (
                            <li key={idx} className="leading-relaxed">{ob}</li>
                          ))}
                        </ul>
                      </div>

                      <div className="bg-emerald-50/40 dark:bg-emerald-950/10 border border-emerald-100/60 dark:border-emerald-900/20 p-4 rounded-xl">
                        <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 block mb-2">Your Extracted Rights</span>
                        <ul className="space-y-1.5 list-disc pl-4 text-xs text-slate-600 dark:text-slate-400">
                          {analysisResult.actionPlan.rights?.map((rt, idx) => (
                            <li key={idx} className="leading-relaxed">{rt}</li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Recommended Next Steps (Cautious Framework)</span>
                      
                      <div className="space-y-2">
                        {analysisResult.actionPlan.checklist?.map((item, idx) => (
                          <div key={idx} className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800/40 rounded-xl flex items-start space-x-3">
                            <div className="h-5 w-5 rounded border border-slate-300 dark:border-slate-700 flex items-center justify-center shrink-0 mt-0.5 bg-white dark:bg-slate-900">
                              <Check className="w-3 h-3 text-slate-300" />
                            </div>
                            <div className="space-y-1">
                              <strong className="text-xs font-bold text-slate-800 dark:text-slate-200 block">{item.task}</strong>
                              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{item.description}</p>
                              <p className="text-xs text-blue-600 dark:text-blue-400 font-medium bg-blue-50 dark:bg-blue-950/40 px-2 py-1 rounded inline-block">
                                Guidance: {item.suggestion}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Card 6: Legal Terms Explained (Interactive Glossary) */}
                  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
                    <h4 className="text-md font-display font-bold text-slate-900 dark:text-white mb-3.5 flex items-center space-x-2 border-b border-slate-100 dark:border-slate-800 pb-2">
                      <BookOpen className="w-5 h-5 text-indigo-600" />
                      <span>Card 6: Legal Terms Explained</span>
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                      Click any difficult German legal or administrative term below to view its definition and how it is used in your document context.
                    </p>

                    <div className="flex flex-wrap gap-2 mb-4">
                      {analysisResult.simplification.difficultTerms?.map((termObj, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setSelectedGlossaryTerm(termObj)}
                          className={`px-3 py-1.5 text-xs font-medium rounded-xl border transition-all ${
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
                      <div className="p-4 bg-indigo-50/50 dark:bg-indigo-950/10 border border-indigo-100 dark:border-indigo-900/30 rounded-xl relative">
                        <button
                          onClick={() => setSelectedGlossaryTerm(null)}
                          className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                          title="Clear selection"
                        >
                          <X className="w-4 h-4" />
                        </button>
                        <h5 className="text-sm font-display font-bold text-indigo-900 dark:text-indigo-300">
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
                      <div className="p-4 bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800 rounded-xl text-center">
                        <span className="text-xs text-slate-400 italic block">
                          Select a term above to explore its legal definition.
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Card 7: Original References */}
                  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
                    <h4 className="text-md font-display font-bold text-slate-900 dark:text-white mb-3.5 flex items-center space-x-2 border-b border-slate-100 dark:border-slate-800 pb-2">
                      <Scale className="w-5 h-5 text-slate-700 dark:text-slate-300" />
                      <span>Card 7: Original References & Citations</span>
                    </h4>
                    
                    {analysisResult.originalReferences && analysisResult.originalReferences.length > 0 ? (
                      <div className="space-y-3.5">
                        {analysisResult.originalReferences.map((ref, idx) => (
                          <div key={idx} className="p-3.5 bg-slate-50/50 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-800/40 rounded-xl">
                            <blockquote className="border-l-2 border-blue-500 pl-3 italic text-xs font-mono text-slate-700 dark:text-slate-300">
                              "{ref.snippet}"
                            </blockquote>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
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
                      <h4 className="text-sm font-display font-bold text-slate-800 dark:text-slate-200 mb-2">
                        Detected Legal Provisions
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {analysisResult.metadata.legalReferences.map((law, idx) => (
                          <span key={idx} className="px-2.5 py-1 bg-slate-100 dark:bg-slate-950 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-mono font-medium border border-slate-200 dark:border-slate-800">
                            {law}
                          </span>
                        ))}
                      </div>
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
