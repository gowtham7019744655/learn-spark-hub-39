import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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

export const useAssignments = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: assignments = [], isLoading, error } = useQuery({
    queryKey: ['assignments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('assignments')
        .select('*')
        .order('due_date', { ascending: true });
      
      if (error) throw error;
      return data as Assignment[];
    },
  });

  const addAssignment = useMutation({
    mutationFn: async (assignment: { 
      title: string; 
      description?: string; 
      course_code: string; 
      due_date: string;
      created_by: string;
    }) => {
      const { data, error } = await supabase
        .from('assignments')
        .insert([assignment])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
      toast({
        title: 'Success',
        description: 'Assignment created successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const deleteAssignment = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('assignments')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
      toast({
        title: 'Success',
        description: 'Assignment deleted successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    assignments,
    isLoading,
    error,
    addAssignment,
    deleteAssignment,
  };
};
