import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Brain, Loader2, Send, ShieldAlert, Sparkles } from 'lucide-react';

type Msg = { role: 'user' | 'assistant'; content: string; risk?: 'low' | 'medium' | 'high'; flagged?: boolean };

const GREETING: Msg = {
  role: 'assistant',
  content:
    "Hi, I'm Aria — a safe space to talk about how you're feeling. Anything on your mind today, big or small?",
};

export const MentalHealthChat = () => {
  const { toast } = useToast();
  const [messages, setMessages] = useState<Msg[]>([GREETING]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    const next: Msg[] = [...messages, { role: 'user', content: text }];
    setMessages(next);
    setInput('');
    setLoading(true);
    try {
      const payload = next
        .filter((m) => m !== GREETING)
        .map(({ role, content }) => ({ role, content }));
      const { data, error } = await supabase.functions.invoke('mental-health-chat', {
        body: { messages: payload },
      });
      if (error) throw error;
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: data.reply,
          risk: data.risk_level,
          flagged: data.counseling_request_created,
        },
      ]);
      if (data.counseling_request_created) {
        toast({
          title: 'Counselor notified',
          description: "A counselor has been alerted and will reach out to you soon.",
        });
      }
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Chat error', description: e?.message || 'Try again' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
            <Brain className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-lg flex items-center gap-2">
              Aria — Wellness Companion
              <Badge variant="outline" className="gap-1"><Sparkles className="h-3 w-3" />AI</Badge>
            </CardTitle>
            <CardDescription>
              Talk freely about how you're feeling. If things sound serious, a counselor is automatically notified.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div
          ref={scrollRef}
          className="h-80 overflow-y-auto rounded-lg border border-border bg-muted/20 p-4 space-y-3"
        >
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm whitespace-pre-wrap ${
                  m.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-background border border-border text-foreground'
                }`}
              >
                {m.content}
                {m.flagged && (
                  <div className="mt-2 flex items-center gap-1 text-xs text-destructive">
                    <ShieldAlert className="h-3 w-3" /> Counselor notified
                  </div>
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="rounded-2xl bg-background border border-border px-4 py-2 text-sm text-muted-foreground flex items-center gap-2">
                <Loader2 className="h-3 w-3 animate-spin" /> Aria is typing…
              </div>
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <Input
            placeholder="Share what's on your mind…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), send())}
            disabled={loading}
            maxLength={1000}
          />
          <Button onClick={send} disabled={loading || !input.trim()} className="gap-2">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Send
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Aria is an AI companion, not a therapist. In an emergency, please contact a trusted adult or local helpline immediately.
        </p>
      </CardContent>
    </Card>
  );
};
