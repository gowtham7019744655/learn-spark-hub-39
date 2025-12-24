import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logError, getSafeErrorMessage } from '@/lib/errorLogger';
import { StudentMarksSchema, validateInput, safeParseInt, validateMarksRange } from '@/lib/validation';

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
      logError('fetchMarks', error);
      toast.error(getSafeErrorMessage(error));
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

    // Validate input
    const validation = validateInput(StudentMarksSchema, {
      student_usn: targetUsn,
      subject_id: subjectId,
      internal_marks: safeParseInt(internalMarks),
      external_marks: safeParseInt(externalMarks),
      grade: grade || undefined,
    });

    if ('error' in validation) {
      toast.error(validation.error);
      return false;
    }

    const validatedData = validation.data;

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
          internal_marks: validatedData.internal_marks, 
          external_marks: validatedData.external_marks, 
          grade 
        })
        .eq('id', existing.id);
      
      if (error) {
        logError('updateMarks', error);
        toast.error(getSafeErrorMessage(error));
        return false;
      }
      toast.success('Marks updated successfully');
    } else {
      const { error } = await supabase
        .from('student_marks')
        .insert({ 
          student_usn: validatedData.student_usn, 
          subject_id: validatedData.subject_id, 
          internal_marks: validatedData.internal_marks, 
          external_marks: validatedData.external_marks, 
          grade 
        });
      
      if (error) {
        logError('addMarks', error);
        toast.error(getSafeErrorMessage(error));
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
      logError('deleteMark', error);
      toast.error(getSafeErrorMessage(error));
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
