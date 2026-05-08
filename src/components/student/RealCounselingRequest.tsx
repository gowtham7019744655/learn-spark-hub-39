import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { HeartHandshake, Loader2, Send, Clock, CheckCircle2, AlertCircle } from 'lucide-react';

interface Request {
  id: string;
  message: string | null;
  status: string;
  counselor_notes: string | null;
  created_at: string;
  updated_at: string;
}

const statusMeta: Record<string, { label: string; icon: any; variant: any }> = {
  pending: { label: 'Pending', icon: Clock, variant: 'secondary' },
  in_progress: { label: 'In Progress', icon: AlertCircle, variant: 'default' },
  resolved: { label: 'Resolved', icon: CheckCircle2, variant: 'outline' },
};

export const RealCounselingRequest = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('counseling_requests')
      .select('*')
      .eq('student_user_id', user.id)
      .order('created_at', { ascending: false });
    setRequests((data as Request[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchRequests();
    if (!user) return;
    const channel = supabase
      .channel('student-counseling-requests')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'counseling_requests', filter: `student_user_id=eq.${user.id}` }, () => fetchRequests())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const submit = async () => {
    if (!user) return;
    setSubmitting(true);
    const { error } = await supabase.from('counseling_requests').insert({
      student_user_id: user.id,
      student_usn: profile?.usn || null,
      student_name: profile?.full_name || null,
      student_email: profile?.email || user.email || null,
      message: message.trim() || null,
      status: 'pending',
    });
    setSubmitting(false);
    if (error) {
      toast({ variant: 'destructive', title: 'Could not send', description: error.message });
      return;
    }
    setMessage('');
    toast({ title: 'Request sent', description: 'A counselor has been notified and will reach out to you.' });
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
            <HeartHandshake className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-lg">Request Real Counseling</CardTitle>
            <CardDescription>Talk to a human counselor — they'll be notified immediately</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-2">
          <Textarea
            placeholder="Briefly describe what you'd like to talk about (optional)"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
            maxLength={1000}
          />
          <Button onClick={submit} disabled={submitting} className="gap-2">
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Notify Counselor
          </Button>
        </div>

        <div>
          <h4 className="mb-3 text-sm font-semibold text-foreground">Your Requests</h4>
          {loading ? (
            <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
          ) : requests.length === 0 ? (
            <p className="text-sm text-muted-foreground">No requests yet.</p>
          ) : (
            <div className="space-y-2">
              {requests.map((r) => {
                const meta = statusMeta[r.status] || statusMeta.pending;
                const Icon = meta.icon;
                return (
                  <div key={r.id} className="rounded-lg border border-border bg-muted/20 p-3">
                    <div className="flex items-center justify-between mb-1">
                      <Badge variant={meta.variant} className="gap-1"><Icon className="h-3 w-3" />{meta.label}</Badge>
                      <span className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString()}</span>
                    </div>
                    {r.message && <p className="text-sm text-foreground mt-1">{r.message}</p>}
                    {r.counselor_notes && (
                      <div className="mt-2 rounded border border-primary/30 bg-primary/5 p-2">
                        <p className="text-xs font-semibold text-primary mb-0.5">Counselor reply</p>
                        <p className="text-sm text-foreground">{r.counselor_notes}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
