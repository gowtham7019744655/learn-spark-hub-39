import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Navigate } from 'react-router-dom';
import { Bot, Send, User } from 'lucide-react';

interface Message {
  id: number;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

const quickQuestions = [
  'What is my current GPA?',
  'Show me upcoming assignments',
  'Explain the grading system',
  'How can I improve my grades?',
];

const ChatbotPage = () => {
  const { isAuthenticated, role } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: "Hello! I'm your AI academic assistant. How can I help you today?",
      sender: 'bot',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: messages.length + 1,
      text: input,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);

    // Simulate bot response
    setTimeout(() => {
      const botResponse: Message = {
        id: messages.length + 2,
        text: getBotResponse(input),
        sender: 'bot',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botResponse]);
    }, 1000);

    setInput('');
  };

  const getBotResponse = (question: string): string => {
    const lowerQuestion = question.toLowerCase();

    if (lowerQuestion.includes('gpa')) {
      return 'Based on your current grades, your GPA is 3.8. You are performing excellently! Keep up the great work.';
    }
    if (lowerQuestion.includes('assignment') || lowerQuestion.includes('upcoming')) {
      return 'You have 3 upcoming assignments:\n1. Calculus Problem Set (Due in 2 days)\n2. Physics Lab Report (Due in 5 days)\n3. Essay Draft (Due in 1 week)';
    }
    if (lowerQuestion.includes('grading')) {
      return 'Our grading system uses a standard letter grade scale:\nA: 90-100%\nB: 80-89%\nC: 70-79%\nD: 60-69%\nF: Below 60%\nYour GPA is calculated based on these letter grades.';
    }
    if (lowerQuestion.includes('improve')) {
      return 'Here are some tips to improve your grades:\n1. Attend all classes and take notes\n2. Review material regularly, not just before exams\n3. Form study groups with classmates\n4. Use office hours to get help from professors\n5. Practice with past exams and assignments';
    }

    return "I understand you're asking about your academics. Could you please be more specific? I can help with GPA calculations, assignment tracking, study tips, and more.";
  };

  const handleQuickQuestion = (question: string) => {
    setInput(question);
  };

  return (
    <MainLayout>
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <Card className="flex h-[calc(100vh-12rem)] flex-col">
          <CardHeader className="border-b border-border">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2">
                <Bot className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle>AI Academic Assistant</CardTitle>
                <CardDescription>
                  Ask me anything about your academics
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="flex flex-1 flex-col p-0">
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex items-start gap-3 ${
                      message.sender === 'user' ? 'flex-row-reverse' : ''
                    }`}
                  >
                    <div
                      className={`rounded-full p-2 ${
                        message.sender === 'user'
                          ? 'bg-primary'
                          : 'bg-secondary'
                      }`}
                    >
                      {message.sender === 'user' ? (
                        <User className="h-4 w-4 text-primary-foreground" />
                      ) : (
                        <Bot className="h-4 w-4 text-secondary-foreground" />
                      )}
                    </div>
                    <div
                      className={`max-w-[80%] rounded-lg p-3 ${
                        message.sender === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-foreground'
                      }`}
                    >
                      <p className="whitespace-pre-line text-sm">{message.text}</p>
                      <p
                        className={`mt-1 text-xs ${
                          message.sender === 'user'
                            ? 'text-primary-foreground/70'
                            : 'text-muted-foreground'
                        }`}
                      >
                        {message.timestamp.toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            {/* Quick Questions */}
            <div className="border-t border-border p-4">
              <p className="mb-2 text-sm text-muted-foreground">Quick questions:</p>
              <div className="flex flex-wrap gap-2">
                {quickQuestions.map((question, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickQuestion(question)}
                  >
                    {question}
                  </Button>
                ))}
              </div>
            </div>

            {/* Input Area */}
            <div className="border-t border-border p-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Type your message..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  className="flex-1"
                />
                <Button onClick={handleSend}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default ChatbotPage;
