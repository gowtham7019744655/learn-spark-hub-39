import { useCallback, useState } from 'react';
import { useConversation, ConversationProvider } from '@elevenlabs/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Mic, MicOff, Loader2, Sparkles, Compass, MessageCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const AGENT_ID = 'agent_0701kk6bqs4kfxsszw9p8p5bn4m9';

const CareerCoachInner = () => {
  const [connecting, setConnecting] = useState(false);

  const conversation = useConversation({
    onConnect: () => {
      toast({ title: 'Connected', description: 'Your career coach is ready to talk.' });
    },
    onDisconnect: () => {
      toast({ title: 'Session ended', description: 'Career coach disconnected.' });
    },
    onError: (error) => {
      console.error('Career coach error:', error);
      toast({
        variant: 'destructive',
        title: 'Connection error',
        description: 'Unable to reach the career coach. Please try again.',
      });
    },
  });

  const isConnected = conversation.status === 'connected';

  const start = useCallback(async () => {
    try {
      setConnecting(true);
      await navigator.mediaDevices.getUserMedia({ audio: true });
      await conversation.startSession({
        agentId: AGENT_ID,
        connectionType: 'websocket',
      });
    } catch (err) {
      console.error(err);
      toast({
        variant: 'destructive',
        title: 'Microphone access required',
        description: 'Please allow microphone access to talk with your career coach.',
      });
    } finally {
      setConnecting(false);
    }
  }, [conversation]);

  const stop = useCallback(async () => {
    await conversation.endSession();
  }, [conversation]);

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Compass className="h-5 w-5 text-primary" />
                AI Career Coach
              </CardTitle>
              <CardDescription>
                Have a real-time voice conversation with your personal career advisor.
              </CardDescription>
            </div>
            <Badge variant={isConnected ? 'default' : 'outline'}>
              {isConnected ? 'Live' : 'Offline'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="relative flex flex-col items-center justify-center gap-6 rounded-2xl border border-border bg-gradient-to-br from-primary/5 via-background to-primary/10 px-6 py-12">
            {/* Animated mic orb */}
            <div className="relative">
              {isConnected && (
                <>
                  <div className="absolute inset-0 animate-ping rounded-full bg-primary/30" />
                  {conversation.isSpeaking && (
                    <div className="absolute -inset-4 animate-pulse rounded-full bg-primary/20" />
                  )}
                </>
              )}
              <div
                className={`relative flex h-28 w-28 items-center justify-center rounded-full border-4 transition-all ${
                  isConnected
                    ? 'border-primary bg-primary/10 shadow-lg shadow-primary/30'
                    : 'border-border bg-muted/30'
                }`}
              >
                {isConnected ? (
                  <Mic className="h-10 w-10 text-primary" />
                ) : (
                  <MicOff className="h-10 w-10 text-muted-foreground" />
                )}
              </div>
            </div>

            <div className="text-center">
              <p className="text-lg font-semibold text-foreground">
                {isConnected
                  ? conversation.isSpeaking
                    ? 'Coach is speaking…'
                    : 'Listening…'
                  : 'Tap below to start your session'}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Ask about careers, skills, internships, or what to study next.
              </p>
            </div>

            {!isConnected ? (
              <Button size="lg" onClick={start} disabled={connecting} className="gap-2">
                {connecting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Connecting…
                  </>
                ) : (
                  <>
                    <Mic className="h-4 w-4" />
                    Start Conversation
                  </>
                )}
              </Button>
            ) : (
              <Button size="lg" variant="destructive" onClick={stop} className="gap-2">
                <MicOff className="h-4 w-4" />
                End Session
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { icon: Sparkles, title: 'Personalized advice', desc: 'Get guidance tailored to your interests and goals.' },
          { icon: MessageCircle, title: 'Natural conversation', desc: 'Speak naturally — no scripts or forms.' },
          { icon: Compass, title: 'Career clarity', desc: 'Explore paths in tech, research, business, and beyond.' },
        ].map((f) => (
          <Card key={f.title} className="transition-all hover:shadow-md">
            <CardContent className="flex flex-col gap-2 p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <f.icon className="h-5 w-5 text-primary" />
              </div>
              <p className="font-semibold text-foreground">{f.title}</p>
              <p className="text-sm text-muted-foreground">{f.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export const CareerCoach = () => (
  <ConversationProvider>
    <CareerCoachInner />
  </ConversationProvider>
);
