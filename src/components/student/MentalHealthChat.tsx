import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Brain, Loader2, Send, ShieldAlert, Sparkles, HeartHandshake, CheckCircle2 } from 'lucide-react';

type Msg = {
  role: 'user' | 'assistant';
  content: string;
  risk?: 'low' | 'medium' | 'high';
  summary?: string;
  requestSent?: boolean;
};

const GREETING: Msg = {
  role: 'assistant',
  content:
    "Hi, I'm Aria — a safe space to talk about how you're feeling. Anything on your mind today, big or small?",
};

export const MentalHealthChat = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Msg[]>([GREETING]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sendingIdx, setSendingIdx] = useState<number | null>(null);
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
          summary: data.summary,
        },
      ]);
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Chat error', description: e?.message || 'Try again' });
    } finally {
      setLoading(false);
    }
  };

  const notifyCounselor = async (idx: number) => {
    if (!user) return;
    const msg = messages[idx];
    setSendingIdx(idx);
    const { error } = await supabase.from('counseling_requests').insert({
      student_user_id: user.id,
      student_usn: profile?.usn || null,
      student_name: profile?.full_name || null,
      student_email: profile?.email || user.email || null,
      message: `[From Aria — ${msg.risk?.toUpperCase()} concern] ${msg.summary || 'Student requested counselor support during AI wellness chat.'}`,
      status: 'pending',
    });
    setSendingIdx(null);
    if (error) {
      toast({ variant: 'destructive', title: 'Could not send', description: error.message });
      return;
    }
    setMessages((prev) => prev.map((m, i) => (i === idx ? { ...m, requestSent: true } : m)));
    toast({ title: 'Counselor notified', description: 'A counselor will reach out to you soon.' });
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
              Talk freely about how you're feeling. If things sound serious, Aria will offer to alert a counselor.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div
          ref={scrollRef}
          className="h-80 overflow-y-auto rounded-lg border border-border bg-muted/20 p-4 space-y-3"
        >
          {messages.map((m, i) => {
            const showOption = m.role === 'assistant' && (m.risk === 'high' || m.risk === 'medium');
            return (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm whitespace-pre-wrap ${
                    m.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-background border border-border text-foreground'
                  }`}
                >
                  {m.content}
                  {showOption && (
                    <div className={`mt-3 rounded-lg border p-2 ${m.risk === 'high' ? 'border-destructive/40 bg-destructive/5' : 'border-yellow-500/40 bg-yellow-500/5'}`}>
                      <div className="flex items-center gap-1 text-xs font-medium mb-2">
                        <ShieldAlert className={`h-3 w-3 ${m.risk === 'high' ? 'text-destructive' : 'text-yellow-600'}`} />
                        {m.risk === 'high' ? 'This sounds serious' : 'You don\'t have to go through this alone'}
                      </div>
                      {m.requestSent ? (
                        <div className="flex items-center gap-1 text-xs text-primary">
                          <CheckCircle2 className="h-3 w-3" /> Counselor has been notified
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant={m.risk === 'high' ? 'destructive' : 'default'}
                          className="gap-1 h-7 text-xs"
                          disabled={sendingIdx === i}
                          onClick={() => notifyCounselor(i)}
                        >
                          {sendingIdx === i ? <Loader2 className="h-3 w-3 animate-spin" /> : <HeartHandshake className="h-3 w-3" />}
                          Send request to counselor
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
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
