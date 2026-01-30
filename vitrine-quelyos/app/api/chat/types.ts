/**
 * Types partagés pour l'API Chat Assistant
 */

export interface ChatMessage {
  type: 'bot' | 'user';
  text: string;
  suggestions?: string[];
  timestamp?: Date | string;
}

export interface ChatRequest {
  message: string;
  history?: ChatMessage[];
  sessionId?: string;
  metadata?: {
    page?: string;
    userAgent?: string;
    referrer?: string;
    timestamp?: string;
  };
}

export interface ChatResponse {
  response: string;
  suggestions?: string[];
  confidence: number;
  intent?: string;
  requiresHuman?: boolean;
  metadata?: {
    processingTime?: number;
    model?: string;
    version?: string;
  };
}

export interface KnowledgeBaseEntry {
  keywords: string[];
  responses: Array<{
    text: string;
    confidence: number;
    suggestions?: string[];
    requiresHuman?: boolean;
  }>;
}

export interface ConversationLog {
  id?: string;
  sessionId: string;
  userMessage: string;
  botResponse: string;
  intent: string;
  confidence: number;
  requiresHuman: boolean;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

export interface AnalyticsEvent {
  type: 'message_sent' | 'message_received' | 'suggestion_clicked' | 'chat_opened' | 'chat_closed' | 'error';
  sessionId?: string;
  intent?: string;
  confidence?: number;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}
