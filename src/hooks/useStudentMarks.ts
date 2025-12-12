import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface StudentMark {
  id: string;
  student_usn: string;
  subject_id: string;
  internal_marks: number;
  external_marks: number;
  grade: string | null;
  created_at: string;
  updated_at: string;
  subjects?: {
    id: string;
    name: string;
    max_internal: number;
    max_external: number;
  };
}

export const useStudentMarks = (studentUsn?: string) => {
  const [marks, setMarks] = useState<StudentMark[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMarks = async () => {
    if (!studentUsn) {
      setMarks([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const { data, error } = await supabase
      .from('student_marks')
      .select(`
        *,
        subjects (
          id,
          name,
          max_internal,
          max_external
        )
      `)
      .eq('student_usn', studentUsn);
    
    if (error) {
      console.error('Error fetching marks:', error);
      toast.error('Failed to load marks');
    } else {
      setMarks(data || []);
    }
    setLoading(false);
  };

  const addOrUpdateMark = async (
    subjectId: string, 
    internalMarks: number, 
    externalMarks: number, 
    grade: string,
    usn?: string
  ) => {
    const targetUsn = usn || studentUsn;
    if (!targetUsn) return false;

    const { data: existing } = await supabase
      .from('student_marks')
      .select('id')
      .eq('student_usn', targetUsn)
      .eq('subject_id', subjectId)
      .maybeSingle();

    if (existing) {
      const { error } = await supabase
        .from('student_marks')
        .update({ 
          internal_marks: internalMarks, 
          external_marks: externalMarks, 
          grade 
        })
        .eq('id', existing.id);
      
      if (error) {
        console.error('Error updating marks:', error);
        toast.error('Failed to update marks');
        return false;
      }
      toast.success('Marks updated successfully');
    } else {
      const { error } = await supabase
        .from('student_marks')
        .insert({ 
          student_usn: targetUsn, 
          subject_id: subjectId, 
          internal_marks: internalMarks, 
          external_marks: externalMarks, 
          grade 
        });
      
      if (error) {
        console.error('Error adding marks:', error);
        toast.error('Failed to add marks');
        return false;
      }
      toast.success('Marks added successfully');
    }
    
    fetchMarks();
    return true;
  };

  const deleteMark = async (id: string) => {
    const { error } = await supabase
      .from('student_marks')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting marks:', error);
      toast.error('Failed to delete marks');
      return false;
    }
    toast.success('Marks deleted successfully');
    fetchMarks();
    return true;
  };

  useEffect(() => {
    fetchMarks();
  }, [studentUsn]);

  return { marks, loading, addOrUpdateMark, deleteMark, fetchMarks };
};
