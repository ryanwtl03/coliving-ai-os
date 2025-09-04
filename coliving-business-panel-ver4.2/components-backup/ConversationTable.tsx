import { useState, useEffect, Fragment } from 'react';
import { Conversation, getSentimentColor, getConversationTrend, getTrendColor } from '../lib/data';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { HoverCard, HoverCardContent, HoverCardTrigger } from './ui/hover-card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { Collapsible, CollapsibleContent } from './ui/collapsible';
import { TenantTooltip } from './TenantTooltip';
import { SentimentTrendChart } from './SentimentTrendChart';
import { EmotionTrendChart } from './EmotionTrendChart';
import { ChevronDown, ChevronRight, MessageCircle, Hash, BarChart3, HelpCircle } from 'lucide-react';

interface ConversationTableProps {
  conversations: Conversation[];
  onConversationClick: (conversation: Conversation) => void;
}

interface Agent {
  id: string;
  name: string;
  role: string;
}

interface Tenant {
  id: string;
  name: string;
  property: string;
  age: number | null;
  gender: string | null;
  bigFivePersonality?: {
    openness: number;
    conscientiousness: number;
    extraversion: number;
    agreeableness: number;
    neuroticism: number;
  };
}

export function ConversationTable({ conversations, onConversationClick }: ConversationTableProps) {
  const [expandedConversations, setExpandedConversations] = useState<Set<string>>(new Set());
  const [agents, setAgents] = useState<Agent[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);

  // Fetch agents
  useEffect(() => {
    fetch("http://127.0.0.1:4000/coliving-ai-os/chat-analysis/agents")
      .then((res) => res.json())
      .then((data: Agent[]) => setAgents(data))
      .catch((err) => console.error("Error fetching agents:", err));
  }, []);

  // Fetch tenants
  useEffect(() => {
    fetch("http://127.0.0.1:4000/coliving-ai-os/chat-analysis/tenants")
      .then((res) => res.json())
      .then((data: Tenant[]) => setTenants(data))
      .catch((err) => console.error("Error fetching tenants:", err));
  }, []);

  const toggleExpanded = (conversationId: string) => {
    setExpandedConversations((prev) => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(conversationId)) {
        newExpanded.delete(conversationId);
      } else {
        newExpanded.add(conversationId);
      }
      return newExpanded;
    });
  };

  const getTenant = (tenantId: string) => tenants.find(t => t.id === tenantId);
  const getAgent = (agentId: string) => agents.find(a => a.id === agentId);

  return (
    <div className="w-full overflow-hidden">
      <div className="overflow-x-auto">
        <Table className="w-full">
          <TableHeader>
            <TableRow className="bg-gray-50/50 hover:bg-gray-50/50">
              <TableHead className="w-12 pl-6"></TableHead>
              <TableHead className="font-medium text-gray-700 w-32">Conversation</TableHead>
              <TableHead className="font-medium text-gray-700 w-40">Tenant</TableHead>
              <TableHead className="font-medium text-gray-700 w-44">Agents</TableHead>
              <TableHead className="font-medium text-gray-700 w-28">Status</TableHead>
              <TableHead className="font-medium text-gray-700 w-40">Sentiment</TableHead>
              <TableHead className="font-medium text-gray-700 w-24">Trend</TableHead>
              <TableHead className="font-medium text-gray-700 w-48">Emotions</TableHead>
              <TableHead className="font-medium text-gray-700 w-36">Topics</TableHead>
              <TableHead className="font-medium text-gray-700 min-w-96">Summary</TableHead>
              <TableHead className="font-medium text-gray-700 w-32">Started At</TableHead>
              <TableHead className="font-medium text-gray-700 w-32 pr-6">Last Updated</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {conversations.map((conversation) => {
              const tenant = getTenant(conversation.tenantId);
              const isExpanded = expandedConversations.has(conversation.id);

              return (
                <Fragment key={conversation.id}>
                  <TableRow className="border-b border-gray-100 hover:bg-gray-50/30 transition-colors">
                    {/* Expand button */}
                    <TableCell className="pl-6">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleExpanded(conversation.id)}
                        className="h-6 w-6 p-0 hover:bg-gray-100"
                      >
                        {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      </Button>
                    </TableCell>

                    {/* Conversation ID */}
                    <TableCell>
                      <div className="flex items-center gap-2 cursor-pointer group" onClick={() => onConversationClick(conversation)}>
                        <Hash className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-colors" />
                        <span className="font-mono text-sm text-gray-700 group-hover:text-blue-600 transition-colors">
                          {conversation.id}
                        </span>
                      </div>
                    </TableCell>

                    {/* Tenant */}
                    <TableCell>
                      {tenant ? (
                        <HoverCard openDelay={300} closeDelay={100}>
                          <HoverCardTrigger>
                            <div className="cursor-pointer">
                              <Button 
                                variant="link" 
                                className="p-0 h-auto font-medium text-blue-600 hover:text-blue-800"
                              >
                                {tenant.name}
                              </Button>
                            </div>
                          </HoverCardTrigger>
                          <HoverCardContent side="right" className="p-0 border-0">
                            <TenantTooltip tenant={tenant} />
                          </HoverCardContent>
                        </HoverCard>
                      ) : (
                        <Badge variant="outline" className="text-xs">Unknown Tenant ({conversation.tenantId})</Badge>
                      )}
                    </TableCell>

                    {/* Agents */}
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {conversation.agentIds.map(agentId => {
                          const agent = getAgent(agentId);
                          return agent ? (
                            <Badge 
                              key={agentId} 
                              variant="secondary" 
                              className="text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200"
                            >
                              {agent.name}
                            </Badge>
                          ) : (
                            <Badge key={agentId} variant="outline" className="text-xs">
                              Unknown Agent ({agentId})
                            </Badge>
                          );
                        })}
                      </div>
                    </TableCell>

                    <TableCell>
                      <Badge 
                        variant={conversation.status === 'Solved' ? 'default' : 'secondary'}
                        className={
                          conversation.status === 'Solved' 
                            ? 'bg-green-100 text-green-800 hover:bg-green-200 border-green-200' 
                            : 'bg-orange-100 text-orange-800 hover:bg-orange-200 border-orange-200'
                        }
                      >
                        {conversation.status}
                      </Badge>
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge 
                          className={`text-white ${getSentimentColor(conversation.sentiment)}`}
                        >
                          {conversation.sentiment}
                        </Badge>
                        <HoverCard openDelay={300} closeDelay={100}>
                          <HoverCardTrigger>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0 hover:bg-gray-100">
                              <BarChart3 className="h-3 w-3 text-gray-400 hover:text-blue-500" />
                            </Button>
                          </HoverCardTrigger>
                          <HoverCardContent side="top" className="p-0 border-0">
                            <SentimentTrendChart 
                              messages={conversation.messages} 
                              title="Sentiment Over Time"
                            />
                          </HoverCardContent>
                        </HoverCard>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <Badge 
                        variant="outline" 
                        className={`text-xs font-mono ${getTrendColor(conversation)}`}
                      >
                        {getConversationTrend(conversation)}
                      </Badge>
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="flex flex-wrap gap-1">
                          {conversation.emotions.map(emotion => (
                            <Badge 
                              key={emotion} 
                              variant="outline" 
                              className="text-xs border-gray-200"
                            >
                              {emotion}
                            </Badge>
                          ))}
                        </div>
                        <HoverCard openDelay={300} closeDelay={100}>
                          <HoverCardTrigger>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0 hover:bg-gray-100 flex-shrink-0">
                              <BarChart3 className="h-3 w-3 text-gray-400 hover:text-blue-500" />
                            </Button>
                          </HoverCardTrigger>
                          <HoverCardContent side="top" className="p-0 border-0">
                            <EmotionTrendChart 
                              messages={conversation.messages} 
                              title="Emotion Trends"
                            />
                          </HoverCardContent>
                        </HoverCard>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {conversation.topics.map(topic => (
                          <Badge 
                            key={topic} 
                            variant="outline" 
                            className="text-xs border-purple-200 text-purple-700 bg-purple-50 hover:bg-purple-100"
                          >
                            {topic}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    
                    <TableCell 
                      className="cursor-pointer group"
                      onClick={() => onConversationClick(conversation)}
                    >
                      <div className="flex items-start gap-2">
                        <MessageCircle className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-colors flex-shrink-0 mt-0.5" />
                        <span className="group-hover:text-blue-600 transition-colors leading-relaxed">
                          {conversation.summary}
                        </span>
                      </div>
                    </TableCell>
                    
                    <TableCell className="text-sm text-gray-500">
                      {conversation.startedAt.toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </TableCell>
                    
                    <TableCell className="text-sm text-gray-500 pr-6">
                      {conversation.lastUpdated.toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </TableCell>
                  </TableRow>

                  {isExpanded && (
                    <TableRow key={`${conversation.id}-expanded`}>
                      <TableCell colSpan={12} className="p-0 bg-gray-50/30">
                        <Collapsible open={isExpanded}>
                          <CollapsibleContent className="px-6 py-4">
                            <div className="space-y-4">
                              <div className="flex items-center gap-2">
                                <MessageCircle className="w-4 h-4 text-gray-500" />
                                <h4 className="font-medium text-gray-900">Conversation Preview</h4>
                                <Badge variant="outline" className="text-xs">
                                  {conversation.id}
                                </Badge>
                              </div>
                              <div className="space-y-3 max-h-48 overflow-y-auto bg-white rounded-lg p-4 border">
                                {conversation.messages.map((message) => (
                                  <div 
                                    key={message.id} 
                                    className={`flex gap-3 ${
                                      message.senderType === 'tenant' ? 'flex-row-reverse' : ''
                                    }`}
                                  >
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium ${
                                      message.senderType === 'tenant' ? 'bg-blue-500' : 'bg-gray-500'
                                    }`}>
                                      {message.senderType === 'tenant' 
                                        ? tenant?.name.charAt(0) 
                                        : getAgent(message.senderId)?.name.charAt(0)}
                                    </div>
                                    
                                    <div className={`flex-1 max-w-[80%] ${message.senderType === 'tenant' ? 'text-right' : ''}`}>
                                      <div className="flex items-center gap-2 mb-1">
                                        <span className="font-medium text-sm text-gray-900">
                                          {message.senderType === 'tenant' 
                                            ? tenant?.name 
                                            : getAgent(message.senderId)?.name}
                                        </span>
                                        <span className="text-xs text-gray-500">
                                          {message.timestamp.toLocaleTimeString('en-US', { 
                                            hour: '2-digit', 
                                            minute: '2-digit' 
                                          })}
                                        </span>
                                      </div>
                                      
                                      <div 
                                        className={`p-3 rounded-lg text-sm ${
                                          message.senderType === 'tenant' 
                                            ? 'bg-blue-500 text-white' 
                                            : 'bg-gray-100 text-gray-900'
                                        }`}
                                      >
                                        {message.content}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => onConversationClick(conversation)}
                                className="border-blue-200 text-blue-600 hover:bg-blue-50"
                              >
                                View Full Conversation
                              </Button>
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      </TableCell>
                    </TableRow>
                  )}
                </Fragment>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
