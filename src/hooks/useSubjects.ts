import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Subject {
  id: string;
  name: string;
  max_internal: number;
  max_external: number;
  semester: number;
  created_at: string;
}

export const useSubjects = () => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSubjects = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('subjects')
      .select('*')
      .order('name');
    
    if (error) {
      console.error('Error fetching subjects:', error);
      toast.error('Failed to load subjects');
    } else {
      setSubjects(data || []);
    }
    setLoading(false);
  };

  const addSubject = async (name: string, maxInternal: number, maxExternal: number, semester: number) => {
    const { error } = await supabase
      .from('subjects')
      .insert({ name, max_internal: maxInternal, max_external: maxExternal, semester });
    
    if (error) {
      console.error('Error adding subject:', error);
      toast.error('Failed to add subject');
      return false;
    }
    toast.success('Subject added successfully');
    fetchSubjects();
    return true;
  };

  const deleteSubject = async (id: string) => {
    const { error } = await supabase
      .from('subjects')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting subject:', error);
      toast.error('Failed to delete subject');
      return false;
    }
    toast.success('Subject deleted successfully');
    fetchSubjects();
    return true;
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  return { subjects, loading, addSubject, deleteSubject, fetchSubjects };
};
