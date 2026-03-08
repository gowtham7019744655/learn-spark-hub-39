import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronLeft, ChevronRight, Calendar, CheckCircle2, XCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface AttendanceRecord {
  id: string;
  student_usn: string;
  subject_id: string;
  date: string;
  status: string;
  subjects?: { id: string; name: string } | null;
}

interface AttendanceCalendarProps {
  records: AttendanceRecord[];
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export const AttendanceCalendar = ({ records }: AttendanceCalendarProps) => {
  const now = new Date();
  const [currentMonth, setCurrentMonth] = useState(now.getMonth());
  const [currentYear, setCurrentYear] = useState(now.getFullYear());
  const [selectedSubject, setSelectedSubject] = useState<string>('all');

  const subjects = useMemo(() => {
    const map = new Map<string, string>();
    records.forEach((r) => {
      if (r.subjects && !map.has(r.subject_id)) {
        map.set(r.subject_id, r.subjects.name);
      }
    });
    return Array.from(map, ([id, name]) => ({ id, name }));
  }, [records]);

  const filteredRecords = useMemo(() => {
    if (selectedSubject === 'all') return records;
    return records.filter((r) => r.subject_id === selectedSubject);
  }, [records, selectedSubject]);

  // Map date string -> { present: number, absent: number, subjects: string[] }
  const dateMap = useMemo(() => {
    const map: Record<string, { present: number; absent: number; subjects: string[] }> = {};
    filteredRecords.forEach((r) => {
      if (!map[r.date]) map[r.date] = { present: 0, absent: 0, subjects: [] };
      if (r.status === 'present') map[r.date].present++;
      else map[r.date].absent++;
      const subName = r.subjects?.name || 'Unknown';
      if (!map[r.date].subjects.includes(`${subName}: ${r.status}`)) {
        map[r.date].subjects.push(`${subName}: ${r.status}`);
      }
    });
    return map;
  }, [filteredRecords]);

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay();

  const calendarCells = useMemo(() => {
    const cells: (number | null)[] = [];
    for (let i = 0; i < firstDayOfWeek; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    return cells;
  }, [daysInMonth, firstDayOfWeek]);

  const goToPrev = () => {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear((y) => y - 1); }
    else setCurrentMonth((m) => m - 1);
  };
  const goToNext = () => {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear((y) => y + 1); }
    else setCurrentMonth((m) => m + 1);
  };

  const monthStats = useMemo(() => {
    let present = 0, absent = 0;
    Object.entries(dateMap).forEach(([dateStr, data]) => {
      const d = new Date(dateStr);
      if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
        present += data.present;
        absent += data.absent;
      }
    });
    const total = present + absent;
    return { present, absent, total, percentage: total > 0 ? Math.round((present / total) * 100) : 0 };
  }, [dateMap, currentMonth, currentYear]);

  const getDayCellClass = (day: number) => {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const data = dateMap[dateStr];
    if (!data) return 'bg-muted/30 text-muted-foreground';
    if (data.absent === 0 && data.present > 0) return 'bg-green-500/15 text-green-700 dark:text-green-400 ring-1 ring-green-500/30';
    if (data.present === 0 && data.absent > 0) return 'bg-destructive/15 text-destructive ring-1 ring-destructive/30';
    return 'bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 ring-1 ring-yellow-500/30';
  };

  const getDayIcon = (day: number) => {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const data = dateMap[dateStr];
    if (!data) return null;
    if (data.absent === 0 && data.present > 0) return <CheckCircle2 className="h-3 w-3 text-green-600 dark:text-green-400" />;
    if (data.present === 0 && data.absent > 0) return <XCircle className="h-3 w-3 text-destructive" />;
    return <CheckCircle2 className="h-3 w-3 text-yellow-600 dark:text-yellow-400" />;
  };

  const getTooltipContent = (day: number) => {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const data = dateMap[dateStr];
    if (!data) return 'No classes';
    return data.subjects.join('\n');
  };

  const isToday = (day: number) =>
    day === now.getDate() && currentMonth === now.getMonth() && currentYear === now.getFullYear();

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Calendar className="h-5 w-5 text-primary" />
              Attendance Calendar
            </CardTitle>
            <CardDescription>Visual overview of your attendance</CardDescription>
          </div>
          {subjects.length > 0 && (
            <Select value={selectedSubject} onValueChange={setSelectedSubject}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="All Subjects" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Subjects</SelectItem>
                {subjects.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Month navigation */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="icon" onClick={goToPrev}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h3 className="text-lg font-semibold text-foreground">
            {MONTHS[currentMonth]} {currentYear}
          </h3>
          <Button variant="ghost" size="icon" onClick={goToNext}>
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>

        {/* Month stats */}
        <div className="flex flex-wrap gap-3">
          <Badge variant="outline" className="gap-1.5 px-3 py-1.5">
            <div className="h-2.5 w-2.5 rounded-full bg-green-500" />
            Present: {monthStats.present}
          </Badge>
          <Badge variant="outline" className="gap-1.5 px-3 py-1.5">
            <div className="h-2.5 w-2.5 rounded-full bg-destructive" />
            Absent: {monthStats.absent}
          </Badge>
          <Badge variant={monthStats.percentage >= 75 ? 'default' : 'destructive'} className="px-3 py-1.5">
            {monthStats.percentage}% this month
          </Badge>
        </div>

        {/* Calendar grid */}
        <TooltipProvider delayDuration={200}>
          <div className="grid grid-cols-7 gap-1.5">
            {DAYS.map((d) => (
              <div key={d} className="py-2 text-center text-xs font-medium text-muted-foreground">
                {d}
              </div>
            ))}
            {calendarCells.map((day, idx) => (
              <div key={idx} className="aspect-square">
                {day ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div
                        className={`flex h-full w-full flex-col items-center justify-center rounded-lg text-sm font-medium transition-all cursor-default ${getDayCellClass(day)} ${isToday(day) ? 'ring-2 ring-primary' : ''}`}
                      >
                        <span>{day}</span>
                        {getDayIcon(day)}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-[200px]">
                      <p className="whitespace-pre-line text-xs">{getTooltipContent(day)}</p>
                    </TooltipContent>
                  </Tooltip>
                ) : null}
              </div>
            ))}
          </div>
        </TooltipProvider>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 border-t border-border pt-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <div className="h-4 w-4 rounded bg-green-500/15 ring-1 ring-green-500/30" />
            Present
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-4 w-4 rounded bg-destructive/15 ring-1 ring-destructive/30" />
            Absent
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-4 w-4 rounded bg-yellow-500/15 ring-1 ring-yellow-500/30" />
            Partial
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-4 w-4 rounded bg-muted/30" />
            No class
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
