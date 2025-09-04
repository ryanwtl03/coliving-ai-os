import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { ScrollArea } from './ui/scroll-area';
import { MessageCircle, X, Send } from 'lucide-react';
import { Badge } from './ui/badge';

interface ChatMessage {
  id: string;
  content: string;
  isFromUser: boolean;
  timestamp: Date;
}

export function AIChatAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      content: 'Hi! I\'m your AI assistant. I can help you with ticket analysis, sentiment summaries, and answer questions about customer conversations.',
      isFromUser: false,
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');

  const mockResponses = [
    "Based on recent tickets, 67% show negative sentiment, primarily related to maintenance and billing issues.",
    "Alice Johnson typically responds positively to quick resolution. Her personality profile suggests high agreeableness.",
    "The most common emotions this week are 'anger' and 'fear', often associated with billing and maintenance topics.",
    "Brian Lee's tickets show escalating sentiment patterns. Consider priority handling for his future requests.",
    "Noise complaints have increased 40% this month, particularly from Marina View units."
  ];

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: inputMessage,
      isFromUser: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');

    // Simulate AI response
    setTimeout(() => {
      const aiResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: mockResponses[Math.floor(Math.random() * mockResponses.length)],
        isFromUser: false,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiResponse]);
    }, 1000);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {!isOpen ? (
        <Button
          onClick={() => setIsOpen(true)}
          className="h-14 w-14 rounded-full shadow-lg hover:scale-105 transition-transform"
          size="icon"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      ) : (
        <Card className="w-80 h-96 shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">AI Assistant</CardTitle>
            <Button 
              variant="ghost" 
              size="icon"
              className="h-6 w-6"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          
          <CardContent className="p-0">
            <ScrollArea className="h-64 px-4">
              <div className="space-y-3 pb-4">
                {messages.map((message) => (
                  <div key={message.id} className={`flex ${message.isFromUser ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] p-2 rounded-lg text-sm ${
                      message.isFromUser 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-muted'
                    }`}>
                      {message.content}
                      <div className="text-xs opacity-70 mt-1">
                        {message.timestamp.toLocaleTimeString('en-US', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
            
            <div className="p-4 border-t">
              <div className="flex gap-2">
                <Input
                  placeholder="Ask about tickets, sentiment, or trends..."
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  className="text-sm"
                />
                <Button 
                  size="icon"
                  onClick={handleSendMessage}
                  className="flex-shrink-0"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="flex flex-wrap gap-1 mt-2">
                <Badge variant="outline" className="text-xs cursor-pointer hover:bg-muted">
                  Sentiment summary
                </Badge>
                <Badge variant="outline" className="text-xs cursor-pointer hover:bg-muted">
                  Topic trends
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}