import { useMemo } from 'react';
import { Conversation, getSentimentScore } from '../lib/data';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { DateRange, DateRangePicker } from './DateRangePicker';
import { Calendar } from 'lucide-react';

type DateRangeType = 'today' | 'week' | 'month' | 'custom';

interface SentimentByServiceAreaProps {
  conversations: Conversation[];
  selectedRange?: DateRangeType;
  customDateRange?: DateRange;
  onRangeChange?: (range: DateRangeType) => void;
  onCustomDateRangeChange?: (dateRange: DateRange) => void;
}

export function SentimentByServiceArea({ 
  conversations: conversations,
  selectedRange = 'week',
  customDateRange = { from: undefined, to: undefined },
  onRangeChange,
  onCustomDateRangeChange
}: SentimentByServiceAreaProps) {
  const filteredConversations = useMemo(() => {
    const now = new Date();
    let startDate: Date;

    switch (selectedRange) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
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

    return conversations.filter(conversation => {
      const conversationDate = new Date(conversation.startedAt);
      return conversationDate >= startDate && conversationDate <= endDate;
    });
  }, [conversations, selectedRange, customDateRange]);

  // Group conversations by topic and sentiment
  const topicSentimentData = filteredConversations.reduce((acc, conversation) => {
    conversation.topics.forEach(topic => {
      if (!acc[topic]) {
        acc[topic] = {
          topic,
          positive: 0,
          neutral: 0,
          negative: 0,
          total: 0
        };
      }
      
      const score = getSentimentScore(conversation.sentiment);
      if (score >= 1) {
        acc[topic].positive++;
      } else if (score <= -1) {
        acc[topic].negative++;
      } else {
        acc[topic].neutral++;
      }
      acc[topic].total++;
    });
    return acc;
  }, {} as Record<string, any>);

  // Convert to chart data and calculate percentages
  const chartData = Object.values(topicSentimentData)
    .map((item: any) => ({
      topic: item.topic,
      'Positive %': Math.round((item.positive / item.total) * 100),
      'Neutral %': Math.round((item.neutral / item.total) * 100),
      'Negative %': Math.round((item.negative / item.total) * 100),
      positiveCount: item.positive,
      neutralCount: item.neutral,
      negativeCount: item.negative,
      total: item.total
    }))
    .sort((a, b) => b.total - a.total); // Sort by total volume

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-popover border rounded-lg p-3 shadow-md">
          <p className="font-medium mb-2">{label}</p>
          <p className="text-sm text-muted-foreground mb-2">Total conversations: {data.total}</p>
          <div className="space-y-1">
            <p className="text-sm text-green-600">
              Positive: {data.positiveCount} ({data['Positive %']}%)
            </p>
            <p className="text-sm text-gray-600">
              Neutral: {data.neutralCount} ({data['Neutral %']}%)
            </p>
            <p className="text-sm text-red-600">
              Negative: {data.negativeCount} ({data['Negative %']}%)
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  // Calculate average sentiment scores for insights
  const insights = chartData.map(item => ({
    topic: item.topic,
    avgSentiment: ((item['Positive %'] - item['Negative %']) / 100).toFixed(2),
    needsAttention: item['Negative %'] > 40
  }));

  const topicsNeedingAttention = insights.filter(item => item.needsAttention);

  const formatDateRange = () => {
    if (selectedRange === 'custom' && customDateRange.from) {
      const from = customDateRange.from.toLocaleDateString();
      const to = customDateRange.to ? customDateRange.to.toLocaleDateString() : 'Present';
      return `${from} - ${to}`;
    }
    const ranges = {
      today: 'Today',
      week: 'Past 7 days',
      month: 'Past 30 days'
    };
    return ranges[selectedRange] || 'All time';
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Sentiment by Service Area</CardTitle>
            <p className="text-sm text-muted-foreground">
              Sentiment breakdown across service topics for {formatDateRange()}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={selectedRange === 'today' ? 'default' : 'outline'}
              size="sm"
              onClick={() => onRangeChange?.('today')}
            >
              Today
            </Button>
            <Button
              variant={selectedRange === 'week' ? 'default' : 'outline'}
              size="sm"
              onClick={() => onRangeChange?.('week')}
            >
              Week
            </Button>
            <Button
              variant={selectedRange === 'month' ? 'default' : 'outline'}
              size="sm"
              onClick={() => onRangeChange?.('month')}
            >
              Month
            </Button>
            <Button
              variant={selectedRange === 'custom' ? 'default' : 'outline'}
              size="sm"
              onClick={() => onRangeChange?.('custom')}
            >
              Custom
            </Button>
          </div>
        </div>
        
        {selectedRange === 'custom' && (
          <div className="flex items-center gap-4 pt-2">
            <Calendar className="w-4 h-4 text-gray-400" />
            <DateRangePicker
              value={customDateRange}
              onChange={onCustomDateRangeChange || (() => {})}
            />
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 20, right: 20, bottom: 60, left: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="topic" 
                angle={-45}
                textAnchor="end"
                height={60}
                interval={0}
                fontSize={12}
              />
              <YAxis 
                label={{ value: 'Percentage (%)', angle: -90, position: 'insideLeft' }}
                domain={[0, 100]}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar 
                dataKey="Positive %" 
                stackId="sentiment"
                fill="#22c55e" 
                name="Positive"
              />
              <Bar 
                dataKey="Neutral %" 
                stackId="sentiment"
                fill="#6b7280" 
                name="Neutral"
              />
              <Bar 
                dataKey="Negative %" 
                stackId="sentiment"
                fill="#ef4444" 
                name="Negative"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Insights */}
        {topicsNeedingAttention.length > 0 && (
          <div className="mt-6 p-4 bg-red-50 rounded-lg border border-red-200">
            <h4 className="font-medium text-red-800 mb-2">Areas Needing Attention</h4>
            <div className="space-y-1">
              {topicsNeedingAttention.map((item, index) => (
                <p key={index} className="text-sm text-red-700">
                  <span className="font-medium">{item.topic}</span> has high negative sentiment 
                  ({chartData.find(d => d.topic === item.topic)?.['Negative %']}%)
                </p>
              ))}
            </div>
          </div>
        )}

        {/* Service Area Performance Summary */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {chartData.slice(0, 3).map((item, index) => {
            const isGood = item['Positive %'] > item['Negative %'];
            return (
              <div key={index} className={`p-3 rounded-lg border ${
                isGood ? 'bg-green-50 border-green-200' : 'bg-orange-50 border-orange-200'
              }`}>
                <p className="font-medium text-sm">{item.topic}</p>
                <p className="text-xs text-muted-foreground">{item.total} conversations</p>
                <div className="flex items-center gap-2 mt-1">
                  <div className={`w-2 h-2 rounded-full ${isGood ? 'bg-green-500' : 'bg-orange-500'}`}></div>
                  <span className="text-xs">
                    {isGood ? 'Performing well' : 'Needs improvement'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}