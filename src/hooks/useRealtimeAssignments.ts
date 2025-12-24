import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Assignment {
  id: string;
  title: string;
  description: string | null;
  course_code: string;
  due_date: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export const useRealtimeAssignments = () => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAssignments = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('assignments')
      .select('*')
      .order('due_date', { ascending: true });

    if (error) {
      console.error('Error fetching assignments:', error);
      toast.error('Failed to load assignments');
    } else {
      setAssignments(data || []);
    }
    setLoading(false);
  }, []);

  const addAssignment = async (assignment: Omit<Assignment, 'id' | 'created_at' | 'updated_at'>) => {
    const { error } = await supabase.from('assignments').insert(assignment);
    if (error) {
      console.error('Error adding assignment:', error);
      toast.error('Failed to add assignment');
      return false;
    }
    toast.success('Assignment created successfully');
    return true;
  };

  const deleteAssignment = async (id: string) => {
    const { error } = await supabase.from('assignments').delete().eq('id', id);
    if (error) {
      console.error('Error deleting assignment:', error);
      toast.error('Failed to delete assignment');
      return false;
    }
    toast.success('Assignment deleted successfully');
    return true;
  };

  // Set up realtime subscription
  useEffect(() => {
    fetchAssignments();

    const channel = supabase
      .channel('assignments-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'assignments',
        },
        (payload) => {
          console.log('Assignment change:', payload);
          if (payload.eventType === 'INSERT') {
            toast.info('New assignment posted!');
          } else if (payload.eventType === 'UPDATE') {
            toast.info('Assignment updated');
          } else if (payload.eventType === 'DELETE') {
            toast.info('Assignment removed');
          }
          fetchAssignments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchAssignments]);

  return { assignments, loading, addAssignment, deleteAssignment, fetchAssignments };
};
