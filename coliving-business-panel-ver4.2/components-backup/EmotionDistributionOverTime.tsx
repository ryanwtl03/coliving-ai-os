import { useMemo } from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { Conversation, getEmotionColor } from '../lib/data';
import { Button } from './ui/button';
import { Calendar, CalendarDays, Clock, Settings } from 'lucide-react';
import { DateRangePicker, DateRange } from './DateRangePicker';

type DateRangeType = 'today' | 'week' | 'month' | 'custom';

interface EmotionDistributionOverTimeProps {
  conversations: Conversation[];
  selectedRange: DateRangeType;
  customDateRange: DateRange;
  onRangeChange: (range: DateRangeType) => void;
  onCustomDateRangeChange: (range: DateRange) => void;
}

export function EmotionDistributionOverTime({ 
  conversations: tickets, 
  selectedRange, 
  customDateRange, 
  onRangeChange, 
  onCustomDateRangeChange 
}: EmotionDistributionOverTimeProps) {

  // Filter tickets based on selected date range
  const filteredTickets = useMemo(() => {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(startOfDay);
    startOfWeek.setDate(startOfDay.getDate() - startOfDay.getDay());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    switch (selectedRange) {
      case 'today':
        return tickets.filter(ticket => ticket.startedAt >= startOfDay);
      case 'week':
        return tickets.filter(ticket => ticket.startedAt >= startOfWeek);
      case 'month':
        return tickets.filter(ticket => ticket.startedAt >= startOfMonth);
      case 'custom':
        if (!customDateRange.from) return tickets;
        const endDate = customDateRange.to || customDateRange.from;
        const endOfDay = new Date(endDate);
        endOfDay.setHours(23, 59, 59, 999);
        return tickets.filter(ticket => 
          ticket.startedAt >= customDateRange.from! && 
          ticket.startedAt <= endOfDay
        );
      default:
        return tickets;
    }
  }, [tickets, selectedRange, customDateRange]);

  const chartData = useMemo(() => {
    if (filteredTickets.length === 0) return [];

    // Get date range for chart
    const dates = filteredTickets.map(t => t.startedAt).sort((a, b) => a.getTime() - b.getTime());
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
      const dayTickets = filteredTickets.filter(ticket => {
        if (selectedRange === 'today') {
          // Same hour
          return ticket.startedAt.getHours() === date.getHours() &&
                 ticket.startedAt.toDateString() === date.toDateString();
        } else {
          // Same day
          return ticket.startedAt.toDateString() === date.toDateString();
        }
      });

      // Count emotions for this time period
      const emotionCounts: { [key: string]: number } = {
        anger: 0,
        fear: 0,
        disgust: 0,
        sadness: 0,
        surprise: 0,
        enjoyment: 0,
        neutral: 0
      };

      dayTickets.forEach(ticket => {
        ticket.emotions.forEach(emotion => {
          if (emotionCounts.hasOwnProperty(emotion)) {
            emotionCounts[emotion]++;
          }
        });
      });

      return {
        date: selectedRange === 'today' 
          ? date.toLocaleTimeString('en-US', { hour: 'numeric' })
          : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        fullDate: date,
        ...emotionCounts
      };
    });
  }, [filteredTickets, selectedRange]);

  const emotions = ['anger', 'fear', 'disgust', 'sadness', 'surprise', 'enjoyment', 'neutral'];

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Emotion Distribution Over Time
          </h3>
          <p className="text-sm text-gray-600">
            Track how different emotions appear across conversations over time
          </p>
          <div className="flex items-center gap-1 mt-1">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <p className="text-xs text-blue-600">Synced with Sentiment Distribution</p>
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

      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
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
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '12px'
              }}
              formatter={(value: number, name: string) => [value, name]}
              labelFormatter={(date) => `Date: ${date}`}
            />
            <Legend 
              wrapperStyle={{ fontSize: '12px' }}
            />
            {emotions.map((emotion, index) => (
              <Area
                key={emotion}
                type="monotone"
                dataKey={emotion}
                stackId="1"
                stroke={getEmotionColor(emotion)}
                fill={getEmotionColor(emotion)}
                fillOpacity={0.7}
                name={emotion.charAt(0).toUpperCase() + emotion.slice(1)}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 text-xs text-gray-500">
        Showing emotion distribution for {filteredTickets.length} tickets in the selected time period
      </div>
    </div>
  );
}