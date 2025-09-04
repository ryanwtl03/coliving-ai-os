// lib/api.ts
// This mirrors data.ts but fetches from your server endpoints instead of using mock data.

export interface Tenant {
  id: string;
  name: string;
  age: number;
  gender: string;
  property: string;
  bigFivePersonality: {
    openness: number;
    conscientiousness: number;
    extraversion: number;
    agreeableness: number;
    neuroticism: number;
  };
}

export interface Agent {
  id: string;
  name: string;
  role: string;
}

export interface Message {
  id: string;
  senderId: string;
  senderType: "tenant" | "agent";
  content: string;
  timestamp: Date;
  sentiment: number; // -3 to +3
  emotions: string[];
  emotionScores: { [emotion: string]: number }; // 0-1 intensity scores
}

export interface Conversation {
  id: string;
  tenantId: string;
  agentIds: string[];
  status: "In Progress" | "Solved";
  sentiment: string;
  emotions: string[];
  topics: string[];
  summary: string;
  messages: Message[];
  lastUpdated: Date;
  startedAt: Date;
}

export const sentimentLevels = [
  "strong negative",
  "moderate negative",
  "weak negative",
  "neutral",
  "weak positive",
  "moderate positive",
  "strong positive",
];

export const emotionTypes = [
  "anger",
  "surprise",
  "disgust",
  "enjoyment",
  "fear",
  "sadness",
  "neutral",
];

export const topicTypes = [
  "Billing",
  "Maintenance",
  "Amenities",
  "Noise",
  "Cleaning",
];

// --- API Base ---
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

// --- Generic fetch helpers ---
async function fetchJSON<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error(`Failed to fetch ${path}: ${res.statusText}`);
  return res.json();
}

// --- API Data Accessors (instead of mock data) ---
export async function getTenants(): Promise<Tenant[]> {
  return fetchJSON<Tenant[]>("/tenants");
}

export async function getAgents(): Promise<Agent[]> {
  return fetchJSON<Agent[]>("/agents");
}

export async function getConversations(): Promise<Conversation[]> {
  const data = await fetchJSON<Conversation[]>("/conversations");
  // convert ISO strings to Date objects
  return data.map((conv) => ({
    ...conv,
    startedAt: new Date(conv.startedAt),
    lastUpdated: new Date(conv.lastUpdated),
    messages: conv.messages.map((m) => ({
      ...m,
      timestamp: new Date(m.timestamp),
    })),
  }));
}

// --- Utility functions (same as data.ts) ---
export function getSentimentScore(sentiment: string): number {
  const index = sentimentLevels.indexOf(sentiment);
  return index - 3; // Convert to -3 to +3 scale
}

export function getSentimentColor(sentiment: string): string {
  const score = getSentimentScore(sentiment);
  if (score <= -2) return "bg-red-500";
  if (score === -1) return "bg-orange-500";
  if (score === 0) return "bg-gray-500";
  if (score === 1) return "bg-yellow-500";
  if (score >= 2) return "bg-green-500";
  return "bg-gray-500";
}

export function getEmotionColor(emotion: string): string {
  switch (emotion) {
    case "anger":
      return "#ef4444";
    case "fear":
      return "#f97316";
    case "disgust":
      return "#84cc16";
    case "sadness":
      return "#3b82f6";
    case "surprise":
      return "#8b5cf6";
    case "enjoyment":
      return "#10b981";
    case "neutral":
      return "#6b7280";
    default:
      return "#6b7280";
  }
}

export function getSentimentAbbreviation(sentimentScore: number): string {
  if (sentimentScore <= -3) return "SN"; // Strong Negative
  if (sentimentScore === -2) return "MN"; // Moderate Negative
  if (sentimentScore === -1) return "WN"; // Weak Negative
  if (sentimentScore === 0) return "N"; // Neutral
  if (sentimentScore === 1) return "WP"; // Weak Positive
  if (sentimentScore === 2) return "MP"; // Moderate Positive
  if (sentimentScore >= 3) return "SP"; // Strong Positive
  return "N"; // Default to Neutral
}

export function getConversationTrend(conversation: Conversation): string {
  const messages = conversation.messages.filter(
    (m) => m.senderType === "tenant"
  );
  if (messages.length === 0) return "N - N";

  const firstMessage = messages[0];
  const lastMessage = messages[messages.length - 1];

  const firstSentiment = getSentimentAbbreviation(firstMessage.sentiment);
  const lastSentiment = getSentimentAbbreviation(lastMessage.sentiment);

  return `${firstSentiment} - ${lastSentiment}`;
}

export function getTrendColor(conversation: Conversation): string {
  const messages = conversation.messages.filter(
    (m) => m.senderType === "tenant"
  );
  if (messages.length === 0)
    return "bg-gray-50 text-gray-700 border-gray-300";

  const firstMessage = messages[0];
  const lastMessage = messages[messages.length - 1];

  const firstSentiment = firstMessage.sentiment;
  const lastSentiment = lastMessage.sentiment;

  if (lastSentiment > firstSentiment) {
    return "bg-green-50 text-green-700 border-green-300"; // Improving
  } else if (lastSentiment < firstSentiment) {
    return "bg-red-50 text-red-700 border-red-300"; // Declining
  } else {
    return "bg-gray-50 text-gray-700 border-gray-300"; // No change
  }
}
