import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { HeartHandshake, Loader2, Bell } from 'lucide-react';

interface Request {
  id: string;
  student_user_id: string;
  student_usn: string | null;
  student_name: string | null;
  student_email: string | null;
  message: string | null;
  status: string;
  counselor_notes: string | null;
  created_at: string;
}

export const CounselingRequestsTracker = () => {
  const { toast } = useToast();
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  const fetchAll = async () => {
    const { data } = await supabase
      .from('counseling_requests')
      .select('*')
      .order('created_at', { ascending: false });
    setRequests((data as Request[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchAll();
    const channel = supabase
      .channel('counselor-requests')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'counseling_requests' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          const r = payload.new as Request;
          toast({ title: 'New counseling request', description: `${r.student_name || r.student_usn || 'A student'} requested counseling.` });
        }
        fetchAll();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const update = async (id: string, patch: Partial<Request>) => {
    const { error } = await supabase.from('counseling_requests').update(patch).eq('id', id);
    if (error) toast({ variant: 'destructive', title: 'Update failed', description: error.message });
    else toast({ title: 'Updated' });
  };

  const pending = requests.filter(r => r.status === 'pending').length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
              <HeartHandshake className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Counseling Requests</CardTitle>
              <CardDescription>Live notifications from students requesting counseling</CardDescription>
            </div>
          </div>
          {pending > 0 && (
            <Badge variant="destructive" className="gap-1"><Bell className="h-3 w-3" />{pending} pending</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : requests.length === 0 ? (
          <p className="py-8 text-center text-muted-foreground">No counseling requests yet.</p>
        ) : (
          <div className="space-y-3">
            {requests.map((r) => (
              <div key={r.id} className="rounded-xl border border-border p-4 space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-foreground">{r.student_name || 'Unnamed'} {r.student_usn && <span className="text-muted-foreground font-normal">({r.student_usn})</span>}</p>
                    <p className="text-xs text-muted-foreground">{r.student_email} · {new Date(r.created_at).toLocaleString()}</p>
                  </div>
                  <Select value={r.status} onValueChange={(v) => update(r.id, { status: v })}>
                    <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {r.message && <p className="text-sm text-foreground rounded-lg bg-muted/30 p-3">{r.message}</p>}
                <div className="space-y-2">
                  <Textarea
                    placeholder="Add notes / reply to student..."
                    defaultValue={r.counselor_notes || ''}
                    onChange={(e) => setDrafts(d => ({ ...d, [r.id]: e.target.value }))}
                    rows={2}
                  />
                  <Button size="sm" variant="outline" onClick={() => update(r.id, { counselor_notes: drafts[r.id] ?? r.counselor_notes ?? '' })}>
                    Save Notes
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
