import { useMemo, useState } from 'react';
import { Conversation, getSentimentScore } from '../lib/data';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { DateRange, DateRangePicker } from './DateRangePicker';
import { Calendar } from 'lucide-react';

type DateRangeType = 'today' | 'week' | 'month' | 'custom';

interface SentimentTrendOverTimeProps {
  conversations: Conversation[];
  selectedRange?: DateRangeType;
  customDateRange?: DateRange;
  onRangeChange?: (range: DateRangeType) => void;
  onCustomDateRangeChange?: (dateRange: DateRange) => void;
}

export function SentimentTrendOverTime({ 
  conversations: conversations,
  selectedRange = 'week',
  customDateRange = { from: undefined, to: undefined },
  onRangeChange,
  onCustomDateRangeChange
}: SentimentTrendOverTimeProps) {
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
      const conversationDate = new Date(conversation.lastUpdated);
      return conversationDate >= startDate && conversationDate <= endDate;
    });
  }, [conversations, selectedRange, customDateRange]);

  // Group conversations by week
  const groupedData = filteredConversations.reduce((acc, conversation) => {
    const date = new Date(conversation.lastUpdated);
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - date.getDay()); // Start of week (Sunday)
    const weekKey = weekStart.toISOString().split('T')[0];
    
    if (!acc[weekKey]) {
      acc[weekKey] = {
        date: weekKey,
        positive: 0,
        neutral: 0,
        negative: 0,
        total: 0
      };
    }
    
    const score = getSentimentScore(conversation.sentiment);
    if (score >= 1) {
      acc[weekKey].positive++;
    } else if (score <= -1) {
      acc[weekKey].negative++;
    } else {
      acc[weekKey].neutral++;
    }
    acc[weekKey].total++;
    
    return acc;
  }, {} as Record<string, any>);

  // Convert to array and calculate percentages
  const chartData = Object.values(groupedData)
    .map((item: any) => ({
      date: new Date(item.date).toLocaleDateString('en-US', { 
        month: 'short', 
        day: '2-digit' 
      }),
      positivePercent: Math.round((item.positive / item.total) * 100),
      neutralPercent: Math.round((item.neutral / item.total) * 100),
      negativePercent: Math.round((item.negative / item.total) * 100),
      total: item.total
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const total = payload[0].payload.total;
      return (
        <div className="bg-popover border rounded-lg p-3 shadow-md">
          <p className="font-medium mb-2">Week of {label}</p>
          <p className="text-sm text-muted-foreground mb-2">Total conversations: {total}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value}%
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

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
            <CardTitle>Sentiment Trend Over Time</CardTitle>
            <p className="text-sm text-muted-foreground">
              Weekly percentage breakdown for {formatDateRange()}
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
            <LineChart
              data={chartData}
              margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                label={{ value: 'Week', position: 'insideBottom', offset: -10 }}
              />
              <YAxis 
                label={{ value: 'Percentage (%)', angle: -90, position: 'insideLeft' }}
                domain={[0, 100]}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="positivePercent" 
                stroke="#22c55e" 
                strokeWidth={3}
                name="Positive"
                dot={{ fill: '#22c55e', strokeWidth: 2, r: 4 }}
              />
              <Line 
                type="monotone" 
                dataKey="neutralPercent" 
                stroke="#6b7280" 
                strokeWidth={3}
                name="Neutral"
                dot={{ fill: '#6b7280', strokeWidth: 2, r: 4 }}
              />
              <Line 
                type="monotone" 
                dataKey="negativePercent" 
                stroke="#ef4444" 
                strokeWidth={3}
                name="Negative"
                dot={{ fill: '#ef4444', strokeWidth: 2, r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}