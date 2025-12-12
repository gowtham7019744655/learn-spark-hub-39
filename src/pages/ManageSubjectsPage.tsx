import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useSubjects } from '@/hooks/useSubjects';
import { useStudentMarks } from '@/hooks/useStudentMarks';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Trash2, Edit, BookOpen, GraduationCap } from 'lucide-react';
import { Navigate } from 'react-router-dom';

const ManageSubjectsPage = () => {
  const { role, isAuthenticated } = useAuth();
  const { subjects, loading: subjectsLoading, addSubject, deleteSubject } = useSubjects();
  
  // Subject form state
  const [newSubjectName, setNewSubjectName] = useState('');
  const [newMaxInternal, setNewMaxInternal] = useState('50');
  const [newMaxExternal, setNewMaxExternal] = useState('100');
  const [newSemester, setNewSemester] = useState('6');
  const [subjectDialogOpen, setSubjectDialogOpen] = useState(false);

  // Marks form state
  const [marksUsn, setMarksUsn] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [internalMarks, setInternalMarks] = useState('');
  const [externalMarks, setExternalMarks] = useState('');
  const [grade, setGrade] = useState('');
  const [marksDialogOpen, setMarksDialogOpen] = useState(false);

  const { marks, loading: marksLoading, addOrUpdateMark, deleteMark, fetchMarks } = useStudentMarks(marksUsn);

  if (!isAuthenticated || role !== 'lecturer') {
    return <Navigate to="/login/lecturer" replace />;
  }

  const handleAddSubject = async () => {
    if (!newSubjectName.trim()) return;
    const success = await addSubject(
      newSubjectName.trim(),
      parseInt(newMaxInternal),
      parseInt(newMaxExternal),
      parseInt(newSemester)
    );
    if (success) {
      setNewSubjectName('');
      setNewMaxInternal('50');
      setNewMaxExternal('100');
      setNewSemester('6');
      setSubjectDialogOpen(false);
    }
  };

  const handleAddMarks = async () => {
    if (!marksUsn.trim() || !selectedSubjectId) return;
    const success = await addOrUpdateMark(
      selectedSubjectId,
      parseInt(internalMarks) || 0,
      parseInt(externalMarks) || 0,
      grade,
      marksUsn.trim()
    );
    if (success) {
      setSelectedSubjectId('');
      setInternalMarks('');
      setExternalMarks('');
      setGrade('');
      setMarksDialogOpen(false);
    }
  };

  const handleSearchMarks = () => {
    if (marksUsn.trim()) {
      fetchMarks();
    }
  };

  return (
    <MainLayout>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Manage Subjects & Marks</h1>
          <p className="text-muted-foreground">Add, edit or delete subjects and student marks</p>
        </div>

        <Tabs defaultValue="subjects" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="subjects" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Subjects
            </TabsTrigger>
            <TabsTrigger value="marks" className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4" />
              Marks
            </TabsTrigger>
          </TabsList>

          {/* Subjects Tab */}
          <TabsContent value="subjects">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Subjects</CardTitle>
                  <CardDescription>Manage available subjects for students</CardDescription>
                </div>
                <Dialog open={subjectDialogOpen} onOpenChange={setSubjectDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Subject
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Subject</DialogTitle>
                      <DialogDescription>Enter the details for the new subject</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="subjectName">Subject Name</Label>
                        <Input
                          id="subjectName"
                          value={newSubjectName}
                          onChange={(e) => setNewSubjectName(e.target.value)}
                          placeholder="e.g., Advanced Mathematics"
                        />
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="maxInternal">Max Internal</Label>
                          <Input
                            id="maxInternal"
                            type="number"
                            value={newMaxInternal}
                            onChange={(e) => setNewMaxInternal(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="maxExternal">Max External</Label>
                          <Input
                            id="maxExternal"
                            type="number"
                            value={newMaxExternal}
                            onChange={(e) => setNewMaxExternal(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="semester">Semester</Label>
                          <Input
                            id="semester"
                            type="number"
                            value={newSemester}
                            onChange={(e) => setNewSemester(e.target.value)}
                          />
                        </div>
                      </div>
                      <Button onClick={handleAddSubject} className="w-full">
                        Add Subject
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {subjectsLoading ? (
                  <p className="text-muted-foreground">Loading subjects...</p>
                ) : subjects.length === 0 ? (
                  <p className="text-muted-foreground">No subjects found. Add one to get started.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Subject Name</th>
                          <th className="px-4 py-3 text-center text-sm font-semibold text-foreground">Max Internal</th>
                          <th className="px-4 py-3 text-center text-sm font-semibold text-foreground">Max External</th>
                          <th className="px-4 py-3 text-center text-sm font-semibold text-foreground">Semester</th>
                          <th className="px-4 py-3 text-center text-sm font-semibold text-foreground">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {subjects.map((subject) => (
                          <tr key={subject.id} className="border-b border-border last:border-0">
                            <td className="px-4 py-3 font-medium text-foreground">{subject.name}</td>
                            <td className="px-4 py-3 text-center text-foreground">{subject.max_internal}</td>
                            <td className="px-4 py-3 text-center text-foreground">{subject.max_external}</td>
                            <td className="px-4 py-3 text-center">
                              <Badge variant="secondary">Sem {subject.semester}</Badge>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => deleteSubject(subject.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Marks Tab */}
          <TabsContent value="marks">
            <Card>
              <CardHeader>
                <CardTitle>Student Marks</CardTitle>
                <CardDescription>Search by USN and manage student marks</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Search Section */}
                <div className="flex gap-4">
                  <div className="flex-1">
                    <Input
                      placeholder="Enter Student USN (e.g., 1XX21CS001)"
                      value={marksUsn}
                      onChange={(e) => setMarksUsn(e.target.value.toUpperCase())}
                    />
                  </div>
                  <Button onClick={handleSearchMarks}>Search</Button>
                  <Dialog open={marksDialogOpen} onOpenChange={setMarksDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" disabled={!marksUsn.trim()}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Marks
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add/Update Marks</DialogTitle>
                        <DialogDescription>Enter marks for USN: {marksUsn}</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label>Subject</Label>
                          <Select value={selectedSubjectId} onValueChange={setSelectedSubjectId}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a subject" />
                            </SelectTrigger>
                            <SelectContent>
                              {subjects.map((subject) => (
                                <SelectItem key={subject.id} value={subject.id}>
                                  {subject.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="internalMarks">Internal</Label>
                            <Input
                              id="internalMarks"
                              type="number"
                              value={internalMarks}
                              onChange={(e) => setInternalMarks(e.target.value)}
                              placeholder="0"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="externalMarks">External</Label>
                            <Input
                              id="externalMarks"
                              type="number"
                              value={externalMarks}
                              onChange={(e) => setExternalMarks(e.target.value)}
                              placeholder="0"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="grade">Grade</Label>
                            <Input
                              id="grade"
                              value={grade}
                              onChange={(e) => setGrade(e.target.value.toUpperCase())}
                              placeholder="A+"
                            />
                          </div>
                        </div>
                        <Button onClick={handleAddMarks} className="w-full">
                          Save Marks
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                {/* Marks Table */}
                {marksUsn.trim() && (
                  <>
                    {marksLoading ? (
                      <p className="text-muted-foreground">Loading marks...</p>
                    ) : marks.length === 0 ? (
                      <p className="text-muted-foreground">No marks found for this student. Add marks to get started.</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b border-border">
                              <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Subject</th>
                              <th className="px-4 py-3 text-center text-sm font-semibold text-foreground">Internal</th>
                              <th className="px-4 py-3 text-center text-sm font-semibold text-foreground">External</th>
                              <th className="px-4 py-3 text-center text-sm font-semibold text-foreground">Total</th>
                              <th className="px-4 py-3 text-center text-sm font-semibold text-foreground">Grade</th>
                              <th className="px-4 py-3 text-center text-sm font-semibold text-foreground">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {marks.map((mark) => (
                              <tr key={mark.id} className="border-b border-border last:border-0">
                                <td className="px-4 py-3 font-medium text-foreground">
                                  {mark.subjects?.name || 'Unknown'}
                                </td>
                                <td className="px-4 py-3 text-center text-foreground">{mark.internal_marks}</td>
                                <td className="px-4 py-3 text-center text-foreground">{mark.external_marks}</td>
                                <td className="px-4 py-3 text-center font-semibold text-foreground">
                                  {mark.internal_marks + mark.external_marks}
                                </td>
                                <td className="px-4 py-3 text-center">
                                  <Badge variant={mark.grade?.startsWith('A') ? 'default' : 'secondary'}>
                                    {mark.grade || '-'}
                                  </Badge>
                                </td>
                                <td className="px-4 py-3 text-center">
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => deleteMark(mark.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default ManageSubjectsPage;
