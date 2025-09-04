import { useState, useEffect, useMemo } from 'react';
import { Conversation } from './lib/data'; 
import { ConversationTable } from './components/ConversationTable';

import { ConversationDetailSheet } from './components/ConversationDetailSheet';
import { SentimentDistributionPlot } from './components/SentimentDistributionPlot';
import { EmotionDistributionOverTime } from './components/EmotionDistributionOverTime';
import { SentimentTrendOverTime } from './components/SentimentTrendOverTime';
import { EmotionTrendOverTime } from './components/EmotionTrendOverTime';
import { TrendingTopics } from './components/TrendingTopics';

import { AIChatAssistant } from './components/AIChatAssistant';
import { DashboardFilters, FilterState } from './components/DashboardFilters';
import { MessageCircle, CheckCircle, AlertTriangle, ThumbsDown, AlertCircle } from 'lucide-react';


const API_BASE = "http://127.0.0.1:4000/coliving-ai-os/chat-analysis"; // adjust if backend is elsewhere

export default function App() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [trendSelectedRange, setTrendSelectedRange] = useState<'today' | 'week' | 'month' | 'custom'>('week');
  const [trendCustomDateRange, setTrendCustomDateRange] = useState<{ from?: Date; to?: Date }>({ from: undefined, to: undefined });

  type DateRangeType = 'today' | 'week' | 'month' | 'custom';
  const [selectedRange, setSelectedRange] = useState<DateRangeType>('week');
  const [customDateRange, setCustomDateRange] = useState<{ from?: Date; to?: Date }>({
    from: undefined,
    to: undefined
  });

  const [filters, setFilters] = useState<FilterState>({
    search: '',
    status: 'all',
    sentiment: 'all',
    emotions: [],
    topics: [],
    agent: 'all'
  });

  // KPI stats
  const [stats, setStats] = useState({
    total: 0,
    inProgress: 0,
    solved: 0,
    negative: 0,
    urgent: 0,
    agentCount: 0,
    avgResponseTime: 0
  });

  // ----------------------------
  // Fetch conversations
  // ----------------------------
  useEffect(() => {
    setLoading(true);
    fetch(`${API_BASE}/conversations`)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(data => {
        console.log("✅ Conversations API raw response:", data);

        try {
          const normalized: Conversation[] = data.map((c: any) => ({
            ...c,
            id: String(c.id),
            tenantId: String(c.tenantId),
            agentIds: (c.agentIds || []).map((a: any) => String(a)),
            lastUpdated: c.lastUpdated ? new Date(c.lastUpdated) : new Date(),
            startedAt: c.startedAt ? new Date(c.startedAt) : new Date(),

            summary: c.summary ?? "",
            status: c.status ?? "unknown",
            sentiment: c.sentiment ?? "neutral",

            emotions: Array.isArray(c.emotions)
              ? c.emotions
              : typeof c.emotions === "string"
              ? c.emotions.split(",").map((e: string) => e.trim())
              : [],

            topics: Array.isArray(c.topics)
              ? c.topics
              : typeof c.topics === "string"
              ? c.topics.split(",").map((t: string) => t.trim())
              : [],

            messages: (c.messages || []).map((m: any) => ({
              ...m,
              id: String(m.id),
              senderId: String(m.senderId),
              timestamp: new Date(m.timestamp),
              sentiment: m.sentiment ?? 0,
              emotionScores: m.emotionScores ?? {}
            }))
          }));

          console.log("📊 Normalized Conversations:", normalized);
          setConversations(normalized);
        } catch (err) {
          console.error("❌ Error normalizing conversations:", err);
          setError("Failed to process conversation data");
        }
      })
      .catch(err => {
        console.error("❌ Error fetching conversations:", err);
        setError(`Failed to fetch conversations: ${err.message}`);
      })
      .finally(() => setLoading(false));
  }, []);

  // ----------------------------
  // Fetch Stats Cards
  // ----------------------------
  useEffect(() => {
    fetch(`${API_BASE}/kpis`)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(data => {
        console.log("✅ KPIs API response:", data);
        setStats({
          total: data.total ?? 0,
          inProgress: data.inProgress ?? 0,
          solved: data.solved ?? 0,
          negative: data.negative ?? 0,
          urgent: data.urgent ?? 0,
          agentCount: data.agentCount ?? 0,
          avgResponseTime: data.avgResponseTime ?? 0,
        });
      })
      .catch(err => {
        console.error("❌ Error fetching KPIs:", err);
        setError(`Failed to fetch KPIs: ${err.message}`);
      });
  }, []);

  // Filters (frontend only)
  const filteredConversations = useMemo(() => {
    const filtered = conversations.filter(conversation => {
      try {
        if (filters.search) {
          const searchLower = filters.search.toLowerCase();
          const matchesSearch = 
            conversation.summary?.toLowerCase().includes(searchLower) ||
            conversation.topics.some((topic: string) => topic.toLowerCase().includes(searchLower)) ||
            conversation.emotions.some((emotion: string) => emotion.toLowerCase().includes(searchLower));
          
          if (!matchesSearch) return false;
        }

        if (filters.status !== 'all' && conversation.status !== filters.status) return false;
        if (filters.sentiment !== 'all' && conversation.sentiment !== filters.sentiment) return false;

        if (filters.emotions.length > 0) {
          const hasMatchingEmotion = filters.emotions.some(emotion => conversation.emotions.includes(emotion));
          if (!hasMatchingEmotion) return false;
        }

        if (filters.topics.length > 0) {
          const hasMatchingTopic = filters.topics.some(topic => conversation.topics.includes(topic));
          if (!hasMatchingTopic) return false;
        }

        return true;
      } catch (err) {
        console.error("❌ Error filtering conversation:", err, conversation);
        return false;
      }
    });

    console.log("🎯 Filtered Conversations:", filtered);
    return filtered;
  }, [conversations, filters]);

  const handleConversationClick = (conversation: Conversation) => {
    console.log("🔍 Selected conversation:", conversation);
    setSelectedConversation(conversation);
    setIsDetailOpen(true);
  };

  // ----------------------------
  // Render
  // ----------------------------
  if (loading) {
    return <div className="p-6 text-gray-600">⏳ Loading conversations...</div>;
  }

  if (error) {
    return <div className="p-6 text-red-600">⚠️ {error}</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50/30">
      <div className="w-full px-6 py-6 space-y-8">

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
          {/* Total Conversations */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl border border-blue-200 shadow-sm hover:shadow-lg transition-all duration-300 hover:scale-105">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center shadow-lg">
                <MessageCircle className="w-6 h-6 text-white" />
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-blue-900 mb-1">{stats.total}</div>
                <div className="text-sm text-blue-700">Total Conversations</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-blue-600" />
              <span className="text-xs text-blue-600 font-medium">Live monitoring</span>
            </div>
          </div>

          {/* In Progress */}
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-xl border border-orange-200 shadow-sm hover:shadow-lg transition-all duration-300 hover:scale-105">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                <AlertTriangle className="w-6 h-6 text-white" />
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-orange-900 mb-1">{stats.inProgress}</div>
                <div className="text-sm text-orange-700">In Progress</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-orange-600" />
              <span className="text-xs text-orange-600 font-medium">Ongoing resolution</span>
            </div>
          </div>

          {/* Solved */}
          <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl border border-green-200 shadow-sm hover:shadow-lg transition-all duration-300 hover:scale-105">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center shadow-lg">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-green-900 mb-1">{stats.solved}</div>
                <div className="text-sm text-green-700">Solved</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-xs text-green-600 font-medium">
                {stats.total > 0 ? ((stats.solved / stats.total) * 100).toFixed(0) : 0}% resolution rate
              </span>
            </div>
          </div>

          {/* Negative Sentiment */}
          <div className="bg-gradient-to-br from-red-50 to-red-100 p-6 rounded-xl border border-red-200 shadow-sm hover:shadow-lg transition-all duration-300 hover:scale-105">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 bg-red-500 rounded-xl flex items-center justify-center shadow-lg">
                <ThumbsDown className="w-6 h-6 text-white" />
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-red-900 mb-1">{stats.negative}</div>
                <div className="text-sm text-red-700">Negative Sentiment</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <span className="text-xs text-red-600 font-medium">
                {stats.total > 0 ? ((stats.negative / stats.total) * 100).toFixed(0) : 0}% of total
              </span>
            </div>
          </div>

          {/* Urgent */}
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl border border-purple-200 shadow-sm hover:shadow-lg transition-all duration-300 hover:scale-105">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center shadow-lg">
                <AlertCircle className="w-6 h-6 text-white" />
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-purple-900 mb-1">{stats.urgent}</div>
                <div className="text-sm text-purple-700">Urgent Conversations</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-purple-600" />
              <span className="text-xs text-purple-600 font-medium">Requires immediate attention</span>
            </div>
          </div>

          {/* Placeholder for Agents / Future Metric */}
          <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 p-6 rounded-xl border border-indigo-200 shadow-sm hover:shadow-lg transition-all duration-300 hover:scale-105">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 bg-indigo-500 rounded-xl flex items-center justify-center shadow-lg">
                <MessageCircle className="w-6 h-6 text-white" />
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-indigo-900 mb-1">{stats.agentCount}</div>
                <div className="text-sm text-indigo-700">Active Agents</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-indigo-600" />
              <span className="text-xs text-indigo-600 font-medium">Avg {stats.avgResponseTime} messages per hour</span>
            </div>
          </div>
        </div>

        {/* Current Business Summary and Trending Topics Side by Side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Current Business Summary */}
          <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100">
            <div className="prose prose-lg max-w-none">
              <p className="text-lg text-gray-800 leading-relaxed mb-4">
                <strong>Current Operations Summary:</strong> The customer service team is managing {stats.total} total conversations with {stats.inProgress} cases currently in progress and {stats.solved} successfully resolved. 
                Critical attention is required for {stats.urgent} urgent conversations that combine in-progress status with negative sentiment indicators. 
                Sentiment analysis reveals {stats.negative} conversations displaying negative customer emotion, representing {((stats.negative / stats.total) * 100).toFixed(1)}% of all interactions. 
                The dashboard provides real-time monitoring of conversation trends, emotion patterns, and agent performance metrics to support proactive customer relationship management.
              </p>
            </div>
          </div>

          {/* Trending Topics */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <TrendingTopics conversations={filteredConversations} />
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <DashboardFilters 
            filters={filters} 
            onFiltersChange={setFilters}
          />
        </div>

        {/* Conversation Table */}
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="px-6 py-4 border-b bg-gray-50/30">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Conversation Management</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Showing {filteredConversations.length} of {conversations.length} conversations
                </p>
              </div>
              <div className="text-sm text-gray-500">
                Last updated: {new Date().toLocaleTimeString()}
              </div>
            </div>
          </div>
          <ConversationTable
            conversations={filteredConversations}
            onConversationClick={handleConversationClick}
          />
        </div>

        {/* Analytics Charts */}
        <div className="space-y-8">
          {/* Sentiment Distribution Plot */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <SentimentDistributionPlot
              conversations={filteredConversations}
              onConversationClick={handleConversationClick}
              selectedRange={selectedRange}
              customDateRange={customDateRange}
              onRangeChange={setSelectedRange}
              onCustomDateRangeChange={setCustomDateRange}
            />
          </div>

          {/* Emotion Distribution Over Time - Right below Sentiment Distribution */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <EmotionDistributionOverTime 
              conversations={filteredConversations}
              selectedRange={selectedRange}
              customDateRange={customDateRange}
              onRangeChange={setSelectedRange}
              onCustomDateRangeChange={setCustomDateRange}
            />
          </div>
        </div>

        {/* Analytics Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Sentiment Trend Over Time */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <SentimentTrendOverTime 
              conversations={filteredConversations}
              selectedRange={trendSelectedRange}
              customDateRange={trendCustomDateRange}
              onRangeChange={setTrendSelectedRange}
              onCustomDateRangeChange={setTrendCustomDateRange}
            />
          </div>

          {/* Emotion Trend Over Time */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <EmotionTrendOverTime 
              conversations={filteredConversations}
              selectedRange={trendSelectedRange}
              customDateRange={trendCustomDateRange}
              onRangeChange={setTrendSelectedRange}
              onCustomDateRangeChange={setTrendCustomDateRange}
            />
          </div>
        </div>

        {/* Conversation Detail Sheet */}
        <ConversationDetailSheet
          conversation={selectedConversation}
          open={isDetailOpen}
          onOpenChange={setIsDetailOpen}
        />

        {/* AI Chat Assistant */}
        <AIChatAssistant />
      </div>
    </div>
  );
}
