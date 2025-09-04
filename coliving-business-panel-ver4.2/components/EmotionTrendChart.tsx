import { Message, getEmotionColor } from '../lib/data';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

interface EmotionTrendChartProps {
  messages: Message[];
  title: string;
}

export function EmotionTrendChart({ messages, title }: EmotionTrendChartProps) {
  const allEmotions = Array.from(
    new Set(messages.flatMap(m => Object.keys(m.emotionsCount)))
  ).filter(emotion => emotion !== 'neutral');

  const chartData = messages.map((message, index) => {
  const total = Object.values(message.emotionsCount).reduce((a, b) => a + b, 0) || 1;

  const dataPoint: any = {
    message: index + 1,
    time: message.timestamp.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  };
  
  allEmotions.forEach(emotion => {
    // normalize count into percentage (0–1)
    dataPoint[emotion] = (message.emotionsCount[emotion] || 0) / total;
  });
  
  return dataPoint;
});

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-popover border rounded-lg p-3 shadow-md">
          <p className="font-medium mb-2">Message {label}</p>
          {payload.map((entry: any) => (
            <div key={entry.dataKey} className="flex items-center gap-2 text-sm">
              <div 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span>{entry.dataKey}: {(entry.value * 100).toFixed(0)}%</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="w-96">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <XAxis 
                dataKey="message" 
                axisLine={false}
                tickLine={false}
                className="text-xs"
              />
              <YAxis 
                domain={[0, 1]} 
                axisLine={false}
                tickLine={false}
                className="text-xs"
                tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              {allEmotions.map(emotion => (
                <Line 
                  key={emotion}
                  type="monotone" 
                  dataKey={emotion} 
                  stroke={getEmotionColor(emotion)}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  name={emotion}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}