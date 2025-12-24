import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logError, getSafeErrorMessage } from '@/lib/errorLogger';

export interface Test {
  id: string;
  title: string;
  description: string | null;
  subject_id: string | null;
  duration_minutes: number;
  total_questions: number;
  max_score: number;
  due_date: string | null;
  created_by: string;
  status: 'draft' | 'published' | 'closed';
  created_at: string;
  updated_at: string;
  subjects?: {
    id: string;
    name: string;
  };
}

export interface StudentTest {
  id: string;
  test_id: string;
  student_usn: string;
  score: number | null;
  status: 'pending' | 'in_progress' | 'completed';
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  tests?: Test;
}

export const useTests = () => {
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTests = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('tests')
      .select(`
        *,
        subjects (
          id,
          name
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      logError('fetchTests', error);
      toast.error(getSafeErrorMessage(error));
    } else {
      setTests((data as Test[]) || []);
    }
    setLoading(false);
  }, []);

  const addTest = async (test: Omit<Test, 'id' | 'created_at' | 'updated_at' | 'subjects'>) => {
    const { error } = await supabase.from('tests').insert(test);
    if (error) {
      logError('addTest', error);
      toast.error(getSafeErrorMessage(error));
      return false;
    }
    toast.success('Test created successfully');
    return true;
  };

  const updateTest = async (id: string, updates: Partial<Test>) => {
    const { error } = await supabase.from('tests').update(updates).eq('id', id);
    if (error) {
      logError('updateTest', error);
      toast.error(getSafeErrorMessage(error));
      return false;
    }
    toast.success('Test updated successfully');
    return true;
  };

  const deleteTest = async (id: string) => {
    const { error } = await supabase.from('tests').delete().eq('id', id);
    if (error) {
      logError('deleteTest', error);
      toast.error(getSafeErrorMessage(error));
      return false;
    }
    toast.success('Test deleted successfully');
    return true;
  };

  // Set up realtime subscription
  useEffect(() => {
    fetchTests();

    const channel = supabase
      .channel('tests-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tests',
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            toast.info('New test available!');
          } else if (payload.eventType === 'UPDATE') {
            toast.info('Test updated');
          }
          fetchTests();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchTests]);

  return { tests, loading, addTest, updateTest, deleteTest, fetchTests };
};

export const useStudentTests = (studentUsn?: string) => {
  const [studentTests, setStudentTests] = useState<StudentTest[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStudentTests = useCallback(async () => {
    if (!studentUsn) {
      setStudentTests([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const { data, error } = await supabase
      .from('student_tests')
      .select(`
        *,
        tests (
          *,
          subjects (
            id,
            name
          )
        )
      `)
      .eq('student_usn', studentUsn);

    if (error) {
      logError('fetchStudentTests', error);
    } else {
      setStudentTests((data as StudentTest[]) || []);
    }
    setLoading(false);
  }, [studentUsn]);

  useEffect(() => {
    fetchStudentTests();

    if (!studentUsn) return;

    const channel = supabase
      .channel('student-tests-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'student_tests',
        },
        () => {
          fetchStudentTests();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [studentUsn, fetchStudentTests]);

  return { studentTests, loading, fetchStudentTests };
};
