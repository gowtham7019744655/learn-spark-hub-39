import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Compass, Star, Target, BookOpen, Trophy, Lightbulb, Youtube, ExternalLink, GraduationCap, Globe } from 'lucide-react';
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  Radar, ResponsiveContainer, Tooltip,
} from 'recharts';

const interestOptions = [
  'Programming', 'Data Science', 'Web Development', 'Machine Learning',
  'Cybersecurity', 'Cloud Computing', 'Mobile Development', 'Game Development',
  'Sports', 'Music', 'Art & Design', 'Research',
];

const skillData = [
  { skill: 'Problem Solving', score: 85 },
  { skill: 'Communication', score: 72 },
  { skill: 'Teamwork', score: 78 },
  { skill: 'Technical Skills', score: 90 },
  { skill: 'Creativity', score: 65 },
  { skill: 'Leadership', score: 60 },
];

const careerPaths = [
  { title: 'Software Engineer', match: 92, description: 'Strong technical and problem-solving skills align well with software engineering roles.' },
  { title: 'Data Scientist', match: 85, description: 'Good analytical foundation with room to grow in statistics and ML.' },
  { title: 'Full Stack Developer', match: 88, description: 'Well-rounded skills in both frontend and backend development.' },
];

interface SkillInterestAnalysisProps {
  marks: any[];
}

export const SkillInterestAnalysis = ({ marks }: SkillInterestAnalysisProps) => {
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);

  const toggleInterest = (interest: string) => {
    setSelectedInterests(prev =>
      prev.includes(interest)
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    );
  };

  // Derive strong/weak subjects from marks
  const subjectStrengths = marks.map(m => {
    const total = m.internal_marks + m.external_marks;
    const max = (m.subjects?.max_internal || 50) + (m.subjects?.max_external || 100);
    const percentage = max > 0 ? Math.round((total / max) * 100) : 0;
    return { name: m.subjects?.name || 'Unknown', percentage, grade: m.grade };
  }).sort((a, b) => b.percentage - a.percentage);

  const strongSubjects = subjectStrengths.filter(s => s.percentage >= 70);
  const weakSubjects = subjectStrengths.filter(s => s.percentage < 50);

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Strong & Weak Subjects */}
        <Card className="overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Trophy className="h-5 w-5 text-primary" />
              Strong & Weak Subjects
            </CardTitle>
            <CardDescription>Based on your current marks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {marks.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No marks data available</p>
            ) : (
              <>
                <div>
                  <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-1.5">
                    <Star className="h-4 w-4 text-primary" /> Strong Subjects
                  </h4>
                  {strongSubjects.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No strong subjects yet</p>
                  ) : (
                    <div className="space-y-2">
                      {strongSubjects.map(s => (
                        <div key={s.name} className="flex items-center justify-between rounded-lg border border-border/50 bg-muted/20 p-2.5">
                          <span className="text-sm font-medium text-foreground">{s.name}</span>
                          <div className="flex items-center gap-2">
                            <Badge variant="default" className="text-xs">{s.percentage}%</Badge>
                            <Badge variant="outline" className="text-xs">{s.grade}</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-1.5">
                    <Target className="h-4 w-4 text-destructive" /> Weak Subjects
                  </h4>
                  {weakSubjects.length === 0 ? (
                    <p className="text-xs text-muted-foreground">Great! No weak subjects detected</p>
                  ) : (
                    <div className="space-y-2">
                      {weakSubjects.map(s => (
                        <div key={s.name} className="flex items-center justify-between rounded-lg border border-border/50 bg-muted/20 p-2.5">
                          <span className="text-sm font-medium text-foreground">{s.name}</span>
                          <div className="flex items-center gap-2">
                            <Badge variant="destructive" className="text-xs">{s.percentage}%</Badge>
                            <Badge variant="outline" className="text-xs">{s.grade}</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Skill Alignment */}
        <Card className="overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Compass className="h-5 w-5 text-primary" />
              Skill Alignment Graph
            </CardTitle>
            <CardDescription>Your skill profile across key areas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={skillData}>
                  <PolarGrid className="stroke-border" />
                  <PolarAngleAxis dataKey="skill" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10 }} />
                  <Radar name="Skills" dataKey="score" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.2} strokeWidth={2} />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '0.75rem' }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Interest Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Lightbulb className="h-5 w-5 text-primary" />
            Interest Selection
          </CardTitle>
          <CardDescription>Select your interests to get personalized career path suggestions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 mb-6">
            {interestOptions.map(interest => (
              <Badge
                key={interest}
                variant={selectedInterests.includes(interest) ? 'default' : 'outline'}
                className="cursor-pointer text-sm px-3 py-1.5 transition-all hover:scale-105"
                onClick={() => toggleInterest(interest)}
              >
                {interest}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Career Path Suggestions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <BookOpen className="h-5 w-5 text-primary" />
            Career Path Suggestions
          </CardTitle>
          <CardDescription>AI-recommended career paths based on your skills and interests</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {careerPaths.map(path => (
              <div key={path.title} className="group rounded-xl border border-border p-5 transition-all hover:shadow-sm hover:border-primary/30">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-foreground">{path.title}</h4>
                  <Badge variant="default" className="text-xs">{path.match}% Match</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{path.description}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
