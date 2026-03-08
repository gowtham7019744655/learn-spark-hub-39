import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logError } from '@/lib/errorLogger';

interface AttendanceRecord {
  id: string;
  student_usn: string;
  subject_id: string;
  date: string;
  status: string;
  marked_by: string;
  created_at: string;
  subjects?: { id: string; name: string } | null;
}

interface AttendanceSummary {
  subject_id: string;
  subject_name: string;
  total_classes: number;
  present: number;
  absent: number;
  percentage: number;
}

export const useAttendance = (studentUsn?: string) => {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAttendance = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('attendance')
        .select('*, subjects(id, name)')
        .order('date', { ascending: false });

      if (studentUsn) {
        query = query.eq('student_usn', studentUsn);
      }

      const { data, error } = await query;
      if (error) throw error;
      setRecords(data || []);
    } catch (error) {
      logError('fetchAttendance', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();

    const channel = supabase
      .channel('attendance-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'attendance' }, () => {
        fetchAttendance();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [studentUsn]);

  const markAttendance = async (
    studentUsns: string[],
    subjectId: string,
    date: string,
    status: string,
    markedBy: string
  ) => {
    try {
      const rows = studentUsns.map(usn => ({
        student_usn: usn,
        subject_id: subjectId,
        date,
        status,
        marked_by: markedBy,
      }));

      const { error } = await supabase.from('attendance').upsert(rows, {
        onConflict: 'student_usn,subject_id,date',
      });

      if (error) throw error;
      toast.success(`Attendance marked for ${studentUsns.length} student(s)`);
      return true;
    } catch (error) {
      logError('markAttendance', error);
      toast.error('Failed to mark attendance');
      return false;
    }
  };

  const getSummaryByStudent = (usn?: string): AttendanceSummary[] => {
    const filtered = usn ? records.filter(r => r.student_usn === usn) : records;
    const groups: Record<string, AttendanceRecord[]> = {};
    filtered.forEach(r => {
      if (!groups[r.subject_id]) groups[r.subject_id] = [];
      groups[r.subject_id].push(r);
    });

    return Object.entries(groups).map(([subjectId, recs]) => {
      const present = recs.filter(r => r.status === 'present').length;
      const absent = recs.filter(r => r.status !== 'present').length;
      return {
        subject_id: subjectId,
        subject_name: recs[0]?.subjects?.name || 'Unknown',
        total_classes: recs.length,
        present,
        absent,
        percentage: recs.length > 0 ? Math.round((present / recs.length) * 100) : 0,
      };
    });
  };

  const getOverallPercentage = (usn?: string): number => {
    const filtered = usn ? records.filter(r => r.student_usn === usn) : records;
    if (filtered.length === 0) return 0;
    const present = filtered.filter(r => r.status === 'present').length;
    return Math.round((present / filtered.length) * 100);
  };

  const getStudentAttendanceSummaries = () => {
    const groups: Record<string, AttendanceRecord[]> = {};
    records.forEach(r => {
      if (!groups[r.student_usn]) groups[r.student_usn] = [];
      groups[r.student_usn].push(r);
    });

    return Object.entries(groups).map(([usn, recs]) => {
      const present = recs.filter(r => r.status === 'present').length;
      return {
        usn,
        totalClasses: recs.length,
        present,
        absent: recs.length - present,
        percentage: recs.length > 0 ? Math.round((present / recs.length) * 100) : 0,
      };
    }).sort((a, b) => a.percentage - b.percentage);
  };

  return {
    records,
    loading,
    markAttendance,
    getSummaryByStudent,
    getOverallPercentage,
    getStudentAttendanceSummaries,
    refetch: fetchAttendance,
  };
};
