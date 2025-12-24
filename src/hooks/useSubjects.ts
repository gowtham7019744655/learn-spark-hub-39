import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logError, getSafeErrorMessage } from '@/lib/errorLogger';
import { SubjectSchema, validateInput, safeParseInt } from '@/lib/validation';

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
      logError('fetchSubjects', error);
      toast.error(getSafeErrorMessage(error));
    } else {
      setSubjects(data || []);
    }
    setLoading(false);
  };

  const addSubject = async (name: string, maxInternal: number, maxExternal: number, semester: number) => {
    // Validate input before database operation
    const validation = validateInput(SubjectSchema, {
      name,
      max_internal: safeParseInt(maxInternal),
      max_external: safeParseInt(maxExternal),
      semester: safeParseInt(semester),
    });

    if ('error' in validation) {
      toast.error(validation.error);
      return false;
    }

    const validatedData = validation.data;
    const { error } = await supabase
      .from('subjects')
      .insert({
        name: validatedData.name,
        max_internal: validatedData.max_internal,
        max_external: validatedData.max_external,
        semester: validatedData.semester,
      });
    
    if (error) {
      logError('addSubject', error);
      toast.error(getSafeErrorMessage(error));
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
      logError('deleteSubject', error);
      toast.error(getSafeErrorMessage(error));
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
