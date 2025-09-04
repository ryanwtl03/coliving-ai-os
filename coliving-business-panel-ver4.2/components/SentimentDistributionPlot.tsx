import { useMemo, useState } from 'react';
import { Conversation, getSentimentScore } from '../lib/data';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Calendar, CalendarDays, Clock, Settings } from 'lucide-react';
import { DateRangePicker, DateRange } from './DateRangePicker';

type DateRangeType = 'today' | 'week' | 'month' | 'custom';

interface SentimentDistributionPlotProps {
  conversations: Conversation[];
  onConversationClick: (ticket: Conversation) => void;
  selectedRange: DateRangeType;
  customDateRange: DateRange;
  onRangeChange: (range: DateRangeType) => void;
  onCustomDateRangeChange: (range: DateRange) => void;
}

export function SentimentDistributionPlot({ 
  conversations: conversations, 
  onConversationClick: onConversationClick, 
  selectedRange,
  customDateRange,
  onRangeChange,
  onCustomDateRangeChange 
}: SentimentDistributionPlotProps) {
  // Filter conversations based on selected date range
  const filteredConversations = useMemo(() => {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(startOfDay);
    startOfWeek.setDate(startOfDay.getDate() - startOfDay.getDay());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    switch (selectedRange) {
      case 'today':
        return conversations.filter(conversation => conversation.startedAt >= startOfDay);
      case 'week':
        return conversations.filter(conversation => conversation.startedAt >= startOfWeek);
      case 'month':
        return conversations.filter(conversation => conversation.startedAt >= startOfMonth);
      case 'custom':
        if (!customDateRange.from) return conversations;
        const endDate = customDateRange.to || customDateRange.from;
        const endOfDay = new Date(endDate);
        endOfDay.setHours(23, 59, 59, 999);
        return conversations.filter(conversation => 
          conversation.startedAt >= customDateRange.from! && 
          conversation.startedAt <= endOfDay
        );
      default:
        return conversations;
    }
  }, [conversations, selectedRange, customDateRange]);

  const plotData = filteredConversations.map((conversation) => ({
    date: conversation.lastUpdated.getTime(), // Convert to timestamp for numeric x-axis
    dateString: conversation.lastUpdated.toLocaleDateString('en-US', { 
      month: 'short', 
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }),
    sentiment: getSentimentScore(conversation.sentiment),
    conversation: conversation,
    fill: getSentimentColor(conversation.sentiment)
  }));

  // Sort by date to ensure proper ordering
  plotData.sort((a, b) => a.date - b.date);

  function getSentimentColor(sentiment: string): string {
    const score = getSentimentScore(sentiment);
    if (score <= -2) return '#ef4444'; // red-500
    if (score === -1) return '#f97316'; // orange-500
    if (score === 0) return '#6b7280'; // gray-500
    if (score === 1) return '#eab308'; // yellow-500
    if (score >= 2) return '#22c55e'; // green-500
    return '#6b7280';
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-popover border rounded-lg p-3 shadow-md">
          <p className="font-medium">Conversation #{data.conversation.id}</p>
          <p className="text-sm text-muted-foreground">{data.conversation.summary}</p>
          <p className="text-sm">Sentiment: {data.conversation.sentiment} ({data.sentiment})</p>
          <p className="text-xs text-muted-foreground">Date: {data.dateString}</p>
          <p className="text-xs text-muted-foreground mt-1">Click to view details</p>
        </div>
      );
    }
    return null;
  };

  const handleScatterClick = (data: any) => {
    if (data && data.conversation) {
      onConversationClick(data.conversation);
    }
  };

  // Custom tick formatter for x-axis to show dates
  const formatXAxisTick = (tickItem: number) => {
    return new Date(tickItem).toLocaleDateString('en-US', { 
      month: 'short', 
      day: '2-digit' 
    });
  };

  // Calculate domain for x-axis based on data range
  const minDate = Math.min(...plotData.map(d => d.date));
  const maxDate = Math.max(...plotData.map(d => d.date));
  const padding = (maxDate - minDate) * 0.05; // Add 5% padding on each side

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Sentiment Distribution Over Time</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              View sentiment patterns across time periods
            </p>
            <div className="flex items-center gap-1 mt-1">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <p className="text-xs text-blue-600">Synced with Emotion Distribution</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant={selectedRange === 'today' ? 'default' : 'outline'}
              size="sm"
              onClick={() => onRangeChange('today')}
              className="h-8"
            >
              <Clock className="w-3 h-3 mr-1" />
              Today
            </Button>
            <Button
              variant={selectedRange === 'week' ? 'default' : 'outline'}
              size="sm"
              onClick={() => onRangeChange('week')}
              className="h-8"
            >
              <CalendarDays className="w-3 h-3 mr-1" />
              This Week
            </Button>
            <Button
              variant={selectedRange === 'month' ? 'default' : 'outline'}
              size="sm"
              onClick={() => onRangeChange('month')}
              className="h-8"
            >
              <Calendar className="w-3 h-3 mr-1" />
              This Month
            </Button>
            <Button
              variant={selectedRange === 'custom' ? 'default' : 'outline'}
              size="sm"
              onClick={() => onRangeChange('custom')}
              className="h-8"
            >
              <Settings className="w-3 h-3 mr-1" />
              Custom
            </Button>
            
            {selectedRange === 'custom' && (
              <DateRangePicker
                value={customDateRange}
                onChange={onCustomDateRangeChange}
                placeholder="Select date range"
                className="ml-2"
              />
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart
              data={plotData}
              margin={{ top: 20, right: 20, bottom: 60, left: 60 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                type="number" 
                dataKey="date" 
                name="Date"
                domain={[minDate - padding, maxDate + padding]}
                tickFormatter={formatXAxisTick}
                label={{ value: 'Date', position: 'insideBottom', offset: -40 }}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis 
                type="number" 
                dataKey="sentiment" 
                name="Sentiment"
                domain={[-3, 3]}
                ticks={[-3, -2, -1, 0, 1, 2, 3]}
                label={{ value: 'Sentiment Score', angle: -90, position: 'insideLeft' }}
                tickFormatter={(value) => {
                  const sentimentLabels: { [key: number]: string } = {
                    '-3': 'Strong Neg',
                    '-2': 'Mod Neg', 
                    '-1': 'Weak Neg',
                    '0': 'Neutral',
                    '1': 'Weak Pos',
                    '2': 'Mod Pos',
                    '3': 'Strong Pos'
                  };
                  return sentimentLabels[value] || value.toString();
                }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Scatter 
                name="Conversations" 
                dataKey="sentiment"
                onClick={handleScatterClick}
                className="cursor-pointer"
              >
                {plotData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>
        
        <div className="flex items-center justify-center gap-4 mt-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span>Strong Negative</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
            <span>Moderate Negative</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
            <span>Neutral</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <span>Moderate Positive</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span>Strong Positive</span>
          </div>
        </div>

        <div className="mt-4 space-y-2">
          <div className="text-center text-sm text-muted-foreground">
            <p>Hover over points to see conversation details • Click points to view full conversations</p>
          </div>
          <div className="text-center text-xs text-muted-foreground">
            Showing {filteredConversations.length} conversations in the selected time period
          </div>
        </div>
      </CardContent>
    </Card>
  );
}