import { useMemo } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { Conversation, topicTypes, getEmotionColor } from '../lib/data';
import { Button } from './ui/button';
import { Calendar, CalendarDays, Clock, Settings } from 'lucide-react';
import { DateRangePicker, DateRange as CustomDateRange } from './DateRangePicker';

interface EmotionByServiceAreaProps {
  conversations: Conversation[];
  selectedRange?: DateRangeType;
  customDateRange?: CustomDateRange;
  onRangeChange?: (range: DateRangeType) => void;
  onCustomDateRangeChange?: (dateRange: CustomDateRange) => void;
}

type DateRangeType = 'today' | 'week' | 'month' | 'custom';

export function EmotionByServiceArea({ 
  conversations: conversations,
  selectedRange = 'week',
  customDateRange = { from: undefined, to: undefined },
  onRangeChange,
  onCustomDateRangeChange
}: EmotionByServiceAreaProps) {

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

  const chartData = useMemo(() => {
    return topicTypes.map(topic => {
      const topicConversations = filteredConversations.filter(conversation => 
        conversation.topics.includes(topic)
      );

      // Count emotions for this service area
      const emotionCounts: { [key: string]: number } = {
        anger: 0,
        fear: 0,
        disgust: 0,
        sadness: 0,
        surprise: 0,
        enjoyment: 0,
        neutral: 0
      };

      topicConversations.forEach(conversation => {
        conversation.emotions.forEach(emotion => {
          if (emotionCounts.hasOwnProperty(emotion)) {
            emotionCounts[emotion]++;
          }
        });
      });

      return {
        serviceArea: topic,
        totalConversations: topicConversations.length,
        ...emotionCounts
      };
    }).filter(data => data.totalConversations > 0);
  }, [filteredConversations]);

  const emotions = ['anger', 'fear', 'disgust', 'sadness', 'surprise', 'enjoyment', 'neutral'];

  const formatDateRange = () => {
    if (selectedRange === 'custom' && customDateRange.from) {
      const from = customDateRange.from.toLocaleDateString();
      const to = customDateRange.to ? customDateRange.to.toLocaleDateString() : 'Present';
      return `${from} - ${to}`;
    }
    const ranges = {
      today: 'Today',
      week: 'This Week',
      month: 'This Month'
    };
    return ranges[selectedRange] || 'All time';
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Emotion by Service Area
          </h3>
          <p className="text-sm text-gray-600">
            Emotion distribution across service categories for {formatDateRange()}
          </p>
        </div>
        
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant={selectedRange === 'today' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onRangeChange?.('today')}
            className="h-8"
          >
            <Clock className="w-3 h-3 mr-1" />
            Today
          </Button>
          <Button
            variant={selectedRange === 'week' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onRangeChange?.('week')}
            className="h-8"
          >
            <CalendarDays className="w-3 h-3 mr-1" />
            Week
          </Button>
          <Button
            variant={selectedRange === 'month' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onRangeChange?.('month')}
            className="h-8"
          >
            <Calendar className="w-3 h-3 mr-1" />
            Month
          </Button>
          <Button
            variant={selectedRange === 'custom' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onRangeChange?.('custom')}
            className="h-8"
          >
            <Settings className="w-3 h-3 mr-1" />
            Custom
          </Button>
        </div>
      </div>

      {selectedRange === 'custom' && (
        <div className="flex items-center gap-4 mb-6">
          <Calendar className="w-4 h-4 text-gray-400" />
          <DateRangePicker
            value={customDateRange}
            onChange={onCustomDateRangeChange || (() => {})}
          />
        </div>
      )}

      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart 
            data={chartData} 
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            layout="horizontal"
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              type="number"
              stroke="#666"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              type="category"
              dataKey="serviceArea"
              stroke="#666"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              width={80}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '12px'
              }}
              formatter={(value: number, name: string) => [value, name]}
              labelFormatter={(serviceArea) => `Service Area: ${serviceArea}`}
            />
            <Legend 
              wrapperStyle={{ fontSize: '12px' }}
            />
            {emotions.map((emotion, index) => (
              <Bar
                key={emotion}
                dataKey={emotion}
                stackId="emotions"
                fill={getEmotionColor(emotion)}
                name={emotion.charAt(0).toUpperCase() + emotion.slice(1)}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 text-xs text-gray-500">
        Showing emotion distribution across service areas for {filteredConversations.length} conversations in the selected time period
      </div>
    </div>
  );
}