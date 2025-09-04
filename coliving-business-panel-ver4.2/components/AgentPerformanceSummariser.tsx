import { useState, useMemo } from 'react';
import { DateRange, DateRangePicker } from './DateRangePicker';
import { MonthPicker, MonthYear } from './MonthPicker';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { Calendar, Trophy, Medal, Award, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

type DateRangeType = 'today' | 'week' | 'month' | 'selectMonth' | 'custom';
type SortField = 'totalTickets' | 'resolutionRate' | 'avgSentiment' | 'positiveEmotions' | 'negativeEmotions';
type SortDirection = 'asc' | 'desc';

export interface AgentPerformanceSummariserProps {
  agentPerformance?: AgentPerformance[];
  selectedRange: DateRangeType;
  customDateRange: DateRange;
  selectedMonth: MonthYear | undefined;
  onRangeChange: (range: DateRangeType) => void;
  onCustomDateRangeChange: (range: DateRange) => void;
  onMonthChange: (month: MonthYear) => void;
}

export interface AgentPerformance {
  agentId: string;
  agentName: string;
  totalTickets: number;
  solvedTickets: number;
  resolutionRate: number;
  avgSentiment: number;
  sentimentBreakdown: { [key: string]: number };
  emotionBreakdown: { [key: string]: number };
  positiveEmotions: number;
  negativeEmotions: number;
  rank: number;
}

export function AgentPerformanceSummariser({
  agentPerformance = [],
  selectedRange,
  customDateRange,
  selectedMonth,
  onRangeChange,
  onCustomDateRangeChange,
  onMonthChange
}: AgentPerformanceSummariserProps) {

  const [sortField, setSortField] = useState<SortField>('resolutionRate');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [rankingCriteria, setRankingCriteria] = useState<'overall' | 'resolution' | 'sentiment'>('overall');

  const sortedData = useMemo(() => {
    const data = [...agentPerformance];

    // Ranking re-calculation if needed
    const ranked = [...data].sort((a, b) => {
      switch (rankingCriteria) {
        case 'resolution':
          return b.resolutionRate - a.resolutionRate;
        case 'sentiment':
          return b.avgSentiment - a.avgSentiment;
        case 'overall':
        default:
          const scoreA = (a.resolutionRate * 0.6) + (a.avgSentiment * 40);
          const scoreB = (b.resolutionRate * 0.6) + (b.avgSentiment * 40);
          return scoreB - scoreA;
      }
    });

    ranked.forEach((agent, index) => (agent.rank = index + 1));

    // Sorting UI table by selected column
    return ranked.sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      if (sortDirection === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });
  }, [agentPerformance, sortField, sortDirection, rankingCriteria]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown className="w-4 h-4" />;
    return sortDirection === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />;
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Trophy className="w-5 h-5 text-yellow-500" />;
      case 2: return <Medal className="w-5 h-5 text-gray-400" />;
      case 3: return <Award className="w-5 h-5 text-orange-600" />;
      default: return <span className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-xs font-medium text-gray-600">{rank}</span>;
    }
  };

  const getSentimentColor = (score: number) => {
    if (score > 0.5) return 'text-green-600';
    if (score < -0.5) return 'text-red-600';
    return 'text-gray-600';
  };

  const getSentimentBadgeColor = (score: number) => {
    if (score > 0.5) return 'bg-green-100 text-green-800';
    if (score < -0.5) return 'bg-red-100 text-red-800';
    return 'bg-gray-100 text-gray-800';
  };

  const formatDateRange = () => {
    if (selectedRange === 'custom' && customDateRange.from) {
      const from = customDateRange.from.toLocaleDateString();
      const to = customDateRange.to ? customDateRange.to.toLocaleDateString() : 'Present';
      return `${from} - ${to}`;
    }
    if (selectedRange === 'selectMonth' && selectedMonth) {
      const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];
      return `${months[selectedMonth.month]} ${selectedMonth.year}`;
    }
    switch (selectedRange) {
      case 'today': return 'Today';
      case 'week': return 'Past 7 days';
      case 'month': return 'Past 30 days';
      default: return 'All time';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">Agent Performance Summary</h3>
            <p className="text-gray-600 mt-1">Comparative analysis for {formatDateRange()}</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button variant={selectedRange === 'today' ? 'default' : 'outline'} size="sm" onClick={() => onRangeChange('today')}>Today</Button>
            <Button variant={selectedRange === 'week' ? 'default' : 'outline'} size="sm" onClick={() => onRangeChange('week')}>This Week</Button>
            <Button variant={selectedRange === 'month' ? 'default' : 'outline'} size="sm" onClick={() => onRangeChange('month')}>This Month</Button>
            <Button variant={selectedRange === 'selectMonth' ? 'default' : 'outline'} size="sm" onClick={() => onRangeChange('selectMonth')}>Select Month</Button>
            <Button variant={selectedRange === 'custom' ? 'default' : 'outline'} size="sm" onClick={() => onRangeChange('custom')}>Custom</Button>
          </div>
        </div>

        {selectedRange === 'selectMonth' && (
          <div className="mb-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-4">
              <Calendar className="w-5 h-5 text-gray-400" />
              <MonthPicker value={selectedMonth} onChange={onMonthChange} placeholder="Select a month" />
            </div>
          </div>
        )}
        {selectedRange === 'custom' && (
          <div className="mb-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-4">
              <Calendar className="w-5 h-5 text-gray-400" />
              <DateRangePicker value={customDateRange} onChange={onCustomDateRangeChange} />
            </div>
          </div>
        )}
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-gray-700">Ranking Criteria:</label>
          <Select value={rankingCriteria} onValueChange={(value: any) => setRankingCriteria(value)}>
            <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="overall">Overall Performance</SelectItem>
              <SelectItem value="resolution">Resolution Rate</SelectItem>
              <SelectItem value="sentiment">Sentiment Score</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">Rank</TableHead>
              <TableHead>Agent</TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort('totalTickets')}>
                <div className="flex items-center gap-2">Total Tickets {getSortIcon('totalTickets')}</div>
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort('resolutionRate')}>
                <div className="flex items-center gap-2">Resolution Rate {getSortIcon('resolutionRate')}</div>
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort('avgSentiment')}>
                <div className="flex items-center gap-2">Avg Sentiment {getSortIcon('avgSentiment')}</div>
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort('positiveEmotions')}>
                <div className="flex items-center gap-2">Positive Emotions {getSortIcon('positiveEmotions')}</div>
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort('negativeEmotions')}>
                <div className="flex items-center gap-2">Negative Emotions {getSortIcon('negativeEmotions')}</div>
              </TableHead>
              <TableHead>Performance</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedData.map(agent => (
              <TableRow key={agent.agentId}>
                <TableCell><div className="flex items-center justify-center">{getRankIcon(agent.rank)}</div></TableCell>
                <TableCell>
                  <div className="font-medium text-gray-900">{agent.agentName}</div>
                  <div className="text-sm text-gray-500">{agent.agentId}</div>
                </TableCell>
                <TableCell>
                  <div className="font-medium">{agent.totalTickets}</div>
                  <div className="text-sm text-gray-500">{agent.solvedTickets} solved</div>
                </TableCell>
                <TableCell>
                  <div className="font-medium">{agent.resolutionRate.toFixed(1)}%</div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                    <div className="bg-green-500 h-2 rounded-full transition-all" style={{ width: `${Math.min(agent.resolutionRate, 100)}%` }} />
                  </div>
                </TableCell>
                <TableCell>
                  <div className={`font-medium ${getSentimentColor(agent.avgSentiment)}`}>{agent.avgSentiment.toFixed(2)}</div>
                  <Badge variant="secondary" className={getSentimentBadgeColor(agent.avgSentiment)}>
                    {agent.avgSentiment > 0.5 ? 'Positive' : agent.avgSentiment < -0.5 ? 'Negative' : 'Neutral'}
                  </Badge>
                </TableCell>
                <TableCell><div className="text-green-600 font-medium">{agent.positiveEmotions}</div></TableCell>
                <TableCell><div className="text-red-600 font-medium">{agent.negativeEmotions}</div></TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    {agent.rank <= 3 && <Badge variant="secondary" className="w-fit">Top Performer</Badge>}
                    {agent.resolutionRate >= 90 && <Badge variant="secondary" className="bg-green-100 text-green-800 w-fit">High Resolution</Badge>}
                    {agent.avgSentiment > 1 && <Badge variant="secondary" className="bg-blue-100 text-blue-800 w-fit">Great Sentiment</Badge>}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {sortedData.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <Trophy className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>No agent performance data found for the selected period</p>
        </div>
      )}
    </div>
  );
}
