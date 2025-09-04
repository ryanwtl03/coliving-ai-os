import { Message } from '../lib/data';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { TrendingUp } from 'lucide-react';

interface SentimentTrendChartProps {
  messages: Message[];
  title: string;
}

export function SentimentTrendChart({ messages, title }: SentimentTrendChartProps) {
  const chartData = messages.map((message, index) => ({
    message: index + 1,
    sentiment: message.sentiment,
    time: message.timestamp.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    }),
    sender: message.senderType
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-lg">
          <p className="font-medium text-gray-900 mb-1">Message {label}</p>
          <p className="text-sm text-gray-600 mb-1">Time: {data.time}</p>
          <p className="text-sm text-gray-600 mb-2">From: {data.sender}</p>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${
              data.sentiment >= 1 ? 'bg-green-500' : 
              data.sentiment === 0 ? 'bg-gray-500' : 
              'bg-red-500'
            }`} />
            <span className="text-sm font-medium">
              Sentiment: {data.sentiment > 0 ? '+' : ''}{data.sentiment}
            </span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="w-80 border-0 shadow-lg">
      <CardHeader className="pb-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-lg">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-blue-600" />
          <CardTitle className="text-sm font-medium text-gray-900">{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <div className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <XAxis 
                dataKey="message" 
                axisLine={false}
                tickLine={false}
                className="text-xs"
                tick={{ fontSize: 11, fill: '#6b7280' }}
              />
              <YAxis 
                domain={[-3, 3]} 
                axisLine={false}
                tickLine={false}
                className="text-xs"
                tick={{ fontSize: 11, fill: '#6b7280' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line 
                type="monotone" 
                dataKey="sentiment" 
                stroke="#3b82f6"
                strokeWidth={3}
                dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#ffffff' }}
                activeDot={{ r: 6, fill: '#3b82f6', strokeWidth: 2, stroke: '#ffffff' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="flex justify-between text-xs text-gray-500">
            <span>Negative</span>
            <span>Neutral</span>
            <span>Positive</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}