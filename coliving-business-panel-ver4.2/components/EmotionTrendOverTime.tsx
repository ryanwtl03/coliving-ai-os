import { useMemo } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { Conversation, getEmotionColor } from '../lib/data';
import { Button } from './ui/button';
import { Calendar, CalendarDays, Clock, Settings } from 'lucide-react';
import { DateRangePicker, DateRange as CustomDateRange } from './DateRangePicker';

interface EmotionTrendOverTimeProps {
  conversations: Conversation[];
  selectedRange?: DateRangeType;
  customDateRange?: CustomDateRange;
  onRangeChange?: (range: DateRangeType) => void;
  onCustomDateRangeChange?: (dateRange: CustomDateRange) => void;
}

type DateRangeType = 'today' | 'week' | 'month' | 'custom';

export function EmotionTrendOverTime({ 
  conversations: conversations,
  selectedRange = 'week',
  customDateRange = { from: undefined, to: undefined },
  onRangeChange,
  onCustomDateRangeChange
}: EmotionTrendOverTimeProps) {

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
    if (filteredConversations.length === 0) return [];

    // Get date range for chart
    const dates = filteredConversations.map(t => t.startedAt).sort((a, b) => a.getTime() - b.getTime());
    const startDate = dates[0];
    const endDate = dates[dates.length - 1] || startDate;

    // Generate date points based on selected range
    const datePoints: Date[] = [];
    const current = new Date(startDate);
    
    if (selectedRange === 'today') {
      // Hourly intervals for today
      const startHour = new Date(current.getFullYear(), current.getMonth(), current.getDate());
      for (let i = 0; i < 24; i++) {
        const hourPoint = new Date(startHour);
        hourPoint.setHours(i);
        datePoints.push(hourPoint);
      }
    } else {
      // Daily intervals for week/month
      while (current <= endDate) {
        datePoints.push(new Date(current));
        current.setDate(current.getDate() + 1);
      }
    }

    return datePoints.map(date => {
      const dayConversations = filteredConversations.filter(conversation => {
        if (selectedRange === 'today') {
          // Same hour
          return conversation.startedAt.getHours() === date.getHours() &&
                 conversation.startedAt.toDateString() === date.toDateString();
        } else {
          // Same day
          return conversation.startedAt.toDateString() === date.toDateString();
        }
      });

      // Calculate average emotion intensity for this time period
      const emotionIntensities: { [key: string]: number[] } = {
        anger: [],
        fear: [],
        disgust: [],
        sadness: [],
        surprise: [],
        enjoyment: [],
        neutral: []
      };

      dayConversations.forEach(conversation => {
        conversation.messages.forEach(message => {
          Object.entries(message.emotionsCount).forEach(([emotion, score]) => {
            if (emotionIntensities.hasOwnProperty(emotion)) {
              emotionIntensities[emotion].push(score);
            }
          });
        });
      });

      // Calculate averages
      const avgEmotions: { [key: string]: number } = {};
      Object.entries(emotionIntensities).forEach(([emotion, scores]) => {
        avgEmotions[emotion] = scores.length > 0 
          ? Math.round((scores.reduce((sum, score) => sum + score, 0) / scores.length) * 100) / 100
          : 0;
      });

      return {
        date: selectedRange === 'today' 
          ? date.toLocaleTimeString('en-US', { hour: 'numeric' })
          : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        fullDate: date,
        ...avgEmotions
      };
    });
  }, [filteredConversations, selectedRange]);

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
            Emotion Trend Over Time
          </h3>
          <p className="text-sm text-gray-600">
            Average emotion intensity trends for {formatDateRange()}
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
          <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="date" 
              stroke="#666"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              stroke="#666"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              domain={[0, 1]}
              tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '12px'
              }}
              formatter={(value: number, name: string) => [`${(value * 100).toFixed(1)}%`, name]}
              labelFormatter={(date) => `Date: ${date}`}
            />
            <Legend 
              wrapperStyle={{ fontSize: '12px' }}
            />
            {emotions.map((emotion, index) => (
              <Line
                key={emotion}
                type="monotone"
                dataKey={emotion}
                stroke={getEmotionColor(emotion)}
                strokeWidth={2}
                dot={{ fill: getEmotionColor(emotion), strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6 }}
                name={emotion.charAt(0).toUpperCase() + emotion.slice(1)}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 text-xs text-gray-500">
        Showing average emotion intensity trends for {filteredConversations.length} conversations in the selected time period
      </div>
    </div>
  );
}