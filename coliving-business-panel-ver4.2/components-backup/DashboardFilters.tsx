import { useState, useEffect } from "react";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { sentimentLevels, emotionTypes, topicTypes } from "../lib/data";
import { Search, Filter, X } from "lucide-react";

export interface FilterState {
  search: string;
  status: string;
  sentiment: string;
  emotions: string[];
  topics: string[];
  agent: string;
}

interface DashboardFiltersProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
}

interface Agent {
  id: string;
  name: string;
  role: string;
}

export function DashboardFilters({ filters, onFiltersChange }: DashboardFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [agents, setAgents] = useState<Agent[]>([]);

  useEffect(() => {
    fetch("http://127.0.0.1:4000/coliving-ai-os/chat-analysis/agents")
      .then((res) => res.json())
      .then((data) => setAgents(data))
      .catch((err) => console.error("Error fetching agents:", err));
  }, []);

  const updateFilter = (key: keyof FilterState, value: any) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const toggleEmotion = (emotion: string) => {
    const newEmotions = filters.emotions.includes(emotion)
      ? filters.emotions.filter((e) => e !== emotion)
      : [...filters.emotions, emotion];
    updateFilter("emotions", newEmotions);
  };

  const toggleTopic = (topic: string) => {
    const newTopics = filters.topics.includes(topic)
      ? filters.topics.filter((t) => t !== topic)
      : [...filters.topics, topic];
    updateFilter("topics", newTopics);
  };

  const clearFilters = () => {
    onFiltersChange({
      search: "",
      status: "all",
      sentiment: "all",
      emotions: [],
      topics: [],
      agent: "all",
    });
  };

  const activeFiltersCount =
    (filters.search ? 1 : 0) +
    (filters.status !== "all" ? 1 : 0) +
    (filters.sentiment !== "all" ? 1 : 0) +
    filters.emotions.length +
    filters.topics.length +
    (filters.agent !== "all" ? 1 : 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tickets, tenants, or summaries..."
            value={filters.search}
            onChange={(e) => updateFilter("search", e.target.value)}
            className="pl-10"
          />
        </div>

        <Button
          variant="outline"
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2"
        >
          <Filter className="h-4 w-4" />
          Filters
          {activeFiltersCount > 0 && (
            <Badge variant="secondary" className="ml-1">
              {activeFiltersCount}
            </Badge>
          )}
        </Button>

        {activeFiltersCount > 0 && (
          <Button variant="ghost" onClick={clearFilters} size="sm">
            <X className="h-4 w-4" />
            Clear
          </Button>
        )}
      </div>

      {isExpanded && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border rounded-lg bg-muted/30">
          {/* Status Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Status</label>
            <Select
              value={filters.status}
              onValueChange={(value) => updateFilter("status", value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="In Progress">In Progress</SelectItem>
                <SelectItem value="solved">Solved</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Sentiment Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Sentiment</label>
            <Select
              value={filters.sentiment}
              onValueChange={(value) => updateFilter("sentiment", value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {sentimentLevels.map((sentiment) => (
                  <SelectItem key={sentiment} value={sentiment}>
                    {sentiment}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Agent Filter (Dynamic from API) */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Agent</label>
            <Select
              value={filters.agent}
              onValueChange={(value) => updateFilter("agent", value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {agents.map((agent) => (
                  <SelectItem key={agent.id} value={agent.name}>
                    {agent.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Emotions Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Emotions</label>
            <div className="flex flex-wrap gap-2">
              {emotionTypes.map((emotion) => (
                <Badge
                  key={emotion}
                  variant={filters.emotions.includes(emotion) ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => toggleEmotion(emotion)}
                >
                  {emotion}
                </Badge>
              ))}
            </div>
          </div>

          {/* Topics Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Topics</label>
            <div className="flex flex-wrap gap-2">
              {topicTypes.map((topic) => (
                <Badge
                  key={topic}
                  variant={filters.topics.includes(topic) ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => toggleTopic(topic)}
                >
                  {topic}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
