import { useState, useMemo } from 'react';
import { Conversation, mockConversations } from './lib/data';
import { ConversationTable } from './components/ConversationTable';
import { ConversationDetailSheet } from './components/ConversationDetailSheet';
import { AIChatAssistant } from './components/AIChatAssistant';
import { SentimentDistributionPlot } from './components/SentimentDistributionPlot';
import { SentimentTrendOverTime } from './components/SentimentTrendOverTime';
import { SentimentByServiceArea } from './components/SentimentByServiceArea';
import { EmotionDistributionOverTime } from './components/EmotionDistributionOverTime';
import { EmotionTrendOverTime } from './components/EmotionTrendOverTime';
import { EmotionByServiceArea } from './components/EmotionByServiceArea';
import { TrendingTopics } from './components/TrendingTopics';
import { Summariser } from './components/Summariser';
import { DashboardFilters, FilterState } from './components/DashboardFilters';
import { DateRange } from './components/DateRangePicker';
import { MessageCircle, Users, CheckCircle, AlertTriangle, ThumbsDown, AlertCircle } from 'lucide-react';

type DateRangeType = 'today' | 'week' | 'month' | 'custom';

export default function App() {
  const [conversations, setConversations] = useState<Conversation[]>(mockConversations);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    status: 'all',
    sentiment: 'all',
    emotions: [],
    topics: [],
    agent: 'all'
  });

  // Shared date picker state for sentiment and emotion distribution charts
  const [selectedRange, setSelectedRange] = useState<DateRangeType>('week');
  const [customDateRange, setCustomDateRange] = useState<DateRange>({ from: undefined, to: undefined });

  // Shared date picker state for trend charts (Sentiment Trend Over Time + Emotion Trend Over Time)
  const [trendSelectedRange, setTrendSelectedRange] = useState<DateRangeType>('week');
  const [trendCustomDateRange, setTrendCustomDateRange] = useState<DateRange>({ from: undefined, to: undefined });

  // Shared date picker state for service area charts (Sentiment by Service Area + Emotion by Service Area)
  const [serviceAreaSelectedRange, setServiceAreaSelectedRange] = useState<DateRangeType>('week');
  const [serviceAreaCustomDateRange, setServiceAreaCustomDateRange] = useState<DateRange>({ from: undefined, to: undefined });

  // Filter conversations based on current filters
  const filteredConversations = useMemo(() => {
    return conversations.filter(conversation => {
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesSearch = 
          conversation.summary.toLowerCase().includes(searchLower) ||
          conversation.topics.some(topic => topic.toLowerCase().includes(searchLower)) ||
          conversation.emotions.some(emotion => emotion.toLowerCase().includes(searchLower));
        
        if (!matchesSearch) return false;
      }

      // Status filter
      if (filters.status !== 'all' && conversation.status !== filters.status) {
        return false;
      }

      // Sentiment filter
      if (filters.sentiment !== 'all' && conversation.sentiment !== filters.sentiment) {
        return false;
      }

      // Emotions filter
      if (filters.emotions.length > 0) {
        const hasMatchingEmotion = filters.emotions.some(emotion => 
          conversation.emotions.includes(emotion)
        );
        if (!hasMatchingEmotion) return false;
      }

      // Topics filter
      if (filters.topics.length > 0) {
        const hasMatchingTopic = filters.topics.some(topic => 
          conversation.topics.includes(topic)
        );
        if (!hasMatchingTopic) return false;
      }

      // Agent filter (simplified - checking if any agent name matches)
      if (filters.agent !== 'all') {
        // This would need more sophisticated logic in a real app
        return true; // Placeholder
      }

      return true;
    });
  }, [conversations, filters]);

  const handleConversationClick = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    setIsDetailOpen(true);
  };

  const stats = useMemo(() => {
    const total = filteredConversations.length;
    const inProgress = filteredConversations.filter(t => t.status === 'In Progress').length;
    const solved = filteredConversations.filter(t => t.status === 'Solved').length;
    const negative = filteredConversations.filter(t => 
      ['strong negative', 'moderate negative', 'weak negative'].includes(t.sentiment)
    ).length;
    const urgent = filteredConversations.filter(t => 
      t.status === 'In Progress' && 
      ['strong negative', 'moderate negative'].includes(t.sentiment)
    ).length;

    return { total, inProgress, solved, negative, urgent };
  }, [filteredConversations]);

  return (
    <div className="min-h-screen bg-gray-50/30">
      <div className="w-full px-6 py-6 space-y-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-blue-600" />
              </div>
            </div>
            <div className="text-2xl font-semibold text-gray-900 mb-1">{stats.total}</div>
            <div className="text-sm text-gray-600">Total Conversations</div>
          </div>
          
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-orange-600" />
              </div>
            </div>
            <div className="text-2xl font-semibold text-orange-600 mb-1">{stats.inProgress}</div>
            <div className="text-sm text-gray-600">In Progress</div>
          </div>
          
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
            </div>
            <div className="text-2xl font-semibold text-green-600 mb-1">{stats.solved}</div>
            <div className="text-sm text-gray-600">Solved</div>
          </div>
          
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <ThumbsDown className="w-5 h-5 text-red-600" />
              </div>
            </div>
            <div className="text-2xl font-semibold text-red-600 mb-1">{stats.negative}</div>
            <div className="text-sm text-gray-600">Negative Sentiment</div>
          </div>
          
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-red-600" />
              </div>
            </div>
            <div className="text-2xl font-semibold text-red-600 mb-1">{stats.urgent}</div>
            <div className="text-sm text-gray-600">Urgent Conversations</div>
          </div>
        </div>

        {/* Summary Report */}
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

        {/* Filters */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <DashboardFilters 
            filters={filters} 
            onFiltersChange={setFilters}
          />
        </div>

        {/* Main Conversation Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/30">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Conversation Management</h2>
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

          {/* Service Area Analytics - Full Width */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Sentiment by Service Area */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <SentimentByServiceArea 
                conversations={filteredConversations}
                selectedRange={serviceAreaSelectedRange}
                customDateRange={serviceAreaCustomDateRange}
                onRangeChange={setServiceAreaSelectedRange}
                onCustomDateRangeChange={setServiceAreaCustomDateRange}
              />
            </div>

            {/* Emotion by Service Area */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <EmotionByServiceArea 
                conversations={filteredConversations}
                selectedRange={serviceAreaSelectedRange}
                customDateRange={serviceAreaCustomDateRange}
                onRangeChange={setServiceAreaSelectedRange}
                onCustomDateRangeChange={setServiceAreaCustomDateRange}
              />
            </div>
          </div>

          {/* Trending Topics and Summariser */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Trending Topics */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <TrendingTopics conversations={filteredConversations} />
            </div>

            {/* Summariser */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <Summariser conversations={filteredConversations} />
            </div>
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