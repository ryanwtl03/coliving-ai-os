import { useEffect, useState } from "react";
import { Conversation, getSentimentColor } from "../lib/data";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "./ui/sheet";
import { Badge } from "./ui/badge";
import { ScrollArea } from "./ui/scroll-area";
import { Separator } from "./ui/separator";
import { Avatar, AvatarFallback } from "./ui/avatar";

interface ConversationDetailSheetProps {
  conversation: Conversation | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Tenant {
  id: string;
  name: string;
  age: number | null;
  gender: string | null;
  property: string;
  bigFivePersonality: {
    openness: number;
    conscientiousness: number;
    extraversion: number;
    agreeableness: number;
    neuroticism: number;
  };
}

interface Agent {
  id: string;
  name: string;
  role: string;
}

export function ConversationDetailSheet({
  conversation,
  open,
  onOpenChange,
}: ConversationDetailSheetProps) {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);

  useEffect(() => {
    // Fetch tenants
    fetch("http://127.0.0.1:4000/coliving-ai-os/chat-analysis/tenants")
      .then((res) => res.json())
      .then((data) => setTenants(data))
      .catch((err) => console.error("Error fetching tenants:", err));

    // Fetch agents
    fetch("http://127.0.0.1:4000/coliving-ai-os/chat-analysis/agents")
      .then((res) => res.json())
      .then((data) => setAgents(data))
      .catch((err) => console.error("Error fetching agents:", err));
  }, []);

  if (!conversation) return null;

  const tenant = tenants.find((t) => t.id === conversation.tenantId);
  const getAgent = (agentId: string) => agents.find((a) => a.id === agentId);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[600px] sm:max-w-[600px]">
        <SheetHeader>
          <SheetTitle>Conversation #{conversation.id}</SheetTitle>
          <SheetDescription>{conversation.summary}</SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          {/* Conversation Info */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
            <div>
              <label className="font-medium">Tenant:</label>
              <p>{tenant?.name || "Unknown Tenant"}</p>
            </div>
            <div>
              <label className="font-medium">Status:</label>
              <div className="mt-1">
                <Badge
                  variant={conversation.status === "Solved" ? "default" : "secondary"}
                  className={conversation.status === "Solved" ? "bg-green-600 text-white" : ""}
                >
                  {conversation.status}
                </Badge>
              </div>
            </div>
            <div>
              <label className="font-medium">Sentiment:</label>
              <div className="mt-1">
                <Badge className={`text-white ${getSentimentColor(conversation.sentiment)}`}>
                  {conversation.sentiment}
                </Badge>
              </div>
            </div>
            <div>
              <label className="font-medium">Agents:</label>
              <div className="flex flex-wrap gap-1 mt-1">
                {conversation.agentIds.map((agentId) => {
                  const agent = getAgent(agentId);
                  return agent ? (
                    <Badge key={agentId} variant="secondary">
                      {agent.name}
                    </Badge>
                  ) : null;
                })}
              </div>
            </div>
            <div>
              <label className="font-medium">Topics:</label>
              <div className="flex flex-wrap gap-1 mt-1">
                {conversation.topics.map((topic) => (
                  <Badge key={topic} variant="outline">
                    {topic}
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <label className="font-medium">Emotions:</label>
              <div className="flex flex-wrap gap-1 mt-1">
                {conversation.emotions.map((emotion) => (
                  <Badge key={emotion} variant="outline">
                    {emotion}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          <Separator />

          {/* Conversation Thread */}
          <div>
            <h3 className="font-medium mb-3">Conversation Thread</h3>
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-4">
                {conversation.messages.map((message) => {
                  const isFromTenant = message.senderType === "tenant";
                  const agent = isFromTenant ? null : getAgent(message.senderId);

                  return (
                    <div
                      key={message.id}
                      className={`flex gap-3 ${isFromTenant ? "flex-row-reverse" : ""}`}
                    >
                      <Avatar className="w-8 h-8 flex-shrink-0">
                        <AvatarFallback
                          className={
                            isFromTenant ? "bg-blue-500 text-white" : "bg-gray-500 text-white"
                          }
                        >
                          {isFromTenant ? tenant?.name?.charAt(0) : agent?.name?.charAt(0)}
                        </AvatarFallback>
                      </Avatar>

                      <div className={`flex-1 max-w-[80%] ${isFromTenant ? "text-right" : ""}`}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">
                            {isFromTenant ? tenant?.name : agent?.name}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {message.timestamp.toLocaleString("en-US", {
                              month: "short",
                              day: "2-digit",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>

                        <div
                          className={`p-3 rounded-lg ${
                            isFromTenant ? "bg-blue-500 text-white" : "bg-muted"
                          }`}
                        >
                          {message.content}
                        </div>

                        {/* Sentiment indicator */}
                        <div className={`mt-1 ${isFromTenant ? "text-right" : ""}`}>
                          <Badge
                            variant="secondary"
                            className={`text-xs ${getSentimentColor(conversation.sentiment)} text-white`}
                          >
                            Sentiment: {message.sentiment > 0 ? "+" : ""}
                            {message.sentiment}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
