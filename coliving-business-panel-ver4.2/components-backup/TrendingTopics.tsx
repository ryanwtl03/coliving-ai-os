import { useMemo } from 'react';
import { Conversation } from '../lib/data';
import { TrendingUp, TrendingDown, Hash } from 'lucide-react';

interface TrendingTopicsProps {
  conversations: Conversation[];
}

interface TopicTrend {
  topic: string;
  count: number;
  percentage: number;
  trend: 'up' | 'down' | 'stable';
  sentimentImpact: 'positive' | 'negative' | 'neutral';
}

export function TrendingTopics({ conversations: conversations }: TrendingTopicsProps) {
  const topicTrends = useMemo(() => {
    // Count topic occurrences
    const topicCounts: { [key: string]: number } = {};
    const topicSentiments: { [key: string]: number[] } = {};

    conversations.forEach(conversation => {
      conversation.topics.forEach(topic => {
        topicCounts[topic] = (topicCounts[topic] || 0) + 1;
        if (!topicSentiments[topic]) {
          topicSentiments[topic] = [];
        }
        // Convert sentiment to numeric for analysis
        const sentimentScore = getSentimentScore(conversation.sentiment);
        topicSentiments[topic].push(sentimentScore);
      });
    });

    // Calculate trends and sentiment impact
    const trends: TopicTrend[] = Object.entries(topicCounts).map(([topic, count]) => {
      const percentage = (count / conversations.length) * 100;
      
      // Calculate average sentiment for this topic
      const avgSentiment = topicSentiments[topic].reduce((a, b) => a + b, 0) / topicSentiments[topic].length;
      
      // Simulate trend data (in a real app, you'd compare with historical data)
      const trendValue = Math.random();
      const trend: 'up' | 'down' | 'stable' = trendValue > 0.6 ? 'up' : trendValue < 0.4 ? 'down' : 'stable';
      
      const sentimentImpact: 'positive' | 'negative' | 'neutral' = 
        avgSentiment > 0.5 ? 'positive' : 
        avgSentiment < -0.5 ? 'negative' : 'neutral';

      return {
        topic,
        count,
        percentage,
        trend,
        sentimentImpact
      };
    });

    // Sort by count descending
    return trends.sort((a, b) => b.count - a.count);
  }, [conversations]);

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

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-red-500" />;
      case 'down':
        return <TrendingDown className="w-4 h-4 text-green-500" />;
      default:
        return <Hash className="w-4 h-4 text-gray-400" />;
    }
  };

  const getSentimentBadgeColor = (impact: string) => {
    switch (impact) {
      case 'positive':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'negative':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="font-semibold text-gray-900">Trending Topics</h3>
          <p className="text-sm text-gray-600 mt-1">
            Most frequently discussed topics and their trends
          </p>
        </div>
        <div className="text-xs text-gray-500">
          Based on {conversations.length} conversations
        </div>
      </div>

      <div className="space-y-4">
        {topicTrends.slice(0, 6).map((topicTrend, index) => (
          <div key={topicTrend.topic} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 bg-white rounded-lg border border-gray-200">
                <span className="text-sm font-medium text-gray-600">
                  {index + 1}
                </span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900">{topicTrend.topic}</span>
                  {getTrendIcon(topicTrend.trend)}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm text-gray-600">
                    {topicTrend.count} conversations ({topicTrend.percentage.toFixed(1)}%)
                  </span>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs border ${getSentimentBadgeColor(topicTrend.sentimentImpact)}`}>
                    {topicTrend.sentimentImpact}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="w-24 bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(topicTrend.percentage, 100)}%` }}
                />
              </div>
              <span className="text-sm font-medium text-gray-900 min-w-[3rem] text-right">
                {topicTrend.percentage.toFixed(1)}%
              </span>
            </div>
          </div>
        ))}
      </div>

      {topicTrends.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <Hash className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>No topics to display</p>
        </div>
      )}
    </div>
  );
}