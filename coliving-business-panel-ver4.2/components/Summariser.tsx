import { useState, useMemo } from 'react';
import { Conversation } from '../lib/data';
import { DateRange, DateRangePicker } from './DateRangePicker';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Calendar, BarChart, Heart, MessageSquare, TrendingUp, Users, User, Building } from 'lucide-react';

type DateRangeType = 'week' | 'month' | 'custom';
type FilterLevel = 'overall' | 'by-tenant' | 'by-agent';

interface SummariserProps {
  conversations: Conversation[];
}

interface SummaryData {
  totalConversations: number;
  topTopics: Array<{ topic: string; count: number; percentage: number }>;
  sentimentBreakdown: Array<{ sentiment: string; count: number; percentage: number }>;
  emotionBreakdown: Array<{ emotion: string; count: number; percentage: number }>;
  avgSentimentScore: number;
  resolutionRate: number;
  mostActiveAgents: Array<{ agentId: string; count: number }>;
}

export function Summariser({ conversations: conversations }: SummariserProps) {
  const [selectedRange, setSelectedRange] = useState<DateRangeType>('week');
  const [customDateRange, setCustomDateRange] = useState<DateRange>({ from: undefined, to: undefined });
  const [filterLevel, setFilterLevel] = useState<FilterLevel>('overall');
  const [tenantFilter, setTenantFilter] = useState('');
  const [agentFilter, setAgentFilter] = useState('');

  const filteredConversations = useMemo(() => {
    const now = new Date();
    let startDate: Date;

    switch (selectedRange) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'custom':
        if (!customDateRange.from) return conversations;
        startDate = customDateRange.from;
        break;
      default:
        return conversations;
    }

    const endDate = selectedRange === 'custom' && customDateRange.to ? customDateRange.to : now;

    let dateFilteredConversationss = conversations.filter(conversation => {
      const conversationDate = new Date(conversation.startedAt);
      return conversationDate >= startDate && conversationDate <= endDate;
    });

    // Apply first-level filter
    switch (filterLevel) {
      case 'by-tenant':
        if (tenantFilter.trim()) {
          dateFilteredConversationss = dateFilteredConversationss.filter(conversation =>
            conversation.tenant && (
              conversation.tenant.name.toLowerCase().includes(tenantFilter.toLowerCase()) ||
              conversation.tenant.email.toLowerCase().includes(tenantFilter.toLowerCase())
            )
          );
        }
        break;
      case 'by-agent':
        if (agentFilter.trim()) {
          dateFilteredConversationss = dateFilteredConversationss.filter(conversation =>
            conversation.agentIds && conversation.agentIds.some(agentId => 
              agentId.toLowerCase().includes(agentFilter.toLowerCase())
            )
          );
        }
        break;
      case 'overall':
      default:
        // No additional filtering needed
        break;
    }

    return dateFilteredConversationss;
  }, [conversations, selectedRange, customDateRange, filterLevel, tenantFilter, agentFilter]);

  const summaryData = useMemo((): SummaryData => {
    // Topics analysis
    const topicCounts: { [key: string]: number } = {};
    filteredConversations.forEach(conversation => {
      conversation.topics.forEach(topic => {
        topicCounts[topic] = (topicCounts[topic] || 0) + 1;
      });
    });
    
    const topTopics = Object.entries(topicCounts)
      .map(([topic, count]) => ({
        topic,
        count,
        percentage: (count / filteredConversations.length) * 100
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Sentiment analysis
    const sentimentCounts: { [key: string]: number } = {};
    filteredConversations.forEach(conversation => {
      sentimentCounts[conversation.sentiment] = (sentimentCounts[conversation.sentiment] || 0) + 1;
    });

    const sentimentBreakdown = Object.entries(sentimentCounts)
      .map(([sentiment, count]) => ({
        sentiment,
        count,
        percentage: (count / filteredConversations.length) * 100
      }))
      .sort((a, b) => b.count - a.count);

    // Emotion analysis
    const emotionCounts: { [key: string]: number } = {};
    filteredConversations.forEach(conversation => {
      conversation.emotions.forEach(emotion => {
        emotionCounts[emotion] = (emotionCounts[emotion] || 0) + 1;
      });
    });

    const emotionBreakdown = Object.entries(emotionCounts)
      .map(([emotion, count]) => ({
        emotion,
        count,
        percentage: (count / filteredConversations.length) * 100
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Average sentiment score
    const sentimentScores = filteredConversations.map(conversation => getSentimentScore(conversation.sentiment));
    const avgSentimentScore = sentimentScores.length > 0 
      ? sentimentScores.reduce((a, b) => a + b, 0) / sentimentScores.length 
      : 0;

    // Resolution rate
    const solvedConversations = filteredConversations.filter(conversation => conversation.status === 'solved').length;
    const resolutionRate = filteredConversations.length > 0 ? (solvedConversations / filteredConversations.length) * 100 : 0;

    // Most active agents
    const agentCounts: { [key: string]: number } = {};
    filteredConversations.forEach(conversation => {
      conversation.agentIds.forEach(agentId => {
        agentCounts[agentId] = (agentCounts[agentId] || 0) + 1;
      });
    });

    const mostActiveAgents = Object.entries(agentCounts)
      .map(([agentId, count]) => ({ agentId, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);

    return {
      totalConversations: filteredConversations.length,
      topTopics,
      sentimentBreakdown,
      emotionBreakdown,
      avgSentimentScore,
      resolutionRate,
      mostActiveAgents
    };
  }, [filteredConversations]);

  function getSentimentScore(sentiment: string): number {
    const sentimentLevels = [
      'strong negative',
      'moderate negative', 
      'weak negative',
      'neutral',
      'weak positive',
      'moderate positive',
      'strong positive'
    ];
    const index = sentimentLevels.indexOf(sentiment);
    return index - 3; // Convert to -3 to +3 scale
  }

  const getSentimentColor = (sentiment: string) => {
    if (sentiment.includes('positive')) return 'text-green-600';
    if (sentiment.includes('negative')) return 'text-red-600';
    return 'text-gray-600';
  };

  const getSentimentScoreColor = (score: number) => {
    if (score > 0.5) return 'text-green-600';
    if (score < -0.5) return 'text-red-600';
    return 'text-gray-600';
  };

  const getEmotionColor = (emotion: string) => {
    switch (emotion) {
      case 'anger': return 'text-red-500';
      case 'fear': return 'text-orange-500';
      case 'disgust': return 'text-yellow-500';
      case 'sadness': return 'text-blue-500';
      case 'surprise': return 'text-purple-500';
      case 'enjoyment': return 'text-green-500';
      default: return 'text-gray-500';
    }
  };

  const formatDateRange = () => {
    if (selectedRange === 'custom' && customDateRange.from) {
      const from = customDateRange.from.toLocaleDateString();
      const to = customDateRange.to ? customDateRange.to.toLocaleDateString() : 'Present';
      return `${from} - ${to}`;
    }
    return selectedRange === 'week' ? 'Past 7 days' : 'Past 30 days';
  };

  const getFilterLevelTitle = () => {
    switch (filterLevel) {
      case 'by-tenant':
        return tenantFilter ? `for tenant "${tenantFilter}"` : 'by tenant';
      case 'by-agent':
        return agentFilter ? `for agent "${agentFilter}"` : 'by agent';
      case 'overall':
      default:
        return '';
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="font-semibold text-gray-900">Summariser</h3>
          <p className="text-sm text-gray-600 mt-1">
            Comprehensive insights {getFilterLevelTitle()} for {formatDateRange()}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant={selectedRange === 'week' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedRange('week')}
          >
            This Week
          </Button>
          <Button
            variant={selectedRange === 'month' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedRange('month')}
          >
            This Month
          </Button>
          <Button
            variant={selectedRange === 'custom' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedRange('custom')}
          >
            Custom
          </Button>
        </div>
      </div>

      {/* First-level Filter Selection */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-2 mb-3">
          <BarChart className="w-5 h-5 text-gray-400" />
          <span className="font-medium text-gray-700">Filter Level</span>
        </div>
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <Button
            variant={filterLevel === 'overall' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterLevel('overall')}
          >
            Overall
          </Button>
          <Button
            variant={filterLevel === 'by-tenant' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterLevel('by-tenant')}
            className="flex items-center gap-1"
          >
            <Building className="w-4 h-4" />
            By Tenant
          </Button>
          <Button
            variant={filterLevel === 'by-agent' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterLevel('by-agent')}
            className="flex items-center gap-1"
          >
            <User className="w-4 h-4" />
            By Agent
          </Button>
        </div>

        {/* Conditional Input Fields */}
        {filterLevel === 'by-tenant' && (
          <div className="flex items-center gap-2">
            <Building className="w-4 h-4 text-gray-400" />
            <Input
              placeholder="Enter tenant name or email to filter..."
              value={tenantFilter}
              onChange={(e) => setTenantFilter(e.target.value)}
              className="max-w-xs"
            />
          </div>
        )}

        {filterLevel === 'by-agent' && (
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-gray-400" />
            <Input
              placeholder="Enter agent name or ID to filter..."
              value={agentFilter}
              onChange={(e) => setAgentFilter(e.target.value)}
              className="max-w-xs"
            />
          </div>
        )}
      </div>

      {selectedRange === 'custom' && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-4">
            <Calendar className="w-5 h-5 text-gray-400" />
            <DateRangePicker
              value={customDateRange}
              onChange={setCustomDateRange}
            />
          </div>
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <MessageSquare className="w-5 h-5 text-blue-600" />
            <span className="text-sm font-medium text-blue-600">Total Conversations</span>
          </div>
          <div className="text-2xl font-semibold text-blue-700">
            {summaryData.totalConversations}
          </div>
        </div>

        <div className="bg-green-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <BarChart className="w-5 h-5 text-green-600" />
            <span className="text-sm font-medium text-green-600">Resolution Rate</span>
          </div>
          <div className="text-2xl font-semibold text-green-700">
            {summaryData.resolutionRate.toFixed(1)}%
          </div>
        </div>

        <div className="bg-purple-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-purple-600" />
            <span className="text-sm font-medium text-purple-600">Avg Sentiment</span>
          </div>
          <div className={`text-2xl font-semibold ${getSentimentScoreColor(summaryData.avgSentimentScore)}`}>
            {summaryData.avgSentimentScore.toFixed(1)}
          </div>
        </div>

        <div className="bg-orange-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-5 h-5 text-orange-600" />
            <span className="text-sm font-medium text-orange-600">Active Agents</span>
          </div>
          <div className="text-2xl font-semibold text-orange-700">
            {summaryData.mostActiveAgents.length}
          </div>
        </div>
      </div>

      {/* Detailed Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Topics */}
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <h4 className="font-medium text-gray-900 mb-4">Top Topics</h4>
          <div className="space-y-3">
            {summaryData.topTopics.map((topic, index) => (
              <div key={topic.topic} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-xs font-medium text-gray-600">
                    {index + 1}
                  </span>
                  <span className="text-sm font-medium text-gray-900">{topic.topic}</span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900">{topic.count}</div>
                  <div className="text-xs text-gray-500">{topic.percentage.toFixed(1)}%</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sentiment Breakdown */}
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <h4 className="font-medium text-gray-900 mb-4">Sentiment Distribution</h4>
          <div className="space-y-3">
            {summaryData.sentimentBreakdown.slice(0, 5).map((sentiment) => (
              <div key={sentiment.sentiment} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Heart className={`w-4 h-4 ${getSentimentColor(sentiment.sentiment)}`} />
                  <span className="text-sm font-medium text-gray-900 capitalize">
                    {sentiment.sentiment.replace(/^(weak|moderate|strong) /, '')}
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900">{sentiment.count}</div>
                  <div className="text-xs text-gray-500">{sentiment.percentage.toFixed(1)}%</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Emotion Breakdown */}
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <h4 className="font-medium text-gray-900 mb-4">Top Emotions</h4>
          <div className="space-y-3">
            {summaryData.emotionBreakdown.map((emotion) => (
              <div key={emotion.emotion} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${getEmotionColor(emotion.emotion).replace('text', 'bg')}`} />
                  <span className="text-sm font-medium text-gray-900 capitalize">{emotion.emotion}</span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900">{emotion.count}</div>
                  <div className="text-xs text-gray-500">{emotion.percentage.toFixed(1)}%</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {summaryData.totalConversations === 0 && (
        <div className="text-center py-8 text-gray-500">
          <BarChart className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>No conversations found for the selected filters and date range</p>
        </div>
      )}
    </div>
  );
}