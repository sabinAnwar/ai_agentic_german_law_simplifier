export interface AgentLog {
  agentName: string;
  timestamp: string;
  message: string;
  status: 'idle' | 'running' | 'success' | 'error';
  thoughts?: string;
}

export interface DocumentMetadata {
  documentType: string;
  sender: string;
  recipient: string;
  importantSections: Array<{ title: string; summary: string }>;
  detectedDeadlines: Array<{ date: string; description: string; sourceSnippet: string }>;
  legalReferences: string[];
}

export interface LegalSimplification {
  plainGerman: string;
  difficultTerms: Array<{ term: string; definition: string; contextInDoc: string }>;
}

export interface ActionPlan {
  obligations: string[];
  rights: string[];
  risks: string[];
  checklist: Array<{ task: string; description: string; suggestion: string }>;
}

export interface SafetyVerification {
  meaningPreserved: boolean;
  meaningPreservationReasoning: string;
  noHallucinations: boolean;
  hallucinationDetails?: string;
  noLegalAdviceGiven: boolean;
  disclaimerIncluded: boolean;
  uncertaintyDetected: boolean;
  uncertaintyDetails?: string;
  confidenceScore: number; // 0-100
  evaluationLog: string;
}

export interface AnalysisResult {
  metadata: DocumentMetadata;
  simplification: LegalSimplification;
  englishSummary: {
    title: string;
    overview: string;
    keyPoints: string[];
  };
  actionPlan: ActionPlan;
  safety: SafetyVerification;
  originalReferences: Array<{ snippet: string; context: string }>;
}

export interface AnalysisResponse {
  success: boolean;
  result?: AnalysisResult;
  error?: string;
  agentLogs: AgentLog[];
}
